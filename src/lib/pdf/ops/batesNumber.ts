import { prepareText } from '../../edit/drawText';
import { pageFrame } from '../../edit/geometry';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { baseName, pdfFile, type OpContext, type OutputFile } from '../types';
import type { NumberPosition } from './addPageNumbers';

export interface BatesNumberArgs {
  /** In the order the sequence should run across them. */
  inputs: PdfInput[];
  outputSuffix: string;
  /** e.g. "ABC". Empty string for none. */
  prefix: string;
  /** e.g. "-CONF". Empty string for none. */
  suffix: string;
  /** Zero-padded width of the running number, e.g. 6 for "000001". */
  digits: number;
  /** Number given to the first stamped page of the first file. */
  startAt: number;
  position: NumberPosition;
  fontSize: number;
  margin: number;
  /** "#rrggbb" */
  color: string;
}

/**
 * Stamps every page of every input with a running Bates number — one continuous
 * sequence across all files, in the order given — and returns one output per input.
 * The legal/compliance convention this serves: a reviewer citing "ABC000142" must be
 * able to find that exact page in whichever of the case's files it falls in, so the
 * count cannot reset per file the way page numbering does.
 */
export async function batesNumber(args: BatesNumberArgs, ctx: OpContext): Promise<OutputFile[]> {
  if (args.inputs.length === 0) {
    throw new RangeError('Bates numbering needs at least one file');
  }

  const [vertical, horizontal] = args.position.split('-') as ['top' | 'bottom', 'left' | 'center' | 'right'];
  const docs = await Promise.all(args.inputs.map((input) => loadPdf(input)));
  const totalPages = docs.reduce((sum, doc) => sum + doc.getPageCount(), 0);

  let counter = args.startAt;
  let stamped = 0;
  const outputs: OutputFile[] = [];

  for (const [index, doc] of docs.entries()) {
    for (const page of doc.getPages()) {
      const label = `${args.prefix}${String(counter).padStart(args.digits, '0')}${args.suffix}`;
      counter++;

      const frame = pageFrame(page);
      const text = await prepareText(doc, label, { size: args.fontSize, color: args.color, align: horizontal });
      const centerX =
        horizontal === 'left'
          ? args.margin + text.width / 2
          : horizontal === 'right'
            ? frame.width - args.margin - text.width / 2
            : frame.width / 2;
      const centerY = vertical === 'top' ? args.margin + text.height / 2 : frame.height - args.margin - text.height / 2;
      text.draw(page, frame, centerX, centerY);

      stamped++;
      ctx.progress(stamped / totalPages);
    }

    markProduced(doc);
    outputs.push(pdfFile(`${baseName(args.inputs[index]!.name)}-${args.outputSuffix}.pdf`, await doc.save()));
  }

  return outputs;
}
