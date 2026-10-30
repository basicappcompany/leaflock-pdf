import { PDFDocument } from '@cantoo/pdf-lib';
import { splitFileName, splitGroups, type SplitMode } from '../../organize/pages';
import { collectFieldRefs, readNeedAppearances, writeAcroForm } from '../forms';
import { fixupLinks } from '../links';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { readMetadata, writeMetadata } from '../metadata';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export { splitFileName, splitGroups, type SplitMode };

export interface SplitArgs {
  input: PdfInput;
  mode: SplitMode;
}

/** Splits one PDF into several, each keeping its share of the source's form fields and
 * metadata; a bookmark or link pointing at a page that ended up in a different output is
 * dropped rather than left pointing nowhere (see `../links.ts`). */
export async function split({ input, mode }: SplitArgs, ctx: OpContext): Promise<OutputFile[]> {
  const source = await loadPdf(input);
  const pageCount = source.getPageCount();
  const groups = splitGroups(mode, pageCount);
  if (groups.length === 0) throw new RangeError('split needs at least one page group');

  const metadata = readMetadata(source);
  const needAppearances = readNeedAppearances(source);

  const outputs: OutputFile[] = [];
  for (const [position, group] of groups.entries()) {
    for (const index of group) {
      if (index < 0 || index >= pageCount) throw new RangeError(`No page ${index}`);
    }
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(source, group);
    for (const page of pages) doc.addPage(page);
    fixupLinks(source, group, pages);
    writeAcroForm(doc, collectFieldRefs(pages), needAppearances);
    writeMetadata(doc, [metadata]);
    markProduced(doc);
    outputs.push(pdfFile(splitFileName(input.name, group), await doc.save()));
    ctx.progress((position + 1) / groups.length);
  }
  return outputs;
}
