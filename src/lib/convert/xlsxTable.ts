import type { TableSheet } from '../pdf/ops/tableToPdf';

/**
 * Reads an .xlsx workbook into the plain `TableSheet` grid `tableToPdf.ts` draws.
 *
 * `read-excel-file`'s `/browser` entry is dynamically imported for the same reason
 * `mammoth` is in `docxBlocks.ts`: it is a dependency only this tool needs, and a static
 * import would land in the tool page's own main-thread chunk rather than fetching only
 * when someone actually converts.
 *
 * Every cell becomes a plain string — formulas, number formats, dates and cell styling
 * are all flattened to whatever `read-excel-file` would otherwise return as a typed
 * value, read back as text. That is the fidelity limit stated on the tool page, not an
 * oversight: a bordered grid of plain text is the whole of what this tool promises.
 */
export async function xlsxToTable(bytes: Uint8Array): Promise<TableSheet[]> {
  const readXlsxFile = (await import('read-excel-file/browser')).default;
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const sheets = await readXlsxFile(arrayBuffer);

  // No padding needed here: read-excel-file already pads every row to the sheet's own
  // dimension, and tableToPdf.ts tolerates a short row regardless.
  return sheets.map(({ sheet, data }) => ({
    name: sheet,
    rows: data.map((row) => row.map(cellText)),
  }));
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}
