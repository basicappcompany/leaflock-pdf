import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { pageFrame } from '../../edit/geometry';
import type { OverlayImage } from '../../edit/overlays';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface RasterizePagesArgs {
  input: PdfInput;
  outputName: string;
  /** Pages to replace by an image of themselves (with redactions already painted in). */
  pages: { index: number; image: OverlayImage }[];
}

/**
 * Replaces some pages with flat images, for permanent redaction.
 *
 * The result is a new document that only contains objects reachable from the pages we keep,
 * so nothing from the replaced pages (text, images, annotations) survives in the file, and
 * the original document information and XMP metadata are left behind too.
 */
export async function rasterizePages(args: RasterizePagesArgs, ctx: OpContext): Promise<OutputFile[]> {
  const source = await loadPdf(args.input);
  const sourcePages = source.getPages();
  const replacements = new Map(args.pages.map((page) => [page.index, page.image]));

  // Sizes as displayed, before we empty those pages.
  const frames = new Map([...replacements.keys()].map((index) => [index, pageFrame(sourcePages[index]!)]));

  // A link elsewhere in the document can still point at a replaced page, and copying would follow it.
  // Emptying those pages first means such a reference can only ever bring along a blank page.
  for (const index of replacements.keys()) {
    const node = sourcePages[index]!.node;
    for (const key of ['Contents', 'Resources', 'Annots', 'Thumb', 'PieceInfo', 'Metadata']) node.delete(PDFName.of(key));
  }

  const output = await PDFDocument.create();
  const keep = sourcePages.map((_, index) => index).filter((index) => !replacements.has(index));
  const copied = await output.copyPages(source, keep);
  const copiedByIndex = new Map(keep.map((index, position) => [index, copied[position]!]));

  for (const index of sourcePages.keys()) {
    const replacement = replacements.get(index);
    if (!replacement) {
      output.addPage(copiedByIndex.get(index)!);
      continue;
    }
    const frame = frames.get(index)!;
    const image = replacement.type === 'png' ? await output.embedPng(replacement.bytes) : await output.embedJpg(replacement.bytes);
    const page = output.addPage([frame.width, frame.height]);
    page.drawImage(image, { x: 0, y: 0, width: frame.width, height: frame.height });
    ctx.progress((index + 1) / sourcePages.length);
  }

  markProduced(output);
  return [pdfFile(args.outputName, await output.save())];
}
