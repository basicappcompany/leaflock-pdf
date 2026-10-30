import type { PageTable } from './table';
import { ToolError } from '../pdf/errors';
import type { OutputFile } from '../pdf/types';

export interface ToXlsxArgs {
  /** One entry per PDF page, as inferred by `src/lib/convert/table.ts`. */
  pages: PageTable[];
  outputName: string;
}

export interface ToXlsxResult {
  file: OutputFile;
  sheets: number;
  /** 1-based page numbers where a column structure was actually found, not guessed. */
  tablePages: number[];
}

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Writes one sheet per PDF page that has any text, named "Page N" so the sheet a row
 * came from is never ambiguous. A page with no detected column structure still gets a
 * sheet — one wide column, exactly like opening a plain-text file in a spreadsheet —
 * rather than being silently dropped, since the alternative is a document that loses
 * pages with no explanation.
 *
 * Not a worker operation, for the same reason `docx.ts` isn't: `write-excel-file` would
 * land in the shared job-worker chunk, which Vite bundles as `iife` and so cannot
 * code-split, and nothing here needs a worker — reading already happens on the main
 * thread through pdf.js, and this step is a few KB of XML and deflate.
 */
export async function toXlsx({ pages, outputName }: ToXlsxArgs): Promise<ToXlsxResult> {
  const used = pages.map((page, index) => ({ page, index })).filter(({ page }) => page.rows.length > 0);
  if (used.length === 0) throw new ToolError('no-text');

  const writeXlsxFile = (await import('write-excel-file/browser')).default;

  const sheets = used.map(({ page, index }) => ({
    sheet: `Page ${index + 1}`,
    data: page.rows,
  }));

  const blob = await writeXlsxFile(sheets).toBlob();
  const bytes = new Uint8Array(await blob.arrayBuffer()) as Uint8Array<ArrayBuffer>;

  return {
    file: { name: outputName, bytes, type: XLSX_TYPE },
    sheets: sheets.length,
    tablePages: used.filter(({ page }) => page.columnsDetected).map(({ index }) => index + 1),
  };
}
