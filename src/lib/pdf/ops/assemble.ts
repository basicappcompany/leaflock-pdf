import { degrees, PDFDocument, type PDFPage } from '@cantoo/pdf-lib';
import { collectFieldRefs, readNeedAppearances, writeAcroForm } from '../forms';
import { fixupLinks } from '../links';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { readMetadata, writeMetadata } from '../metadata';
import { normaliseRotation, type QuarterTurn } from '../../organize/pages';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export { normaliseRotation, type QuarterTurn };

/** One page of the output: a page from an input, or a blank page. */
export type PageRef =
  | { source: number; index: number; rotation: QuarterTurn }
  | { blank: true; width: number; height: number };

export interface AssembleArgs {
  inputs: PdfInput[];
  pages: PageRef[];
  outputName: string;
}

/** Adds `extra` degrees to a page's existing /Rotate. */
export function rotatePage(page: PDFPage, extra: number): void {
  if (extra % 360 === 0) return;
  page.setRotation(degrees(normaliseRotation(page.getRotation().angle + extra)));
}

/**
 * Builds one PDF from pages of one or more inputs, in the given order.
 * The core of Remove, Extract, Rotate and Organize.
 */
export async function assemble({ inputs, pages, outputName }: AssembleArgs, ctx: OpContext): Promise<OutputFile[]> {
  if (pages.length === 0) throw new RangeError('assemble needs at least one page');

  // Only load the inputs that are actually used.
  const used = new Set(pages.flatMap((page) => ('source' in page ? [page.source] : [])));
  const sources = new Map<number, PDFDocument>();
  for (const source of used) {
    const input = inputs[source];
    if (!input) throw new RangeError(`No input ${source}`);
    sources.set(source, await loadPdf(input));
  }

  const output = await PDFDocument.create();
  // Copy each source's pages in one call: copyPages shares fonts and images that way.
  const copied = new Map<number, Map<number, PDFPage>>();
  for (const [source, doc] of sources) {
    const indices = [...new Set(pages.flatMap((page) => ('source' in page && page.source === source ? [page.index] : [])))];
    for (const index of indices) {
      if (index < 0 || index >= doc.getPageCount()) throw new RangeError(`Input ${source} has no page ${index}`);
    }
    const copies = await output.copyPages(doc, indices);
    fixupLinks(doc, indices, copies);
    copied.set(source, new Map(indices.map((index, i) => [index, copies[i]!])));
  }

  const usedOnce = new Set<PDFPage>();
  for (const [position, ref] of pages.entries()) {
    if ('blank' in ref) {
      output.addPage([ref.width, ref.height]);
    } else {
      let page = copied.get(ref.source)!.get(ref.index)!;
      // The same page twice needs its own copy, or both would share one rotation. Any
      // link on that extra copy is dropped (fixupLinks only has this one page's source
      // index in scope here) rather than left dangling — a page intentionally reused for
      // a blank-separator-style duplicate is not where a working internal link matters.
      if (usedOnce.has(page)) {
        const duplicated = await output.copyPages(sources.get(ref.source)!, [ref.index]);
        fixupLinks(sources.get(ref.source)!, [ref.index], duplicated);
        page = duplicated[0]!;
      }
      usedOnce.add(page);
      rotatePage(page, ref.rotation);
      output.addPage(page);
    }
    ctx.progress((position + 1) / pages.length);
  }

  const outputPages = output.getPages();
  const needAppearances = [...sources.values()].some((doc) => readNeedAppearances(doc));
  writeAcroForm(output, collectFieldRefs(outputPages), needAppearances);
  writeMetadata(output, [...sources.values()].map(readMetadata));

  markProduced(output);
  return [pdfFile(outputName, await output.save())];
}
