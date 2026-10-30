import writeXlsxFile from 'write-excel-file/node';
import { describe, expect, it } from 'vitest';
import { xlsxToTable } from '../../src/lib/convert/xlsxTable';

/** Builds a real .xlsx with the Node-side sibling of the library this project writes
 * spreadsheets with — a fixture built the same way the product's own output is, rather
 * than hand-constructed XML. */
async function makeWorkbook(sheets: { sheet: string; data: (string | number)[][] }[]): Promise<Uint8Array> {
  const buffer = await writeXlsxFile(
    sheets.map(({ sheet, data }) => ({
      sheet,
      data: data.map((row) => row.map((value) => (typeof value === 'number' ? { type: Number, value } : { type: String, value }))),
    })),
  ).toBuffer();
  return new Uint8Array(buffer);
}

describe('xlsxToTable', () => {
  it('reads every sheet, named, with its rows as plain strings', async () => {
    const bytes = await makeWorkbook([
      { sheet: 'Prices', data: [['Item', 'Qty'], ['Widget', 3]] },
    ]);
    const sheets = await xlsxToTable(bytes);

    expect(sheets).toHaveLength(1);
    expect(sheets[0]!.name).toBe('Prices');
    expect(sheets[0]!.rows).toEqual([
      ['Item', 'Qty'],
      ['Widget', '3'],
    ]);
  });

  it('reads more than one sheet', async () => {
    const bytes = await makeWorkbook([
      { sheet: 'First', data: [['a']] },
      { sheet: 'Second', data: [['b']] },
    ]);
    const sheets = await xlsxToTable(bytes);
    expect(sheets.map((s) => s.name)).toEqual(['First', 'Second']);
  });

  it('reads a short row as empty trailing cells, the way read-excel-file pads it', async () => {
    // read-excel-file pads to the sheet's own dimension itself, so xlsxToTable needs no
    // padding of its own — tableToPdf.ts would tolerate a short row either way.
    const bytes = await makeWorkbook([{ sheet: 'Sheet', data: [['a', 'b', 'c'], ['x']] }]);
    const sheets = await xlsxToTable(bytes);
    expect(sheets[0]!.rows).toEqual([
      ['a', 'b', 'c'],
      ['x', '', ''],
    ]);
  });
});
