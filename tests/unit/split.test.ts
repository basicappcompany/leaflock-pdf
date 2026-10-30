import { PDFArray, PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { split, splitFileName, splitGroups } from '../../src/lib/pdf/ops/split';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf, makePdfWithFormField, makePdfWithLink, pageSizesOf } from '../fixtures/pdfs';

const fivePages = () => makePdf([[100, 100], [110, 100], [120, 100], [130, 100], [140, 100]]);

describe('splitGroups', () => {
  it('chunks every N pages, with a shorter last chunk', () => {
    expect(splitGroups({ kind: 'every', size: 2 }, 5)).toEqual([[0, 1], [2, 3], [4]]);
  });

  it('makes one group per page', () => {
    expect(splitGroups({ kind: 'single' }, 3)).toEqual([[0], [1], [2]]);
  });

  it('drops empty range groups', () => {
    expect(splitGroups({ kind: 'ranges', groups: [[0], [], [2, 3]] }, 4)).toEqual([[0], [2, 3]]);
  });
});

describe('splitFileName', () => {
  it('names files after their pages', () => {
    expect(splitFileName('report.pdf', [0, 1, 2])).toBe('report-pages-1-3.pdf');
    expect(splitFileName('report.pdf', [0, 1, 4])).toBe('report-pages-1-2_5.pdf');
    expect(splitFileName('report.final.PDF', [4])).toBe('report.final-page-5.pdf');
  });
});

describe('split', () => {
  it('splits by ranges, keeping the typed order', async () => {
    const outputs = await split(
      { input: { name: 'doc.pdf', bytes: await fivePages() }, mode: { kind: 'ranges', groups: [[3, 4], [0]] } },
      noProgress,
    );
    expect(outputs.map((file) => file.name)).toEqual(['doc-pages-4-5.pdf', 'doc-page-1.pdf']);
    expect(await pageSizesOf(outputs[0]!.bytes)).toEqual([[130, 100], [140, 100]]);
    expect(await pageSizesOf(outputs[1]!.bytes)).toEqual([[100, 100]]);
  });

  it('splits every N pages', async () => {
    const outputs = await split({ input: { name: 'doc.pdf', bytes: await fivePages() }, mode: { kind: 'every', size: 3 } }, noProgress);
    expect(outputs.map((file) => file.name)).toEqual(['doc-pages-1-3.pdf', 'doc-pages-4-5.pdf']);
    expect(await pageSizesOf(outputs[1]!.bytes)).toEqual([[130, 100], [140, 100]]);
  });

  it('splits into single pages', async () => {
    const outputs = await split({ input: { name: 'doc.pdf', bytes: await fivePages() }, mode: { kind: 'single' } }, noProgress);
    expect(outputs).toHaveLength(5);
    expect(await pageSizesOf(outputs[4]!.bytes)).toEqual([[140, 100]]);
  });

  it('rejects pages that do not exist', async () => {
    await expect(
      split({ input: { name: 'doc.pdf', bytes: await fivePages() }, mode: { kind: 'ranges', groups: [[9]] } }, noProgress),
    ).rejects.toBeInstanceOf(RangeError);
  });

  it('carries the source title and a working form field into every output', async () => {
    const bytes = await makePdfWithFormField([[100, 100], [110, 100]], 'name', 'Alice');
    const outputs = await split({ input: { name: 'doc.pdf', bytes }, mode: { kind: 'single' } }, noProgress);

    const first = await PDFDocument.load(outputs[0]!.bytes);
    expect(first.getTitle()).toBe('Title of name');
    expect(first.getForm().getTextField('name').getText()).toBe('Alice');
  });

  it('drops a link into a page that ended up in a different output', async () => {
    const bytes = await makePdfWithLink([[100, 100], [110, 100]], 0, 1);
    const outputs = await split({ input: { name: 'doc.pdf', bytes }, mode: { kind: 'single' } }, noProgress);

    const first = await PDFDocument.load(outputs[0]!.bytes);
    const annots = first.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    expect(annots).toBeUndefined();
  });

  it('keeps a link whose target stayed in the same output', async () => {
    const bytes = await makePdfWithLink([[100, 100], [110, 100], [120, 100]], 0, 1);
    const outputs = await split(
      { input: { name: 'doc.pdf', bytes }, mode: { kind: 'ranges', groups: [[0, 1]] } },
      noProgress,
    );

    const doc = await PDFDocument.load(outputs[0]!.bytes);
    const annots = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    expect(annots?.size()).toBe(1);
  });
});
