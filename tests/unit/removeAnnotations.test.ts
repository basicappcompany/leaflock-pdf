import { PDFArray, PDFDict, PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf } from '../../src/lib/pdf/load';
import { removeAnnotations } from '../../src/lib/pdf/ops/removeAnnotations';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';

const COMMENT_TEXT = 'Reviewer-Private-Remark';

/** Two pages: the first marked up with a comment, a highlight (with a drawn appearance),
 * a pop-up, a link and a form field; the second left clean. */
async function markedUpPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 300]);
  doc.addPage([300, 300]);
  const context = doc.context;

  const comment = context.register(
    context.obj({ Type: 'Annot', Subtype: 'Text', Rect: [10, 10, 30, 30], Contents: COMMENT_TEXT }),
  );
  // An uncompressed appearance stream, so the test can check its bytes leave the file.
  const appearance = context.stream(`% ${COMMENT_TEXT}\n1 0 0 rg 0 0 50 20 re f`, {
    Type: 'XObject',
    Subtype: 'Form',
    BBox: [0, 0, 50, 20],
  });
  const highlight = context.register(
    context.obj({ Type: 'Annot', Subtype: 'Highlight', Rect: [40, 40, 90, 60], AP: { N: context.register(appearance) } }),
  );

  page.node.addAnnot(comment);
  page.node.addAnnot(highlight);
  page.node.addAnnot(context.register(context.obj({ Type: 'Annot', Subtype: 'Popup', Rect: [0, 0, 5, 5], Parent: comment })));
  page.node.addAnnot(context.register(context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [100, 100, 140, 120] })));
  page.node.addAnnot(context.register(context.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: 'name', Rect: [150, 150, 250, 170] })));

  return doc.save();
}

const reload = (bytes: Uint8Array) => loadPdf({ name: 'out.pdf', bytes });
const asText = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

const run = (bytes: Uint8Array, links = false) =>
  removeAnnotations({ input: { name: 'doc.pdf', bytes }, links, outputName: 'clean.pdf' }, noProgress);

const annotTypes = (doc: PDFDocument): string[] => {
  const annots = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (!annots) return [];
  return annots.asArray().map((entry) => {
    const dict = doc.context.lookup(entry, PDFDict);
    return dict.lookupMaybe(PDFName.of('Subtype'), PDFName)?.decodeText() ?? '';
  });
};

describe('removeAnnotations', () => {
  it('removes comments and markup but keeps form fields and links', async () => {
    const result = await run(await markedUpPdf());

    // Text and Highlight counted; the Popup belongs to the comment and is not counted twice.
    expect(result.annotations).toBe(2);
    expect(result.links).toBe(0);
    expect(result.pages).toBe(1);
    expect(annotTypes(await reload(result.file.bytes))).toEqual(['Link', 'Widget']);
  });

  it('removes links too when asked, still keeping form fields', async () => {
    const result = await run(await markedUpPdf(), true);
    expect(result.links).toBe(1);
    expect(annotTypes(await reload(result.file.bytes))).toEqual(['Widget']);
  });

  it('removes the comment text and its drawn appearance from the bytes', async () => {
    const before = await markedUpPdf();
    expect(asText(before)).toContain(COMMENT_TEXT);

    const result = await run(before);
    expect(asText(result.file.bytes)).not.toContain(COMMENT_TEXT);
  });

  it('leaves the pages themselves alone', async () => {
    const result = await run(await markedUpPdf());
    const doc = await reload(result.file.bytes);
    expect(doc.getPageCount()).toBe(2);
    expect(doc.getPage(1).node.has(PDFName.of('Annots'))).toBe(false);
  });

  it('reports a file with nothing to remove', async () => {
    await expect(run(await makePdf([[200, 200]]))).rejects.toMatchObject({
      code: 'no-annotations',
      values: { name: 'doc.pdf' },
    });
  });

  it('reports a file whose only annotations are kept kinds', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 200]);
    page.node.addAnnot(doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [0, 0, 10, 10] })));

    await expect(run(await doc.save())).rejects.toMatchObject({ code: 'no-annotations' });
  });
});
