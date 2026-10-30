import { PDFDocument } from '@cantoo/pdf-lib';
import { collectFieldRefs, readNeedAppearances, writeAcroForm } from '../forms';
import { fixupLinks } from '../links';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { readMetadata, writeMetadata, type DocMetadata } from '../metadata';
import { readOutline, writeOutline, type OutlineSection } from '../outlines';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface MergeArgs {
  inputs: PdfInput[];
  outputName: string;
}

/** Combines the given PDFs, in order, into one document, keeping each input's own
 * bookmarks (see src/lib/pdf/outlines.ts for what's supported), form fields and metadata. */
export async function merge({ inputs, outputName }: MergeArgs, ctx: OpContext): Promise<OutputFile[]> {
  if (inputs.length === 0) {
    throw new RangeError('merge needs at least one file');
  }

  const merged = await PDFDocument.create();
  const outlineSections: OutlineSection[] = [];
  const metadataCandidates: DocMetadata[] = [];
  let needAppearances = false;
  for (const [index, input] of inputs.entries()) {
    const source = await loadPdf(input);
    const nodes = readOutline(source);
    metadataCandidates.push(readMetadata(source));
    needAppearances ||= readNeedAppearances(source);
    const indices = source.getPageIndices();
    const pages = await merged.copyPages(source, indices);
    for (const page of pages) merged.addPage(page);
    fixupLinks(source, indices, pages);
    outlineSections.push({ nodes, pages });
    ctx.progress((index + 1) / inputs.length);
  }
  writeOutline(merged, outlineSections);
  writeAcroForm(merged, collectFieldRefs(merged.getPages()), needAppearances);
  writeMetadata(merged, metadataCandidates);

  markProduced(merged);
  return [pdfFile(outputName, await merged.save())];
}
