import { prepareText } from '../../edit/drawText';
import { pageFrame } from '../../edit/geometry';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export type NumberPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export interface AddPageNumbersArgs {
  input: PdfInput;
  outputName: string;
  /** Text per page; `{n}` is the number and `{total}` the last number. */
  template: string;
  position: NumberPosition;
  /** Number given to the first numbered page. */
  startAt: number;
  /** Font size in points. */
  fontSize: number;
  /** Distance from the page edge in points. */
  margin: number;
  /** "#rrggbb" */
  color: string;
  /** 0-based pages to number, in page order; null for all. */
  pages: number[] | null;
}

/** Writes a number on each chosen page, at the edge the reader sees (rotation and crop box respected). */
export async function addPageNumbers(args: AddPageNumbersArgs, ctx: OpContext): Promise<OutputFile[]> {
  const doc = await loadPdf(args.input);
  const all = doc.getPages();
  const chosen = (args.pages ?? all.map((_, index) => index)).filter((index) => index >= 0 && index < all.length);
  const ordered = [...new Set(chosen)].sort((a, b) => a - b);
  const total = args.startAt + ordered.length - 1;
  const [vertical, horizontal] = args.position.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right'];

  for (const [position, pageIndex] of ordered.entries()) {
    const page = all[pageIndex]!;
    const frame = pageFrame(page);
    const label = args.template
      .replaceAll('{n}', String(args.startAt + position))
      .replaceAll('{total}', String(total));
    const text = await prepareText(doc, label, { size: args.fontSize, color: args.color, align: horizontal });

    const centerX =
      horizontal === 'left'
        ? args.margin + text.width / 2
        : horizontal === 'right'
          ? frame.width - args.margin - text.width / 2
          : frame.width / 2;
    const centerY = vertical === 'top' ? args.margin + text.height / 2 : frame.height - args.margin - text.height / 2;
    text.draw(page, frame, centerX, centerY);
    ctx.progress((position + 1) / ordered.length);
  }

  markProduced(doc);
  return [pdfFile(args.outputName, await doc.save())];
}
