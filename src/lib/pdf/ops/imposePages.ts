import { degrees, rgb, type PDFEmbeddedPage } from '@cantoo/pdf-lib';
import { PDFDocument } from '@cantoo/pdf-lib';
import { cellBox, fitIntoCell, type Grid } from '../../organize/imposition';
import type { QuarterTurn } from '../../organize/pages';
import { ToolError } from '../errors';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { readMetadata, writeMetadata } from '../metadata';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface ImposeArgs {
  input: PdfInput;
  /** One entry per output sheet: the page indices for its cells, `null` for an empty cell. */
  sheets: (number | null)[][];
  grid: Grid;
  /** Output sheet size in points. */
  sheet: { width: number; height: number };
  margin: number;
  gutter: number;
  /** Draw a hairline around each placed page, the way proof sheets do. */
  border: boolean;
  outputName: string;
}

export interface ImposeResult {
  file: OutputFile;
  sheets: number;
  /** Pages that could not be drawn because they carry no content at all. */
  skipped: number;
}

const BORDER_GREY = rgb(0.8, 0.8, 0.8);

/**
 * Draws several source pages onto each output sheet — the shared engine behind N-up and
 * Booklet, which differ only in the order `sheets` puts the pages in.
 *
 * Annotations do not come along: `embedPage` copies a page's *drawn content* into a form
 * XObject, so links, comments and form fields are left behind. That is inherent to
 * imposition rather than a shortcut — several pages now share one sheet, and a link's
 * rectangle no longer means what it did — and both tool pages say so plainly.
 */
export async function imposePages(
  { input, sheets, grid, sheet, margin, gutter, border, outputName }: ImposeArgs,
  ctx: OpContext,
): Promise<ImposeResult> {
  if (sheets.length === 0) throw new RangeError('impose needs at least one sheet');

  const source = await loadPdf(input);
  const pageCount = source.getPageCount();
  const output = await PDFDocument.create();

  // Embed each page once, even if the layout uses it more than once.
  const used = [...new Set(sheets.flat().filter((index): index is number => index !== null))];
  for (const index of used) {
    if (index < 0 || index >= pageCount) throw new RangeError(`No page ${index}`);
  }

  const embedded = new Map<number, PDFEmbeddedPage>();
  const sizes = new Map<number, { width: number; height: number; rotation: QuarterTurn }>();
  let skipped = 0;
  for (const index of used) {
    const page = source.getPage(index);
    // A page with no /Contents at all — typically a blank back from a scanner. pdf-lib
    // refuses to embed one, and it throws from inside `save()` rather than from
    // `embedPage`, so there is nothing useful to catch later: the page has to be left out
    // here, and its cell stays empty.
    if (!page.node.Contents()) {
      skipped++;
      continue;
    }
    embedded.set(index, await output.embedPage(page));
    const { width, height } = page.getSize();
    sizes.set(index, { width, height, rotation: (page.getRotation().angle % 360) as QuarterTurn });
  }

  if (embedded.size === 0) throw new ToolError('nothing-to-impose', { name: input.name });

  for (const [position, cells] of sheets.entries()) {
    const target = output.addPage([sheet.width, sheet.height]);
    cells.forEach((index, cell) => {
      if (index === null) return;
      const page = embedded.get(index);
      const size = sizes.get(index);
      if (!page || !size) return;

      const box = cellBox(cell, grid, sheet, margin, gutter);
      const placement = fitIntoCell(size.width, size.height, size.rotation, box);
      target.drawPage(page, {
        x: placement.x,
        y: placement.y,
        xScale: placement.scale,
        yScale: placement.scale,
        rotate: degrees(placement.rotate),
      });

      if (border) {
        const turned = size.rotation === 90 || size.rotation === 270;
        const drawnWidth = (turned ? size.height : size.width) * placement.scale;
        const drawnHeight = (turned ? size.width : size.height) * placement.scale;
        target.drawRectangle({
          x: box.x + (box.width - drawnWidth) / 2,
          y: box.y + (box.height - drawnHeight) / 2,
          width: drawnWidth,
          height: drawnHeight,
          borderColor: BORDER_GREY,
          borderWidth: 0.5,
        });
      }
    });
    ctx.progress((position + 1) / sheets.length);
  }

  writeMetadata(output, [readMetadata(source)]);
  markProduced(output);

  return { file: pdfFile(outputName, await output.save()), sheets: sheets.length, skipped };
}
