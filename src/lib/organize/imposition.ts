import type { QuarterTurn } from './pages';

/** A sheet's cells, filled in reading order: left to right, then top to bottom. */
export interface Grid {
  columns: number;
  rows: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Groups page indices into sheets of `perSheet`, in order. The last sheet is padded with
 * `null` — an empty cell — rather than being short, so every sheet has the same grid.
 */
export function nUpSheets(pageCount: number, perSheet: number): (number | null)[][] {
  const size = Math.max(1, Math.floor(perSheet));
  const sheets: (number | null)[][] = [];
  for (let start = 0; start < pageCount; start += size) {
    sheets.push(Array.from({ length: size }, (_, cell) => (start + cell < pageCount ? start + cell : null)));
  }
  return sheets;
}

/**
 * Page order for a saddle-stitch booklet: print two-up double-sided, fold the stack in
 * half, and the pages read in order.
 *
 * Each returned entry is one side of a sheet, holding the two pages printed side by side.
 * The count is padded to a multiple of four because a folded sheet carries four pages;
 * the padding becomes blank cells at the *end* of the finished booklet, which is where a
 * reader expects blank pages to be.
 */
export function bookletSheets(pageCount: number): (number | null)[][] {
  if (pageCount <= 0) return [];

  const padded = Math.ceil(pageCount / 4) * 4;
  const page = (oneBased: number): number | null => (oneBased <= pageCount ? oneBased - 1 : null);

  const sides: (number | null)[][] = [];
  let low = 1;
  let high = padded;
  while (low < high) {
    sides.push([page(high), page(low)]); // front of the sheet
    sides.push([page(low + 1), page(high - 1)]); // its back
    low += 2;
    high -= 2;
  }
  return sides;
}

/** Where cell `index` sits on the sheet, with equal margins around and `gutter` between. */
export function cellBox(index: number, grid: Grid, sheet: { width: number; height: number }, margin: number, gutter: number): Box {
  const width = (sheet.width - 2 * margin - (grid.columns - 1) * gutter) / grid.columns;
  const height = (sheet.height - 2 * margin - (grid.rows - 1) * gutter) / grid.rows;
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  return {
    x: margin + column * (width + gutter),
    // Row 0 is the top row, because that is the order someone reads a sheet in.
    y: sheet.height - margin - (row + 1) * height - row * gutter,
    width,
    height,
  };
}

/** How to draw one source page into one cell: pdf-lib's `drawPage` arguments. */
export interface Placement {
  /** Counter-clockwise, as `drawPage`'s `rotate` expects. */
  rotate: QuarterTurn;
  /** Anchor to pass as `x`/`y`; `rotate` turns the page about this point. */
  x: number;
  y: number;
  scale: number;
}

/**
 * Fits a source page into `cell`, centred, preserving its shape.
 *
 * Two corrections that are easy to get wrong, and both show up constantly in scans:
 *
 * 1. **`/Rotate` is not in the page's size.** `embedPage` reports the raw MediaBox, so a
 *    200x400 page with `/Rotate 90` — which every viewer shows as 400x200 — would be laid
 *    out as a portrait page and come out sideways. `pageRotation` is the page's own
 *    `/Rotate`, and the display size is the swapped one for a quarter turn.
 * 2. **`drawPage` rotates about the anchor, not about the content's centre**, so the
 *    anchor is not the bottom-left corner once rotated. The offsets below put the drawn
 *    result's bottom-left at the intended spot for each quarter turn.
 *
 * `/Rotate` is clockwise where `drawPage`'s `rotate` is counter-clockwise, hence the
 * mirrored angle.
 */
export function fitIntoCell(pageWidth: number, pageHeight: number, pageRotation: QuarterTurn, cell: Box): Placement {
  const turned = pageRotation === 90 || pageRotation === 270;
  const displayWidth = turned ? pageHeight : pageWidth;
  const displayHeight = turned ? pageWidth : pageHeight;

  const scale = Math.min(cell.width / displayWidth, cell.height / displayHeight);
  const left = cell.x + (cell.width - displayWidth * scale) / 2;
  const bottom = cell.y + (cell.height - displayHeight * scale) / 2;

  const width = pageWidth * scale;
  const height = pageHeight * scale;

  switch (pageRotation) {
    case 90:
      return { rotate: 270, x: left, y: bottom + width, scale };
    case 180:
      return { rotate: 180, x: left + width, y: bottom + height, scale };
    case 270:
      return { rotate: 90, x: left + height, y: bottom, scale };
    default:
      return { rotate: 0, x: left, y: bottom, scale };
  }
}

/** Sheet sizes offered by the imposition tools, in points. */
export const sheetSizes = {
  a4: { width: 595, height: 842 },
  a4Landscape: { width: 842, height: 595 },
  letter: { width: 612, height: 792 },
  letterLandscape: { width: 792, height: 612 },
  a3Landscape: { width: 1191, height: 842 },
} as const;

export type SheetSizeName = keyof typeof sheetSizes;

/** How many columns and rows each N-up layout uses. */
export const nUpGrids = {
  2: { columns: 2, rows: 1 },
  4: { columns: 2, rows: 2 },
  6: { columns: 3, rows: 2 },
  9: { columns: 3, rows: 3 },
  16: { columns: 4, rows: 4 },
} as const satisfies Record<number, Grid>;

export type NUpLayout = keyof typeof nUpGrids;

/** A booklet always prints two pages side by side on each side of a sheet. */
export const bookletGrid: Grid = { columns: 2, rows: 1 };

/** How many blank pages a booklet adds to reach a multiple of four. */
export function bookletPadding(pageCount: number): number {
  return pageCount <= 0 ? 0 : Math.ceil(pageCount / 4) * 4 - pageCount;
}
