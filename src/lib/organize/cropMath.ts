/** Margins as shares (0–1) of the displayed page. Same shape as the crop operation's. */
export interface Margins {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export type CropHandle =
  | 'move'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight';

export const noMargins: Margins = { left: 0, top: 0, right: 0, bottom: 0 };

/** The crop area never gets smaller than this share of the page in either direction. */
export const minimumSize = 0.05;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * New margins after dragging `handle` by (dx, dy), both as shares of the page size.
 * Edges stop at the page border and never cross the opposite edge.
 */
export function dragCrop(start: Margins, handle: CropHandle, dx: number, dy: number): Margins {
  if (handle === 'move') {
    const horizontal = start.left + start.right;
    const vertical = start.top + start.bottom;
    const left = clamp(start.left + dx, 0, horizontal);
    const top = clamp(start.top + dy, 0, vertical);
    return { left, top, right: horizontal - left, bottom: vertical - top };
  }
  const next = { ...start };
  if (handle === 'top' || handle === 'topLeft' || handle === 'topRight') {
    next.top = clamp(start.top + dy, 0, 1 - start.bottom - minimumSize);
  }
  if (handle === 'bottom' || handle === 'bottomLeft' || handle === 'bottomRight') {
    next.bottom = clamp(start.bottom - dy, 0, 1 - start.top - minimumSize);
  }
  if (handle === 'left' || handle === 'topLeft' || handle === 'bottomLeft') {
    next.left = clamp(start.left + dx, 0, 1 - start.right - minimumSize);
  }
  if (handle === 'right' || handle === 'topRight' || handle === 'bottomRight') {
    next.right = clamp(start.right - dx, 0, 1 - start.left - minimumSize);
  }
  return next;
}

/** Sets one margin from a typed value, keeping the crop area at least `minimumSize`. */
export function setMargin(margins: Margins, side: keyof Margins, value: number): Margins {
  const opposite = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' } as const;
  const max = 1 - margins[opposite[side]] - minimumSize;
  return { ...margins, [side]: clamp(Number.isFinite(value) ? value : 0, 0, Math.max(0, max)) };
}

export function hasCrop(margins: Margins): boolean {
  return margins.left > 0 || margins.top > 0 || margins.right > 0 || margins.bottom > 0;
}
