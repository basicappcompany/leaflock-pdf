import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import type { CommonMessages } from '../../../i18n';
import { clampBox, type OverlayItem } from '../../../lib/edit/overlays';
import type { PDFDocumentProxy } from '../../../lib/pdfjs';
import { PagePreview, type PageSize } from '../../ui/PagePreview';
import { Pager } from './Pager';
import { useElementSize } from './useElementSize';
import '../../../styles/edit.css';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Props<T extends OverlayItem> {
  doc: PDFDocumentProxy;
  pageCount: number;
  /** 0-based page shown. */
  page: number;
  onPageChange: (page: number) => void;
  /** Items on every page; only the current page's are shown. */
  items: T[];
  onChange: (items: T[]) => void;
  selectedId: string | undefined;
  onSelect: (id: string | undefined) => void;
  /** Content of an item; `scale` is CSS pixels per PDF point, for sizing text. */
  renderItem: (item: T, scale: number) => ReactNode;
  itemLabel: (item: T) => string;
  /** When set, dragging on an empty part of the page draws a new box. */
  onDraw?: ((page: number, box: Box) => void) | undefined;
  /** A click (not a drag) on an empty part of the page, at page fractions. */
  onPageClick?: ((page: number, x: number, y: number) => void) | undefined;
  /** Resize keeps the item's proportions (signatures, images). */
  keepAspect?: (item: T) => boolean;
  /** Displayed size of the current page in points. */
  onPageSize?: (size: PageSize) => void;
  previewLabel: string;
  common: CommonMessages;
  disabled?: boolean;
}

type Gesture =
  | { type: 'move' | 'resize'; pointerId: number; startX: number; startY: number; item: OverlayItem; moved: boolean }
  | { type: 'draw'; pointerId: number; startX: number; startY: number; origin: { x: number; y: number }; moved: boolean };

const NUDGE = 0.005;
const NUDGE_FAST = 0.05;
const MIN_DRAW = 0.01;

/** A page preview with movable, resizable items on top. Positions are fractions of the page. */
export function OverlayEditor<T extends OverlayItem>(props: Props<T>) {
  const { doc, pageCount, page, items, selectedId, onSelect, renderItem, itemLabel, common, disabled } = props;
  const surfaceRef = useRef<HTMLDivElement>(null);
  const surface = useElementSize(surfaceRef);
  const [pageSize, setPageSize] = useState<PageSize>();
  const [draft, setDraftState] = useState<Box>();
  // The pointer-up handler may run before React renders the last move, so it reads the ref.
  const draftRef = useRef<Box | undefined>(undefined);
  function setDraft(next: Box | undefined) {
    draftRef.current = next;
    setDraftState(next);
  }
  const gesture = useRef<Gesture>(undefined);
  // Pointer handlers read the latest items, not the ones from when the drag began.
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const scale = pageSize && surface.width > 0 ? surface.width / pageSize.width : 1;

  function update(next: OverlayItem) {
    props.onChange(itemsRef.current.map((item) => (item.id === next.id ? (next as T) : item)));
  }

  function fraction(event: PointerEvent): { x: number; y: number } {
    const rect = surfaceRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1),
      y: Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1),
    };
  }

  function startItemGesture(event: PointerEvent, item: T, type: 'move' | 'resize') {
    if (disabled || event.button !== 0) return;
    event.stopPropagation();
    event.preventDefault();
    onSelect(item.id);
    surfaceRef.current?.setPointerCapture(event.pointerId);
    gesture.current = { type, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, item, moved: false };
  }

  function onSurfaceDown(event: PointerEvent) {
    if (disabled || event.button !== 0) return;
    surfaceRef.current?.setPointerCapture(event.pointerId);
    gesture.current = {
      type: 'draw',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: fraction(event),
      moved: false,
    };
  }

  function onSurfaceMove(event: PointerEvent) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId || surface.width === 0) return;
    const dx = (event.clientX - current.startX) / surface.width;
    const dy = (event.clientY - current.startY) / surface.height;
    if (Math.abs(event.clientX - current.startX) + Math.abs(event.clientY - current.startY) > 3) current.moved = true;
    if (!current.moved) return;

    if (current.type === 'move') {
      update(clampBox({ ...current.item, x: current.item.x + dx, y: current.item.y + dy }));
    } else if (current.type === 'resize') {
      const start = current.item;
      const w = start.w + dx;
      const h = props.keepAspect?.(start as T) ? w * (start.h / start.w) : start.h + dy;
      update(clampBox({ ...start, w, h }));
    } else if (current.type === 'draw' && props.onDraw) {
      const point = fraction(event);
      setDraft({
        x: Math.min(point.x, current.origin.x),
        y: Math.min(point.y, current.origin.y),
        w: Math.abs(point.x - current.origin.x),
        h: Math.abs(point.y - current.origin.y),
      });
    }
  }

  function onSurfaceUp(event: PointerEvent) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = undefined;
    if (current.type !== 'draw') return;

    const box = draftRef.current;
    setDraft(undefined);
    if (current.moved && box && props.onDraw && box.w > MIN_DRAW && box.h > MIN_DRAW) {
      props.onDraw(page, box);
    } else if (!current.moved) {
      if (props.onPageClick) props.onPageClick(page, current.origin.x, current.origin.y);
      else onSelect(undefined);
    }
  }

  function onItemKey(event: KeyboardEvent, item: T) {
    if (disabled) return;
    const step = event.shiftKey ? NUDGE_FAST : NUDGE;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      update(clampBox({ ...item, x: item.x + move[0], y: item.y + move[1] }));
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      props.onChange(itemsRef.current.filter((other) => other.id !== item.id));
      onSelect(undefined);
    } else if (event.key === 'Escape') {
      onSelect(undefined);
      (event.currentTarget as HTMLElement).blur();
    }
  }

  const percent = (value: number) => `${value * 100}%`;
  const pageItems = items.filter((item) => item.page === page);

  return (
    <div className="overlay-editor">
      <Pager
        page={page}
        pageCount={pageCount}
        onChange={(next) => {
          onSelect(undefined);
          props.onPageChange(next);
        }}
        common={common}
        disabled={disabled}
      />
      <PagePreview
        doc={doc}
        pageNumber={page + 1}
        alt={props.previewLabel}
        onSize={(size) => {
          setPageSize(size);
          props.onPageSize?.(size);
        }}
      >
        <div
          ref={surfaceRef}
          className={props.onDraw ? 'overlay-surface is-drawing' : props.onPageClick ? 'overlay-surface is-placing' : 'overlay-surface'}
          onPointerDown={onSurfaceDown}
          onPointerMove={onSurfaceMove}
          onPointerUp={onSurfaceUp}
          onPointerCancel={onSurfaceUp}
        >
          {pageItems.map((item) => {
            const selected = item.id === selectedId;
            return (
              <div
                key={item.id}
                className={selected ? `overlay-item overlay-item--${item.kind} is-selected` : `overlay-item overlay-item--${item.kind}`}
                style={{ left: percent(item.x), top: percent(item.y), width: percent(item.w), height: percent(item.h) }}
                role="button"
                tabIndex={0}
                aria-label={itemLabel(item)}
                aria-pressed={selected}
                onPointerDown={(event) => startItemGesture(event, item, 'move')}
                onFocus={() => onSelect(item.id)}
                onKeyDown={(event) => onItemKey(event, item)}
              >
                {renderItem(item, scale)}
                {selected && !disabled && (
                  <span
                    className="overlay-item__handle"
                    aria-hidden="true"
                    onPointerDown={(event) => startItemGesture(event, item, 'resize')}
                  />
                )}
              </div>
            );
          })}
          {draft && (
            <div
              className="overlay-draft"
              style={{ left: percent(draft.x), top: percent(draft.y), width: percent(draft.w), height: percent(draft.h) }}
            />
          )}
        </div>
      </PagePreview>
    </div>
  );
}
