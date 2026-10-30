import { PDFDict, PDFDocument, PDFName, rectangle, rgb, setFillingColor, fill } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { flatten } from '../../src/lib/pdf/ops/flatten';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';

async function formPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const form = doc.getForm();
  const name = form.createTextField('name');
  name.setText('Ada Lovelace');
  name.addToPage(page, { x: 50, y: 300, width: 200, height: 24 });
  const agree = form.createCheckBox('agree');
  agree.check();
  agree.addToPage(page, { x: 50, y: 250, width: 16, height: 16 });
  return doc.save();
}

/** A page with a filled square annotation (with appearance) and a popup attached to it. */
async function annotatedPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([400, 400]);
  const appearance = doc.context.formXObject([setFillingColor(rgb(1, 0, 0)), rectangle(0, 0, 50, 20), fill()], {
    BBox: [0, 0, 50, 20],
  });
  const appearanceRef = doc.context.register(appearance);
  const square = doc.context.register(
    doc.context.obj({ Type: 'Annot', Subtype: 'Square', Rect: [100, 100, 200, 140], AP: { N: appearanceRef } }),
  );
  const popup = doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Popup', Rect: [200, 200, 300, 300], Parent: square }));
  const link = doc.context.register(doc.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [10, 10, 50, 50] }));
  page.node.addAnnot(square);
  page.node.addAnnot(popup);
  page.node.addAnnot(link);
  return doc.save();
}

function annotationTypes(doc: PDFDocument): string[] {
  const annots = doc.getPage(0).node.Annots();
  if (!annots) return [];
  return annots.asArray().map((ref) => {
    const dict = doc.context.lookup(ref, PDFDict);
    return String(dict.get(PDFName.of('Subtype')));
  });
}

function xObjectCount(doc: PDFDocument): number {
  const resources = doc.getPage(0).node.Resources();
  const xObjects = resources?.lookup(PDFName.of('XObject'));
  return xObjects && 'keys' in xObjects ? (xObjects as { keys(): unknown[] }).keys().length : 0;
}

describe('flatten', () => {
  it('turns form fields into page content', async () => {
    const result = await flatten({ input: { name: 'f.pdf', bytes: await formPdf() }, annotations: false, outputName: 'o.pdf' }, noProgress);

    expect(result.fields).toBe(2);
    const doc = await PDFDocument.load(result.file.bytes);
    expect(doc.getForm().getFields()).toHaveLength(0);
    expect(annotationTypes(doc)).toEqual([]);
    expect(xObjectCount(doc)).toBeGreaterThanOrEqual(2);
  });

  it('flattens visible annotations and keeps links', async () => {
    const result = await flatten({ input: { name: 'a.pdf', bytes: await annotatedPdf() }, annotations: true, outputName: 'o.pdf' }, noProgress);

    expect(result).toMatchObject({ fields: 0, annotations: 1 });
    const doc = await PDFDocument.load(result.file.bytes);
    expect(annotationTypes(doc)).toEqual(['/Link']);
    expect(xObjectCount(doc)).toBe(1);
  });

  it('leaves annotations alone when asked to', async () => {
    const result = flatten({ input: { name: 'a.pdf', bytes: await annotatedPdf() }, annotations: false, outputName: 'o.pdf' }, noProgress);
    await expect(result).rejects.toMatchObject({ code: 'nothing-to-flatten' });
  });

  it('says when there is nothing to flatten', async () => {
    const plain = await makePdf([[200, 300]]);
    await expect(
      flatten({ input: { name: 'p.pdf', bytes: plain }, annotations: true, outputName: 'o.pdf' }, noProgress),
    ).rejects.toMatchObject({ code: 'nothing-to-flatten', values: { name: 'p.pdf' } });
  });
});
