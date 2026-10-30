import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { format, type CommonMessages } from '../../../i18n';
import { heicToJpeg, isHeic } from '../../../lib/convert/heic';
import { moveItem } from '../../ui/PageGrid';

export interface ImageItem {
  id: string;
  name: string;
  blob: Blob;
}

export function imageItem(name: string, blob: Blob): ImageItem {
  return { id: crypto.randomUUID(), name, blob };
}

/**
 * Reads images into the worker's input shape, decoding HEIC on the way through when the
 * browser cannot do it itself.
 *
 * The native attempt comes first deliberately. Safari and iOS decode HEIC through the
 * OS, so they get the fast path and never fetch the 1.5MB codec; Windows and Android —
 * where someone searching "HEIC to PDF" actually is — fall through to libheif. Doing it
 * here rather than in the worker is what keeps the codec out of the chunk every tool
 * loads (see `src/lib/convert/heic.ts` for both reasons).
 */
export async function toImageInputs(items: readonly ImageItem[]) {
  return Promise.all(
    items.map(async (item) => {
      const bytes = new Uint8Array(await item.blob.arrayBuffer());
      if (!isHeic(bytes) || (await decodesNatively(item.blob))) return { name: item.name, bytes };
      const decoded = await heicToJpeg(bytes);
      // The name is kept as the visitor's own, so an error names the file they picked.
      return { name: item.name, bytes: decoded.bytes };
    }),
  );
}

/** Whether this browser can decode the blob without help. */
async function decodesNatively(blob: Blob): Promise<boolean> {
  if (typeof createImageBitmap === 'undefined') return false;
  try {
    (await createImageBitmap(blob)).close();
    return true;
  } catch {
    return false;
  }
}

interface Props {
  items: ImageItem[];
  common: CommonMessages;
  onChange: (items: ImageItem[]) => void;
  disabled?: boolean;
  /** Label under each image; defaults to the file name. */
  label?: (item: ImageItem, position: number) => string;
  /** Extra buttons per image (e.g. retake). */
  extra?: (item: ImageItem, position: number) => ReactNode;
}

/** Image thumbnails in a grid, reorderable by drag and drop or with the arrow buttons. */
export function ImageList({ items, common, onChange, disabled, label, extra }: Props) {
  const urls = useMemo(() => new Map(items.map((item) => [item.id, URL.createObjectURL(item.blob)])), [items]);
  useEffect(() => () => urls.forEach((url) => URL.revokeObjectURL(url)), [urls]);
  const [dragFrom, setDragFrom] = useState<number>();
  const [dragOver, setDragOver] = useState<number>();

  return (
    <ol className="page-grid">
      {items.map((item, position) => {
        const name = label?.(item, position) ?? item.name;
        const classes = ['page-grid__item', dragOver === position && dragFrom !== position && 'is-drop-target'];
        return (
          <li
            key={item.id}
            className={classes.filter(Boolean).join(' ')}
            draggable={!disabled}
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
              if (dragFrom !== undefined && dragFrom !== position) onChange(moveItem(items, dragFrom, position));
              setDragFrom(undefined);
              setDragOver(undefined);
            }}
          >
            <div className="thumbnail">
              <img src={urls.get(item.id)} alt="" className="thumbnail__image" draggable={false} />
            </div>
            <span className="page-grid__label convert-image-name" title={item.name}>
              {name}
            </span>
            <div className="page-grid__controls">
              <button
                type="button"
                className="icon-button"
                aria-label={format(common.files.moveUp, { name })}
                disabled={disabled || position === 0}
                onClick={() => onChange(moveItem(items, position, position - 1))}
              >
                ←
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={format(common.files.moveDown, { name })}
                disabled={disabled || position === items.length - 1}
                onClick={() => onChange(moveItem(items, position, position + 1))}
              >
                →
              </button>
              {extra?.(item, position)}
              <button
                type="button"
                className="icon-button"
                aria-label={format(common.files.remove, { name })}
                disabled={disabled}
                onClick={() => onChange(items.filter((other) => other.id !== item.id))}
              >
                ✕
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
