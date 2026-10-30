import { writeCsv } from './csv';
import type { PageTable } from './table';
import { ToolError } from '../pdf/errors';
import type { OutputFile } from '../pdf/types';

export type TableFormat = 'csv' | 'xlsx';

export interface ExtractTablesArgs {
  /** One entry per PDF page, as inferred by `src/lib/convert/table.ts`. */
  pages: PageTable[];
  format: TableFormat;
  /** Without the extension — each output file adds its own. */
  outputBaseName: string;
}

export interface ExtractTablesResult {
  files: OutputFile[];
  /** 1-based page numbers a table was actually found on, in page order. */
  tablePages: number[];
}

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Pulls out just the pages `table.ts` found real column structure on, as plain data
 * files — unlike PDF → Excel, which keeps every page (prose included) as its own sheet
 * so nothing from the document goes missing. This tool is for the other use: a buyer
 * who wants the tables and nothing else, as CSV for a pipeline or XLSX to open
 * directly. A table spanning more than one PDF page becomes more than one output file,
 * in page order — stated on the tool's own page rather than guessed at, since merging
 * them back into one table would mean guessing which rows actually continue.
 *
 * `ToolError 'no-tables'` when no page had a detected column structure.
 */
export async function extractTables({ pages, format, outputBaseName }: ExtractTablesArgs): Promise<ExtractTablesResult> {
  const found = pages.map((page, index) => ({ page, pageNumber: index + 1 })).filter(({ page }) => page.columnsDetected);
  if (found.length === 0) throw new ToolError('no-tables');

  const files: OutputFile[] =
    format === 'csv'
      ? found.map(({ page, pageNumber }) => ({
          name: `${outputBaseName}-table-p${pageNumber}.csv`,
          bytes: new TextEncoder().encode(writeCsv(page.rows)) as Uint8Array<ArrayBuffer>,
          type: 'text/csv',
        }))
      : await (async () => {
          const writeXlsxFile = (await import('write-excel-file/browser')).default;
          const sheets = found.map(({ page, pageNumber }) => ({ sheet: `Page ${pageNumber}`, data: page.rows }));
          const blob = await writeXlsxFile(sheets).toBlob();
          const bytes = new Uint8Array(await blob.arrayBuffer()) as Uint8Array<ArrayBuffer>;
          return [{ name: `${outputBaseName}-tables.xlsx`, bytes, type: XLSX_TYPE }];
        })();

  return { files, tablePages: found.map(({ pageNumber }) => pageNumber) };
}
