import { strFromU8, unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { writeCsv } from '../../src/lib/convert/csv';
import { extractTables } from '../../src/lib/convert/extractTables';
import type { PageTable } from '../../src/lib/convert/table';
import { ToolError } from '../../src/lib/pdf/errors';

const page = (rows: string[][], columnsDetected: boolean): PageTable => ({
  rows,
  columns: rows[0]?.length ?? 1,
  columnsDetected,
});

const asText = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const allXml = (bytes: Uint8Array) => Object.values(unzipSync(bytes)).map((data) => strFromU8(data)).join('\n');

describe('extractTables', () => {
  it('keeps only the pages with a detected table, as CSV, skipping prose entirely', async () => {
    const pages = [
      page([['Just a prose line.']], false),
      page([['A', 'B'], ['1', '2']], true),
      page([['More prose.']], false),
    ];

    const { files, tablePages } = await extractTables({ pages, format: 'csv', outputBaseName: 'report' });

    expect(tablePages).toEqual([2]);
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe('report-table-p2.csv');
    expect(asText(files[0]!.bytes)).toBe(writeCsv([['A', 'B'], ['1', '2']]));
  });

  it('writes one CSV file per table page, independently, for a table on more than one page', async () => {
    const pages = [page([['A', 'B']], true), page([['prose']], false), page([['C', 'D']], true)];

    const { files, tablePages } = await extractTables({ pages, format: 'csv', outputBaseName: 'doc' });

    expect(tablePages).toEqual([1, 3]);
    expect(files.map((file) => file.name)).toEqual(['doc-table-p1.csv', 'doc-table-p3.csv']);
  });

  it('writes a single workbook, one sheet per table page, for xlsx', async () => {
    const pages = [page([['prose']], false), page([['A', 'B'], ['1', '2']], true)];

    const { files, tablePages } = await extractTables({ pages, format: 'xlsx', outputBaseName: 'doc' });

    expect(tablePages).toEqual([2]);
    expect(files).toHaveLength(1);
    expect(files[0]!.name).toBe('doc-tables.xlsx');
    const xml = allXml(files[0]!.bytes);
    expect(xml).toContain('Page 2');
    expect(xml).toContain('A');
  });

  it('rejects a document with no detected table at all', async () => {
    const pages = [page([['prose one']], false), page([['prose two']], false)];
    await expect(extractTables({ pages, format: 'csv', outputBaseName: 'doc' })).rejects.toThrow(ToolError);
  });
});
