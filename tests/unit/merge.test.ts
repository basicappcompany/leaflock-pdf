import { PDFArray, PDFDict, PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { PdfInputError } from '../../src/lib/pdf/load';
import { merge } from '../../src/lib/pdf/ops/merge';
import { readOutline } from '../../src/lib/pdf/outlines';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf, makePdfWithBookmarks, makePdfWithFormField, makePdfWithLink, pageSizesOf } from '../fixtures/pdfs';

async function mergeBytes(inputs: { name: string; bytes: Uint8Array }[]) {
  const [output] = await merge({ inputs, outputName: 'merged.pdf' }, noProgress);
  expect(output!.name).toBe('merged.pdf');
  expect(output!.type).toBe('application/pdf');
  return output!.bytes;
}

describe('merge', () => {
  it('keeps every page, in the order the files were given', async () => {
    const a = await makePdf([[200, 300], [210, 300]]);
    const b = await makePdf([[400, 500]]);
    const c = await makePdf([[600, 700], [610, 700], [620, 700]]);

    const merged = await mergeBytes([
      { name: 'c.pdf', bytes: c },
      { name: 'a.pdf', bytes: a },
      { name: 'b.pdf', bytes: b },
    ]);

    expect(await pageSizesOf(merged)).toEqual([
      [600, 700], [610, 700], [620, 700],
      [200, 300], [210, 300],
      [400, 500],
    ]);
  });

  it('accepts the same file twice', async () => {
    const a = await makePdf([[200, 300]]);
    const merged = await mergeBytes([
      { name: 'a.pdf', bytes: a },
      { name: 'a.pdf', bytes: a },
    ]);
    expect(await pageSizesOf(merged)).toEqual([[200, 300], [200, 300]]);
  });

  it('opens PDFs that are encrypted only to restrict editing', async () => {
    const restricted = await makePdf([[300, 300]], { ownerPassword: 'owner-secret' });
    const plain = await makePdf([[400, 400]]);

    const merged = await mergeBytes([
      { name: 'restricted.pdf', bytes: restricted },
      { name: 'plain.pdf', bytes: plain },
    ]);

    expect(await pageSizesOf(merged)).toEqual([[300, 300], [400, 400]]);
  });

  it('names the file that needs a password', async () => {
    const locked = await makePdf([[300, 300]], { userPassword: 'open-secret', ownerPassword: 'owner-secret' });
    const plain = await makePdf([[400, 400]]);

    const result = mergeBytes([
      { name: 'plain.pdf', bytes: plain },
      { name: 'locked.pdf', bytes: locked },
    ]);

    await expect(result).rejects.toBeInstanceOf(PdfInputError);
    await expect(result).rejects.toMatchObject({ fileName: 'locked.pdf', problem: 'password-protected' });
  });

  it('names the file that is not a PDF', async () => {
    const plain = await makePdf([[400, 400]]);
    const fake = new TextEncoder().encode('this is not a pdf');

    const result = mergeBytes([
      { name: 'plain.pdf', bytes: plain },
      { name: 'notes.pdf', bytes: fake },
    ]);

    await expect(result).rejects.toMatchObject({ fileName: 'notes.pdf', problem: 'not-a-pdf' });
  });

  it('refuses an empty list', async () => {
    await expect(mergeBytes([])).rejects.toBeInstanceOf(RangeError);
  });

  describe('bookmarks', () => {
    it('keeps a flat set of bookmarks, remapped to the merged page numbers', async () => {
      const a = await makePdfWithBookmarks(
        [[200, 300], [200, 300]],
        [{ title: 'A: intro', pageIndex: 0 }, { title: 'A: summary', pageIndex: 1 }],
      );
      const b = await makePdfWithBookmarks([[400, 500]], [{ title: 'B: cover', pageIndex: 0 }]);

      const merged = await mergeBytes([
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ]);

      const doc = await PDFDocument.load(merged);
      const outline = readOutline(doc);
      expect(outline.map((node) => [node.title, node.pageIndex])).toEqual([
        ['A: intro', 0],
        ['A: summary', 1],
        ['B: cover', 2], // offset by a.pdf's two pages
      ]);
    });

    it('keeps nesting and order', async () => {
      const a = await makePdfWithBookmarks(
        [[200, 300], [200, 300], [200, 300]],
        [
          {
            title: 'Chapter 1',
            pageIndex: 0,
            children: [
              { title: '1.1', pageIndex: 0 },
              { title: '1.2', pageIndex: 1 },
            ],
          },
          { title: 'Chapter 2', pageIndex: 2 },
        ],
      );

      const merged = await mergeBytes([{ name: 'a.pdf', bytes: a }]);
      const outline = readOutline(await PDFDocument.load(merged));

      expect(outline).toHaveLength(2);
      expect(outline[0]!.title).toBe('Chapter 1');
      expect(outline[0]!.children.map((c) => [c.title, c.pageIndex])).toEqual([
        ['1.1', 0],
        ['1.2', 1],
      ]);
      expect(outline[1]!.title).toBe('Chapter 2');
      expect(outline[1]!.children).toEqual([]);
    });

    it('produces no /Outlines entry when no input has bookmarks', async () => {
      const a = await makePdf([[200, 300]]);
      const b = await makePdf([[400, 500]]);

      const merged = await mergeBytes([
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ]);

      const outline = readOutline(await PDFDocument.load(merged));
      expect(outline).toEqual([]);
    });

    it('keeps the bookmarks that exist when only some inputs have them', async () => {
      const a = await makePdf([[200, 300]]);
      const b = await makePdfWithBookmarks([[400, 500]], [{ title: 'B only', pageIndex: 0 }]);

      const merged = await mergeBytes([
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ]);

      const outline = readOutline(await PDFDocument.load(merged));
      expect(outline.map((node) => [node.title, node.pageIndex])).toEqual([['B only', 1]]);
    });
  });

  describe('form fields', () => {
    it('keeps each input field, working, in the merged form', async () => {
      const a = await makePdfWithFormField([[200, 300]], 'name', 'Alice');
      const b = await makePdfWithFormField([[400, 500]], 'email', 'bob@example.com');

      const merged = await mergeBytes([
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ]);

      const doc = await PDFDocument.load(merged);
      const form = doc.getForm();
      expect(form.getFields().map((field) => field.getName())).toEqual(['name', 'email']);
      expect(form.getTextField('name').getText()).toBe('Alice');
      expect(form.getTextField('email').getText()).toBe('bob@example.com');
    });

    it('produces no /AcroForm entry when no input has fields', async () => {
      const a = await makePdf([[200, 300]]);
      const merged = await mergeBytes([{ name: 'a.pdf', bytes: a }]);
      expect(await PDFDocument.load(merged).then((doc) => doc.getForm().getFields())).toEqual([]);
    });
  });

  describe('link annotations', () => {
    it('keeps an internal link pointing at its merged page number', async () => {
      const a = await makePdf([[200, 300]]);
      const b = await makePdfWithLink([[400, 500], [410, 500]], 0, 1);

      const merged = await mergeBytes([
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ]);

      const doc = await PDFDocument.load(merged);
      // b's two pages land at merged indices 1 and 2; the link on page 1 should now
      // point at page 2's real ref, not an orphan copy pdf-lib made while deep-copying it.
      const annots = doc.getPage(1).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
      expect(annots?.size()).toBe(1);
      const linkDict = doc.context.lookup(annots!.get(0), PDFDict);
      const dest = linkDict.lookupMaybe(PDFName.of('Dest'), PDFArray);
      expect(dest!.get(0)).toBe(doc.getPage(2).ref);
    });
  });

  describe('metadata', () => {
    it('carries the title and author of the first input that set them', async () => {
      const a = await makePdf([[200, 300]]);
      const b = await makePdfWithFormField([[400, 500]], 'name', 'Alice');

      const merged = await mergeBytes([
        { name: 'a.pdf', bytes: a },
        { name: 'b.pdf', bytes: b },
      ]);

      const doc = await PDFDocument.load(merged);
      expect(doc.getTitle()).toBe('Title of name');
      expect(doc.getAuthor()).toBe('Fixture Author');
    });
  });
});
