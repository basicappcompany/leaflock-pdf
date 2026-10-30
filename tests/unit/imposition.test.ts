import { describe, expect, it } from 'vitest';
import { bookletSheets, cellBox, fitIntoCell, nUpSheets } from '../../src/lib/organize/imposition';

describe('nUpSheets', () => {
  it('groups pages in order', () => {
    expect(nUpSheets(8, 4)).toEqual([
      [0, 1, 2, 3],
      [4, 5, 6, 7],
    ]);
  });

  it('pads the last sheet with empty cells rather than leaving it short', () => {
    expect(nUpSheets(5, 4)).toEqual([
      [0, 1, 2, 3],
      [4, null, null, null],
    ]);
  });

  it('handles one page per sheet and no pages', () => {
    expect(nUpSheets(2, 1)).toEqual([[0], [1]]);
    expect(nUpSheets(0, 4)).toEqual([]);
  });
});

describe('bookletSheets', () => {
  it('orders eight pages so a folded stack reads in order', () => {
    // Sheet 1: front 8|1, back 2|7. Sheet 2: front 6|3, back 4|5.
    expect(bookletSheets(8)).toEqual([
      [7, 0],
      [1, 6],
      [5, 2],
      [3, 4],
    ]);
  });

  it('pads to a multiple of four, putting the blanks at the end of the booklet', () => {
    // Six pages padded to eight: pages 7 and 8 do not exist, so those cells are empty.
    expect(bookletSheets(6)).toEqual([
      [null, 0],
      [1, null],
      [5, 2],
      [3, 4],
    ]);
  });

  it('makes one sheet for a single page', () => {
    expect(bookletSheets(1)).toEqual([
      [null, 0],
      [null, null],
    ]);
  });

  it('uses every real page exactly once', () => {
    for (const count of [4, 6, 7, 12, 21]) {
      const used = bookletSheets(count)
        .flat()
        .filter((index): index is number => index !== null);
      expect(used).toHaveLength(count);
      expect(new Set(used).size).toBe(count);
    }
  });

  it('has no sheets for no pages', () => {
    expect(bookletSheets(0)).toEqual([]);
  });
});

describe('cellBox', () => {
  const grid = { columns: 2, rows: 2 };
  const sheet = { width: 400, height: 400 };

  it('fills left to right, then top to bottom', () => {
    // No margin or gutter: four 200x200 quadrants. Cell 0 is top-left.
    expect(cellBox(0, grid, sheet, 0, 0)).toEqual({ x: 0, y: 200, width: 200, height: 200 });
    expect(cellBox(1, grid, sheet, 0, 0)).toEqual({ x: 200, y: 200, width: 200, height: 200 });
    expect(cellBox(2, grid, sheet, 0, 0)).toEqual({ x: 0, y: 0, width: 200, height: 200 });
    expect(cellBox(3, grid, sheet, 0, 0)).toEqual({ x: 200, y: 0, width: 200, height: 200 });
  });

  it('takes margins off the sheet and gutters off the space between', () => {
    // 400 - 2*20 margin - 20 gutter = 340 across two cells.
    const first = cellBox(0, grid, sheet, 20, 20);
    expect(first.width).toBe(170);
    expect(first.x).toBe(20);
    expect(cellBox(1, grid, sheet, 20, 20).x).toBe(210);
    expect(first.y).toBe(210);
  });
});

describe('fitIntoCell', () => {
  const cell = { x: 100, y: 200, width: 300, height: 300 };

  it('scales to fit and centres, leaving the anchor at the bottom-left', () => {
    // A 200x400 page in a 300x300 cell: height binds, scale 0.75, drawn 150x300.
    const placement = fitIntoCell(200, 400, 0, cell);
    expect(placement.scale).toBe(0.75);
    expect(placement.rotate).toBe(0);
    expect(placement.x).toBe(175); // 100 + (300 - 150) / 2
    expect(placement.y).toBe(200);
  });

  it('uses the displayed size of a quarter-turned page, not its MediaBox', () => {
    // Same 200x400 page, but /Rotate 90 makes it display as 400x200: width now binds.
    const placement = fitIntoCell(200, 400, 90, cell);
    expect(placement.scale).toBe(0.75); // 300 / 400
    // Rotated by the mirror of /Rotate, since drawPage turns counter-clockwise.
    expect(placement.rotate).toBe(270);
  });

  it('scales a page up when the cell is bigger than it is', () => {
    // A 100x100 page in a 300x300 cell fills it: imposition fits the cell, it does not
    // only ever shrink.
    expect(fitIntoCell(100, 100, 0, cell).scale).toBe(3);
  });

  it('puts the drawn result in the same place whichever way the page is turned', () => {
    // `drawPage` rotates about the anchor, so each quarter turn needs a different anchor
    // to land the visible result in the same spot. Undoing each rotation should therefore
    // recover the same bottom-left corner that an unrotated page gets.
    const square = 100;
    const bottomLeft = (rotation: 0 | 90 | 180 | 270): [number, number] => {
      const placement = fitIntoCell(square, square, rotation, cell);
      const size = square * placement.scale;
      switch (rotation) {
        case 90:
          return [placement.x, placement.y - size];
        case 180:
          return [placement.x - size, placement.y - size];
        case 270:
          return [placement.x - size, placement.y];
        default:
          return [placement.x, placement.y];
      }
    };

    const unrotated = bottomLeft(0);
    expect(bottomLeft(90)).toEqual(unrotated);
    expect(bottomLeft(180)).toEqual(unrotated);
    expect(bottomLeft(270)).toEqual(unrotated);
  });
});
