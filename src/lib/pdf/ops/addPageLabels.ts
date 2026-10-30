import { PDFName, PDFString } from '@cantoo/pdf-lib';
import { validateRanges, type PageLabelRange } from '../../organize/pageLabels';
import { loadPdf, markProduced, type PdfInput } from '../load';
import { pdfFile, type OpContext, type OutputFile } from '../types';

export interface AddPageLabelsArgs {
  input: PdfInput;
  outputName: string;
  /** In ascending order by `startIndex`; the first must start at page index 0. */
  ranges: PageLabelRange[];
}

const STYLE_CODE = {
  decimal: 'D',
  upperRoman: 'R',
  lowerRoman: 'r',
  upperLetters: 'A',
  lowerLetters: 'a',
} as const;

/**
 * Writes a `/PageLabels` number tree: catalog-level metadata telling a reader what to
 * display as each page's number (a reader-chrome label, e.g. "i", "ii", "A-1") without
 * touching page content at all — unlike `addPageNumbers.ts`, which draws text onto the
 * page itself. The two serve different intents and neither substitutes for the other.
 *
 * A flat `/Nums` array, with no `/Kids` subdivision, is correct PDF for any page count
 * this product deals with — `/Kids` exists for number trees too large to list directly,
 * which a page-label tree never is in practice.
 */
export async function addPageLabels({ input, outputName, ranges }: AddPageLabelsArgs, _ctx: OpContext): Promise<OutputFile[]> {
  const doc = await loadPdf(input);
  const problem = validateRanges(ranges, doc.getPageCount());
  if (problem) throw new RangeError(`invalid page label ranges: ${problem}`);

  const nums: (number | { S?: string; P?: PDFString; St?: number })[] = [];
  for (const range of ranges) {
    const entry: { S?: string; P?: PDFString; St?: number } = {};
    if (range.style !== 'none') entry.S = STYLE_CODE[range.style];
    if (range.prefix) entry.P = PDFString.of(range.prefix);
    if (range.startAt !== 1) entry.St = range.startAt;
    nums.push(range.startIndex, entry);
  }
  doc.catalog.set(PDFName.of('PageLabels'), doc.context.obj({ Nums: nums }));

  markProduced(doc);
  return [pdfFile(outputName, await doc.save())];
}
