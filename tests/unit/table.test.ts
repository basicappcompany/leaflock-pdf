import { describe, expect, it } from 'vitest';
import { pageTable } from '../../src/lib/convert/table';
import type { TextRun } from '../../src/lib/convert/structure';

const PAGE_WIDTH = 595;

function run(text: string, x: number, y: number, options: Partial<TextRun> = {}): TextRun {
  const size = options.size ?? 11;
  return { text, x, y, width: options.width ?? text.length * size * 0.5, size, bold: false, italic: false, ...options };
}

/** A three-column table of `rowCount` rows at fixed x positions, with a clean gutter
 * between each column (narrow text, wide gaps). */
function threeColumnTable(rowCount: number, startY = 700): TextRun[] {
  const runs: TextRun[] = [];
  for (let i = 0; i < rowCount; i++) {
    const y = startY - i * 16;
    runs.push(run(`Item ${i + 1}`, 60, y, { width: 60 }));
    runs.push(run(`${i + 1}`, 250, y, { width: 15 }));
    runs.push(run(`$${(i + 1) * 10}.00`, 400, y, { width: 40 }));
  }
  return runs;
}

describe('pageTable', () => {
  it('detects clean columns and splits every row at the same boundaries', () => {
    const { rows, columns, columnsDetected } = pageTable(threeColumnTable(4), PAGE_WIDTH);

    expect(columnsDetected).toBe(true);
    expect(columns).toBe(3);
    expect(rows).toEqual([
      ['Item 1', '1', '$10.00'],
      ['Item 2', '2', '$20.00'],
      ['Item 3', '3', '$30.00'],
      ['Item 4', '4', '$40.00'],
    ]);
  });

  it('does not detect columns in ordinary prose', () => {
    const runs = Array.from({ length: 6 }, (_, i) =>
      run('a full width line of ordinary prose text running on', 60, 700 - i * 16, { width: 470 }),
    );
    const { columnsDetected, columns } = pageTable(runs, PAGE_WIDTH);
    expect(columnsDetected).toBe(false);
    expect(columns).toBe(1);
  });

  it('keeps every line as a one-cell row when no table is found', () => {
    const runs = [run('First line', 60, 700), run('Second line', 60, 684)];
    expect(pageTable(runs, PAGE_WIDTH).rows).toEqual([['First line'], ['Second line']]);
  });

  it('needs enough tabular rows before trusting a coincidental alignment', () => {
    // Two rows happen to line up; that is not enough evidence of a real table.
    const runs = [run('left', 60, 700, { width: 30 }), run('right', 300, 700, { width: 30 })];
    const second = [run('left', 60, 684, { width: 30 }), run('right', 300, 684, { width: 30 })];
    expect(pageTable([...runs, ...second], PAGE_WIDTH).columnsDetected).toBe(false);
  });

  it('is unmoved by a one-off heading above the table', () => {
    const runs = [run('Price List', 60, 760, { size: 18, width: 100 }), ...threeColumnTable(4, 700)];
    const { rows, columnsDetected } = pageTable(runs, PAGE_WIDTH);

    expect(columnsDetected).toBe(true);
    // The heading becomes its own row; its text lands in whichever column its x falls in.
    expect(rows[0]).toEqual(['Price List', '', '']);
    expect(rows[1]).toEqual(['Item 1', '1', '$10.00']);
  });

  it('adds a space inside a cell where the PDF positioned words instead of drawing one', () => {
    // The gap between "no" and "space" (4pt) is an ordinary word space, well under the
    // column-gutter threshold; the gap before "column two" (170pt) is the real column.
    const row = (y: number) => [
      run('no', 60, y, { width: 20 }),
      run('space', 84, y, { width: 30 }),
      run('column two', 300, y, { width: 60 }),
    ];
    const runs = [...row(700), ...row(684), ...row(668)];
    expect(pageTable(runs, PAGE_WIDTH).rows[0]).toEqual(['no space', 'column two']);
  });

  it('has no rows for a page with no text', () => {
    expect(pageTable([], PAGE_WIDTH)).toEqual({ rows: [], columns: 1, columnsDetected: false });
  });

  it('reads top to bottom whatever order the runs arrive in', () => {
    const shuffled = [...threeColumnTable(4)].reverse();
    expect(pageTable(shuffled, PAGE_WIDTH).rows[0]).toEqual(['Item 1', '1', '$10.00']);
  });
});
