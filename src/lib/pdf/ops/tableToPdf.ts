import { PDFDocument, StandardFonts, rgb, type PDFFont } from '@cantoo/pdf-lib';
import { tokensOf, wrapTokens } from '../../convert/wrap';
import { ToolError } from '../errors';
import { markProduced } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface TableSheet {
  name: string;
  /** Every row the same length as the widest row — pad short rows before calling. */
  rows: string[][];
}

export interface TableToPdfArgs {
  sheets: TableSheet[];
  outputName: string;
}

export interface TableToPdfResult {
  file: OutputFile;
  pages: number;
}

/** A4 landscape: spreadsheet rows are usually wider than they are tall. */
const PAGE_SIZE = { width: 841.89, height: 595.28 };
const MARGIN = 40;
const CELL_PADDING = 4;
const BODY_SIZE = 9;
const HEADING_SIZE = 14;
const LINE_HEIGHT = 1.3;
/** Below this, a column stops being legible; a sheet with more columns than fit at this
 * width still gets drawn, just cramped — stated as a known limit on the tool page. */
const MIN_COLUMN_WIDTH = 50;
const GRID_COLOUR = rgb(0.8, 0.8, 0.8);

/**
 * Draws spreadsheet rows as a plain bordered grid, one PDF per workbook and one heading
 * per sheet — the Excel/CSV → PDF half of Office → PDF. No styling, formulas or merged
 * cells come across, because the source rows handed in here are already plain strings
 * (`src/lib/convert/xlsxTable.ts` / `csv.ts` strip all of that on the way in); the tool
 * page states this plainly, the same honesty as every other Office → PDF direction.
 *
 * A worker operation, like `blocksToPdf.ts` and for the identical reason: this step is
 * pdf-lib and nothing else, so there is no heavy dependency to keep off the main thread.
 */
export async function tableToPdf({ sheets, outputName }: TableToPdfArgs, ctx: OpContext): Promise<TableToPdfResult> {
  const used = sheets.filter((sheet) => sheet.rows.length > 0);
  if (used.length === 0) throw new ToolError('no-text');

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const contentWidth = PAGE_SIZE.width - MARGIN * 2;
  const cursor = { page: doc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]), y: PAGE_SIZE.height - MARGIN, pages: 1 };

  const newPage = () => {
    cursor.page = doc.addPage([PAGE_SIZE.width, PAGE_SIZE.height]);
    cursor.y = PAGE_SIZE.height - MARGIN;
    cursor.pages++;
  };

  used.forEach((sheet, sheetIndex) => {
    if (sheetIndex > 0) newPage();

    const headingHeight = HEADING_SIZE * LINE_HEIGHT;
    if (cursor.y - headingHeight < MARGIN) newPage();
    cursor.y -= headingHeight;
    cursor.page.drawText(sheet.name, { x: MARGIN, y: cursor.y, size: HEADING_SIZE, font: bold });
    cursor.y -= headingHeight * 0.4;

    const columnCount = Math.max(1, ...sheet.rows.map((row) => row.length));
    const columnWidth = Math.max(MIN_COLUMN_WIDTH, contentWidth / columnCount);
    const textWidth = columnWidth - CELL_PADDING * 2;

    for (const row of sheet.rows) {
      const cellLines = Array.from({ length: columnCount }, (_, column) => {
        const text = row[column] ?? '';
        const tokens = tokensOf([{ text, bold: false, italic: false }], BODY_SIZE, () => regular);
        return wrapTokens(tokens, textWidth);
      });
      const lineCount = Math.max(1, ...cellLines.map((lines) => lines.length));
      const rowHeight = lineCount * BODY_SIZE * LINE_HEIGHT + CELL_PADDING * 2;

      if (cursor.y - rowHeight < MARGIN) newPage();
      const rowTop = cursor.y;

      cellLines.forEach((lines, column) => {
        const x = MARGIN + column * columnWidth;
        cursor.page.drawRectangle({
          x,
          y: rowTop - rowHeight,
          width: columnWidth,
          height: rowHeight,
          borderColor: GRID_COLOUR,
          borderWidth: 0.5,
        });

        lines.forEach((line, lineIndex) => {
          const baseline = rowTop - CELL_PADDING - (lineIndex + 1) * BODY_SIZE * LINE_HEIGHT;
          let cellX = x + CELL_PADDING;
          for (const token of line) {
            cursor.page.drawText(token.text, { x: cellX, y: baseline, size: token.size, font: token.font as PDFFont });
            cellX += token.font.widthOfTextAtSize(token.text, token.size);
          }
        });
      });

      cursor.y -= rowHeight;
    }
    ctx.progress((sheetIndex + 1) / used.length);
  });

  markProduced(doc);
  return { file: pdfFile(outputName, await doc.save()), pages: cursor.pages };
}
