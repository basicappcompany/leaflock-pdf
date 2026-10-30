/**
 * Things placed on top of pages by Sign, Edit and Redact. Positions are fractions (0–1)
 * of the page as displayed (crop box, after rotation), measured from its top-left corner,
 * so they're independent of zoom.
 */
interface OverlayBase {
  id: string;
  /** 0-based page index. */
  page: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export type OverlayItem =
  | (OverlayBase & { kind: 'image'; imageId: string })
  | (OverlayBase & { kind: 'text'; text: string; /** points */ fontSize: number; color: string; fontFamily?: string })
  | (OverlayBase & { kind: 'rect'; stroke: string | null; fill: string | null; /** points */ strokeWidth: number })
  | (OverlayBase & { kind: 'highlight'; color: string })
  | (OverlayBase & { kind: 'whiteout' })
  | (OverlayBase & { kind: 'redaction' });

export type OverlayKind = OverlayItem['kind'];

export interface OverlayImage {
  bytes: Uint8Array;
  type: 'png' | 'jpeg';
}

/** Keeps a box inside the page and at least a sliver in size. */
export function clampBox<T extends OverlayBase>(item: T, minSize = 0.01): T {
  const w = Math.min(Math.max(item.w, minSize), 1);
  const h = Math.min(Math.max(item.h, minSize), 1);
  return { ...item, w, h, x: Math.min(Math.max(item.x, 0), 1 - w), y: Math.min(Math.max(item.y, 0), 1 - h) };
}
