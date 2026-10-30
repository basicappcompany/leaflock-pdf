import { PDFDocument } from '@cantoo/pdf-lib';
import { ToolError } from '../errors';
import { loadPdf, markProduced, PdfInputError, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

/** One page rendered by pdf.js on the main thread, for the image fallback. */
export interface RenderedPage {
  jpeg: Uint8Array;
  /** Page size in points. */
  width: number;
  height: number;
}

export type RepairArgs =
  | { mode: 'rebuild'; input: PdfInput; outputName: string }
  | { mode: 'from-images'; pages: RenderedPage[]; outputName: string };

export interface RepairResult {
  file: OutputFile;
  pages: number;
  /** Pages pdf-lib found but couldn't copy. */
  lostPages: number;
  method: 'rebuilt' | 'images';
}

/**
 * Repairs a damaged PDF.
 *
 * 'rebuild' re-parses the file (pdf-lib reads objects in order and doesn't trust the
 * cross-reference table) and copies every page it can into a fresh document, which
 * drops broken structure. ToolError 'cannot-rebuild' when nothing could be saved; the
 * UI then renders the pages with pdf.js (which is more forgiving) and calls 'from-images'.
 */
export async function repair(args: RepairArgs, ctx: OpContext): Promise<RepairResult> {
  return args.mode === 'rebuild' ? rebuild(args.input, args.outputName, ctx) : fromImages(args.pages, args.outputName, ctx);
}

async function rebuild(input: PdfInput, outputName: string, ctx: OpContext): Promise<RepairResult> {
  let source: PDFDocument;
  let pageCount: number;
  try {
    source = await loadPdf(input, { throwOnInvalidObject: false });
    pageCount = source.getPageCount();
  } catch (error) {
    if (error instanceof PdfInputError && error.problem !== 'not-a-pdf') throw error;
    throw new ToolError('cannot-rebuild', { name: input.name });
  }

  const output = await PDFDocument.create();
  let lostPages = 0;
  for (let index = 0; index < pageCount; index++) {
    try {
      const [page] = await output.copyPages(source, [index]);
      output.addPage(page);
    } catch {
      lostPages++;
    }
    ctx.progress((index + 1) / pageCount);
  }
  if (output.getPageCount() === 0) throw new ToolError('cannot-rebuild', { name: input.name });

  copyMetadata(source, output);
  markProduced(output);
  return {
    file: pdfFile(outputName, await output.save()),
    pages: output.getPageCount(),
    lostPages,
    method: 'rebuilt',
  };
}

async function fromImages(pages: RenderedPage[], outputName: string, ctx: OpContext): Promise<RepairResult> {
  if (pages.length === 0) throw new RangeError('repair from images needs at least one page');
  const output = await PDFDocument.create();
  for (const [index, rendered] of pages.entries()) {
    const image = await output.embedJpg(rendered.jpeg);
    const page = output.addPage([rendered.width, rendered.height]);
    page.drawImage(image, { x: 0, y: 0, width: rendered.width, height: rendered.height });
    ctx.progress((index + 1) / pages.length);
  }
  markProduced(output);
  return { file: pdfFile(outputName, await output.save()), pages: pages.length, lostPages: 0, method: 'images' };
}

function copyMetadata(from: PDFDocument, to: PDFDocument) {
  try {
    const title = from.getTitle();
    const author = from.getAuthor();
    const subject = from.getSubject();
    if (title) to.setTitle(title);
    if (author) to.setAuthor(author);
    if (subject) to.setSubject(subject);
  } catch {
    // A damaged Info dictionary isn't worth failing the repair for.
  }
}
