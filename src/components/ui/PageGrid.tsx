import { useState, type ReactNode } from 'react';
import { format, type CommonMessages } from '../../i18n';
import type { PDFDocumentProxy } from '../../lib/pdfjs';
import { PageThumbnail } from './PageThumbnail';

export interface GridPage {
  /** Stable key for React. */
  key: string;
  /** Which document this page comes from (for multi-file tools). */
  doc: PDFDocumentProxy;
  /** 0-based page index in that document. */
  index: number;
  rotation?: number;
  /** Shown under the thumbnail; defaults to "Page n". */
  label?: string;
  selected?: boolean;
  /** Greyed out, e.g. marked for removal. */
  dimmed?: boolean;
}

interface Props {
  pages: GridPage[];
  common: CommonMessages;
  /** Click or Space/Enter on a page; omit for a non-selectable grid. */
  onToggle?: (page: GridPage, position: number) => void;
  /** Enables drag-to-reorder. Keyboard users get the per-page controls instead. */
  onMove?: (from: number, to: number) => void;
  /** Extra buttons under each page. */
  controls?: (page: GridPage, position: number) => ReactNode;
}

/** Thumbnails of pages, optionally selectable and reorderable by drag and drop. */
export function PageGrid({ pages, common, onToggle, onMove, controls }: Props) {
  const [dragFrom, setDragFrom] = useState<number>();
  const [dragOver, setDragOver] = useState<number>();

  return (
    <ol className="page-grid">
      {pages.map((page, position) => {
        const label = page.label ?? format(common.pages.page, { number: page.index + 1 });
        const classes = [
          'page-grid__item',
          page.selected && 'is-selected',
          page.dimmed && 'is-dimmed',
          dragOver === position && dragFrom !== position && 'is-drop-target',
        ].filter(Boolean);
        return (
          <li
            key={page.key}
            className={classes.join(' ')}
            draggable={!!onMove}
            onDragStart={(event) => {
              setDragFrom(position);
              event.dataTransfer.effectAllowed = 'move';
            }}
            onDragOver={(event) => {
              if (dragFrom === undefined) return;
              event.preventDefault();
              setDragOver(position);
            }}
            onDragEnd={() => {
              setDragFrom(undefined);
              setDragOver(undefined);
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (dragFrom !== undefined && dragFrom !== position) onMove?.(dragFrom, position);
              setDragFrom(undefined);
              setDragOver(undefined);
            }}
          >
            {onToggle ? (
              <button
                type="button"
                className="page-grid__page"
                aria-pressed={!!page.selected}
                onClick={() => onToggle(page, position)}
              >
                <PageThumbnail doc={page.doc} pageNumber={page.index + 1} rotation={page.rotation ?? 0} alt="" />
                <span className="page-grid__label">{label}</span>
              </button>
            ) : (
              <div className="page-grid__page">
                <PageThumbnail doc={page.doc} pageNumber={page.index + 1} rotation={page.rotation ?? 0} alt="" />
                <span className="page-grid__label">{label}</span>
              </div>
            )}
            {controls && <div className="page-grid__controls">{controls(page, position)}</div>}
          </li>
        );
      })}
    </ol>
  );
}

/** Moves one item in an array; used with `onMove`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next;
}
