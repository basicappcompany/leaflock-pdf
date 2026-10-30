import { PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf } from '../../src/lib/pdf/load';
import { editMetadata } from '../../src/lib/pdf/ops/editMetadata';
import { readMetadata } from '../../src/lib/pdf/ops/readMetadata';
import { noProgress } from '../../src/lib/pdf/types';

const XMP_AUTHOR = 'Stale-Xmp-Author';

async function pdfWith(options: { info?: boolean; xmp?: boolean } = {}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  if (options.info) {
    doc.setTitle('Old Title');
    doc.setAuthor('Old Author');
    doc.setSubject('Old Subject');
    doc.setKeywords(['old, keywords']);
  }
  if (options.xmp) {
    const xmp = doc.context.stream(`<?xpacket begin="" ?><dc:creator>${XMP_AUTHOR}</dc:creator><?xpacket end="w"?>`, {
      Type: 'Metadata',
      Subtype: 'XML',
    });
    doc.catalog.set(PDFName.of('Metadata'), doc.context.register(xmp));
  }
  return doc.save();
}

const reload = (bytes: Uint8Array) => loadPdf({ name: 'out.pdf', bytes });
const asText = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

const run = (bytes: Uint8Array, values: Record<string, string | undefined>) =>
  editMetadata(
    {
      input: { name: 'doc.pdf', bytes },
      values: { title: undefined, author: undefined, subject: undefined, keywords: undefined, ...values },
      outputName: 'edited.pdf',
    },
    noProgress,
  );

describe('readMetadata', () => {
  it('reports the values a file carries, and whether it has an XMP packet', async () => {
    const result = await readMetadata({ input: { name: 'doc.pdf', bytes: await pdfWith({ info: true, xmp: true }) } }, noProgress);
    expect(result.values.title).toBe('Old Title');
    expect(result.values.author).toBe('Old Author');
    expect(result.hasXmp).toBe(true);
  });

  it('reports empty values for a file with no properties', async () => {
    const result = await readMetadata({ input: { name: 'doc.pdf', bytes: await pdfWith() } }, noProgress);
    expect(result.values.title).toBeUndefined();
    expect(result.hasXmp).toBe(false);
  });
});

describe('editMetadata', () => {
  it('writes the values it is given', async () => {
    const result = await run(await pdfWith({ info: true }), {
      title: 'New Title',
      author: 'Ada Lovelace',
      subject: 'Q4',
      keywords: 'one, two',
    });

    const doc = await reload(result.file.bytes);
    expect(doc.getTitle()).toBe('New Title');
    expect(doc.getAuthor()).toBe('Ada Lovelace');
    expect(doc.getSubject()).toBe('Q4');
    expect(doc.getKeywords()).toBe('one, two');
  });

  it('removes a field left empty rather than storing a blank value', async () => {
    const result = await run(await pdfWith({ info: true }), { title: 'Kept' });

    const doc = await reload(result.file.bytes);
    expect(doc.getTitle()).toBe('Kept');
    // Not '' — an author cleared by the user should leave no author behind at all.
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getSubject()).toBeUndefined();
    expect(doc.getKeywords()).toBeUndefined();
  });

  it('adds properties to a file that had none', async () => {
    const result = await run(await pdfWith(), { title: 'First Title' });
    expect((await reload(result.file.bytes)).getTitle()).toBe('First Title');
  });

  it('drops a stale XMP packet so readers cannot show the old values', async () => {
    const before = await pdfWith({ info: true, xmp: true });
    expect(asText(before)).toContain(XMP_AUTHOR);

    const result = await run(before, { author: 'Ada Lovelace' });
    expect(result.removedXmp).toBe(true);
    expect(asText(result.file.bytes)).not.toContain(XMP_AUTHOR);
    expect((await reload(result.file.bytes)).catalog.has(PDFName.of('Metadata'))).toBe(false);
  });

  it('reports no XMP removal for a file that had none', async () => {
    const result = await run(await pdfWith({ info: true }), { title: 'x' });
    expect(result.removedXmp).toBe(false);
  });
});
