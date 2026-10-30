import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { PageTable } from '../../src/lib/convert/table';
import { toXlsx } from '../../src/lib/convert/xlsx';

const table = (rows: string[][], columnsDetected = true): PageTable => ({
  rows,
  columns: rows[0]?.length ?? 1,
  columnsDetected,
});

/** Every file in the workbook's ZIP, concatenated, so a cell value can be found whether
 * it landed in a sheet's own XML or the shared-strings table. */
function allXml(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  return Object.values(files).map((data) => strFromU8(data)).join('\n');
}

describe('toXlsx', () => {
  it('produces a real .xlsx: a ZIP with the parts Excel requires', async () => {
    const result = await toXlsx({ pages: [table([['A', 'B']])], outputName: 'out.xlsx' });

    expect(result.file.name).toBe('out.xlsx');
    expect(result.file.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect([...result.file.bytes.slice(0, 2)]).toEqual([0x50, 0x4b]); // PK zip magic

    const names = Object.keys(unzipSync(result.file.bytes));
    expect(names).toContain('[Content_Types].xml');
    expect(names.some((name) => /^xl\/worksheets\/sheet1\.xml$/.test(name))).toBe(true);
  });

  it('writes one sheet per PDF page that has text, named by page number', async () => {
    const result = await toXlsx({
      pages: [table([['first page']]), table([['second page']])],
      outputName: 'out.xlsx',
    });

    expect(result.sheets).toBe(2);
    const xml = allXml(result.file.bytes);
    expect(xml).toContain('Page 1');
    expect(xml).toContain('Page 2');
    expect(xml).toContain('first page');
    expect(xml).toContain('second page');
  });

  it('skips a page with no text rather than writing it an empty sheet', async () => {
    const result = await toXlsx({
      pages: [table([]), table([['has content']])],
      outputName: 'out.xlsx',
    });

    expect(result.sheets).toBe(1);
    expect(allXml(result.file.bytes)).toContain('has content');
  });

  it('names a sheet by its real page number, not its position among kept pages', async () => {
    // Page 1 is skipped (empty); page 2 is the only sheet, and must still say "Page 2".
    const result = await toXlsx({
      pages: [table([]), table([['content']])],
      outputName: 'out.xlsx',
    });
    expect(allXml(result.file.bytes)).toContain('Page 2');
    expect(allXml(result.file.bytes)).not.toContain('Page 1');
  });

  it('writes every row and cell of a table', async () => {
    const result = await toXlsx({
      pages: [table([['Item', 'Qty', 'Price'], ['Widget', '3', '$9.00'], ['Gadget', '1', '$20.00']])],
      outputName: 'out.xlsx',
    });

    const xml = allXml(result.file.bytes);
    for (const text of ['Item', 'Qty', 'Price', 'Widget', '3', '$9.00', 'Gadget', '1', '$20.00']) {
      expect(xml).toContain(text);
    }
  });

  it('reports which pages actually had detected columns', async () => {
    const result = await toXlsx({
      pages: [table([['a', 'b']], true), table([['plain text']], false)],
      outputName: 'out.xlsx',
    });
    expect(result.tablePages).toEqual([1]);
  });

  it('refuses a PDF with no text on any page', async () => {
    await expect(toXlsx({ pages: [table([]), table([])], outputName: 'out.xlsx' })).rejects.toMatchObject({
      code: 'no-text',
    });
  });
});
