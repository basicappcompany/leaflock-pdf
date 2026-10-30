import { degrees, PDFArray, PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { assemble, normaliseRotation, type PageRef } from '../../src/lib/pdf/ops/assemble';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf, makePdfWithFormField, makePdfWithLink, pageSizesOf } from '../fixtures/pdfs';

async function run(inputs: { name: string; bytes: Uint8Array }[], pages: PageRef[]) {
  const [output] = await assemble({ inputs, pages, outputName: 'out.pdf' }, noProgress);
  expect(output!.name).toBe('out.pdf');
  return PDFDocument.load(output!.bytes);
}

const rotations = (doc: PDFDocument) => doc.getPages().map((page) => page.getRotation().angle);

describe('assemble', () => {
  it('reorders and mixes pages from several inputs', async () => {
    const a = await makePdf([[100, 100], [110, 100], [120, 100]]);
    const b = await makePdf([[200, 200], [210, 200]]);
    const doc = await run(
      [
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ],
      [
        { source: 1, index: 1, rotation: 0 },
        { source: 0, index: 2, rotation: 0 },
        { source: 0, index: 0, rotation: 0 },
        { source: 1, index: 0, rotation: 0 },
      ],
    );
    expect(await pageSizesOf(await doc.save())).toEqual([[210, 200], [120, 100], [100, 100], [200, 200]]);
  });

  it('drops pages that are not listed (remove/extract)', async () => {
    const a = await makePdf([[100, 100], [110, 100], [120, 100]]);
    const doc = await run([{ name: 'a.pdf', bytes: a }], [{ source: 0, index: 1, rotation: 0 }]);
    expect(await pageSizesOf(await doc.save())).toEqual([[110, 100]]);
  });

  it('adds rotation on top of the existing /Rotate', async () => {
    const original = await PDFDocument.create();
    original.addPage([100, 200]).setRotation(degrees(90));
    original.addPage([100, 200]);
    const bytes = await original.save();

    const doc = await run(
      [{ name: 'a.pdf', bytes }],
      [
        { source: 0, index: 0, rotation: 270 },
        { source: 0, index: 1, rotation: 90 },
      ],
    );
    expect(rotations(doc)).toEqual([0, 90]);
  });

  it('inserts blank pages of the given size', async () => {
    const a = await makePdf([[100, 100]]);
    const doc = await run(
      [{ name: 'a.pdf', bytes: a }],
      [
        { blank: true, width: 595, height: 842 },
        { source: 0, index: 0, rotation: 0 },
      ],
    );
    expect(await pageSizesOf(await doc.save())).toEqual([[595, 842], [100, 100]]);
  });

  it('gives a page used twice its own rotation', async () => {
    const a = await makePdf([[100, 200]]);
    const doc = await run(
      [{ name: 'a.pdf', bytes: a }],
      [
        { source: 0, index: 0, rotation: 0 },
        { source: 0, index: 0, rotation: 180 },
      ],
    );
    expect(rotations(doc)).toEqual([0, 180]);
  });

  it('works with blank pages only, and skips unused inputs', async () => {
    const doc = await run(
      [{ name: 'broken.pdf', bytes: new TextEncoder().encode('not a pdf') }],
      [{ blank: true, width: 300, height: 300 }],
    );
    expect(doc.getPageCount()).toBe(1);
  });

  it('refuses an empty page list and missing pages', async () => {
    const a = await makePdf([[100, 100]]);
    await expect(run([{ name: 'a.pdf', bytes: a }], [])).rejects.toBeInstanceOf(RangeError);
    await expect(run([{ name: 'a.pdf', bytes: a }], [{ source: 0, index: 5, rotation: 0 }])).rejects.toBeInstanceOf(
      RangeError,
    );
  });

  it('keeps a form field and the title of the source it came from', async () => {
    const a = await makePdfWithFormField([[100, 100]], 'name', 'Alice');
    const doc = await run([{ name: 'a.pdf', bytes: a }], [{ source: 0, index: 0, rotation: 0 }]);
    expect(doc.getTitle()).toBe('Title of name');
    expect(doc.getForm().getTextField('name').getText()).toBe('Alice');
  });

  it('drops a link whose target page got left out of the output', async () => {
    const a = await makePdfWithLink([[100, 100], [110, 100]], 0, 1);
    // Keep only page 0 — the page the link points to is left out.
    const doc = await run([{ name: 'a.pdf', bytes: a }], [{ source: 0, index: 0, rotation: 0 }]);
    const annots = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    expect(annots).toBeUndefined();
  });

  it('keeps a link whose target page is still in the output', async () => {
    const a = await makePdfWithLink([[100, 100], [110, 100]], 0, 1);
    const doc = await run(
      [{ name: 'a.pdf', bytes: a }],
      [
        { source: 0, index: 0, rotation: 0 },
        { source: 0, index: 1, rotation: 0 },
      ],
    );
    const annots = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
    expect(annots?.size()).toBe(1);
  });
});

describe('normaliseRotation', () => {
  it('maps any quarter turn to 0-270', () => {
    expect([-90, 0, 90, 360, 450, -270, 720].map(normaliseRotation)).toEqual([270, 0, 90, 0, 90, 90, 0]);
  });
});
