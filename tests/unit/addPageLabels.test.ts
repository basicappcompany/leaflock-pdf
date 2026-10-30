import { PDFArray, PDFDict, PDFName, PDFNumber, PDFString } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { addPageLabels } from '../../src/lib/pdf/ops/addPageLabels';
import { loadPdf } from '../../src/lib/pdf/load';
import { noProgress } from '../../src/lib/pdf/types';
import type { PageLabelRange } from '../../src/lib/organize/pageLabels';
import { makePdf } from '../fixtures/pdfs';

const reload = (bytes: Uint8Array) => loadPdf({ name: 'out.pdf', bytes });

async function run(pageCount: number, ranges: PageLabelRange[]) {
  const sizes: [number, number][] = Array.from({ length: pageCount }, () => [300, 400]);
  const bytes = await makePdf(sizes);
  const [output] = await addPageLabels({ input: { name: 'in.pdf', bytes }, outputName: 'out.pdf', ranges }, noProgress);
  return reload(output!.bytes);
}

/** Reads `/PageLabels/Nums` back as plain [startIndex, {S?, P?, St?}] pairs. */
function readNums(doc: Awaited<ReturnType<typeof reload>>) {
  const pageLabels = doc.catalog.lookupMaybe(PDFName.of('PageLabels'), PDFDict)!;
  const nums = pageLabels.lookupMaybe(PDFName.of('Nums'), PDFArray)!;
  const entries: { startIndex: number; S?: string; P?: string; St?: number }[] = [];
  for (let i = 0; i < nums.size(); i += 2) {
    const startIndex = (nums.lookup(i, PDFNumber) as PDFNumber).asNumber();
    const dict = nums.lookup(i + 1, PDFDict) as PDFDict;
    const s = dict.lookupMaybe(PDFName.of('S'), PDFName)?.decodeText();
    const p = dict.lookupMaybe(PDFName.of('P'), PDFString)?.decodeText();
    const st = dict.lookupMaybe(PDFName.of('St'), PDFNumber)?.asNumber();
    entries.push({ startIndex, ...(s !== undefined && { S: s }), ...(p !== undefined && { P: p }), ...(st !== undefined && { St: st }) });
  }
  return entries;
}

describe('addPageLabels', () => {
  it('writes one Nums entry per range, with the style code, prefix and start value', async () => {
    const doc = await run(10, [
      { startIndex: 0, style: 'lowerRoman', prefix: '', startAt: 1 },
      { startIndex: 3, style: 'decimal', prefix: 'A-', startAt: 1 },
    ]);
    expect(readNums(doc)).toEqual([
      { startIndex: 0, S: 'r' },
      { startIndex: 3, S: 'D', P: 'A-' },
    ]);
  });

  it('omits /S for a "none" style, keeping only the prefix', async () => {
    const doc = await run(5, [{ startIndex: 0, style: 'none', prefix: 'Cover', startAt: 1 }]);
    expect(readNums(doc)).toEqual([{ startIndex: 0, P: 'Cover' }]);
  });

  it('omits /St when the start value is the default 1', async () => {
    const doc = await run(5, [{ startIndex: 0, style: 'decimal', prefix: '', startAt: 1 }]);
    expect(readNums(doc)[0]!.St).toBeUndefined();
  });

  it('writes /St when the start value is not 1', async () => {
    const doc = await run(5, [{ startIndex: 0, style: 'decimal', prefix: '', startAt: 7 }]);
    expect(readNums(doc)[0]!.St).toBe(7);
  });

  it('rejects ranges that fail validation, e.g. not starting at page 1', async () => {
    await expect(run(5, [{ startIndex: 1, style: 'decimal', prefix: '', startAt: 1 }])).rejects.toThrow(RangeError);
  });
});
