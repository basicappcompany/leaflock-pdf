import { PDFArray, PDFDict, PDFDocument, PDFHexString, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf } from '../../src/lib/pdf/load';
import { removeMetadata } from '../../src/lib/pdf/ops/removeMetadata';
import { noProgress } from '../../src/lib/pdf/types';

const XMP_AUTHOR = 'Jane-From-The-Xmp-Packet';

/** A PDF carrying everything this tool is meant to strip. */
async function richPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([200, 200]);
  doc.setTitle('Secret Report');
  doc.setAuthor('Jane Doe');
  doc.setSubject('Q3');
  doc.setKeywords(['confidential']);

  const context = doc.context;

  // An uncompressed XMP packet, the way a real editor writes one.
  const xmp = context.stream(`<?xpacket begin="" ?><x:xmpmeta xmlns:x="adobe:ns:meta/"><dc:creator>${XMP_AUTHOR}</dc:creator></x:xmpmeta><?xpacket end="w"?>`, {
    Type: 'Metadata',
    Subtype: 'XML',
  });
  doc.catalog.set(PDFName.of('Metadata'), context.register(xmp));

  doc.context.trailerInfo.ID = context.obj([PDFHexString.of('aabb'), PDFHexString.of('ccdd')]);

  page.node.set(PDFName.of('PieceInfo'), context.obj({ AcmeApp: { Private: 'editing leftovers' } }));
  page.node.set(PDFName.of('LastModified'), PDFHexString.of('00'));

  // Active content: an open action, document JavaScript, an embedded file, a page action.
  const js = context.register(context.obj({ S: 'JavaScript', JS: 'app.alert("hi")' }));
  doc.catalog.set(PDFName.of('OpenAction'), js);
  doc.catalog.set(
    PDFName.of('Names'),
    context.register(
      context.obj({
        JavaScript: { Names: ['startup', js] },
        EmbeddedFiles: { Names: ['payload.exe', context.register(context.obj({ Type: 'Filespec', F: 'payload.exe' }))] },
        Dests: { Names: ['chapter-1', context.register(context.obj([page.ref, 'Fit']))] },
      }),
    ),
  );
  page.node.set(PDFName.of('AA'), context.obj({ O: { S: 'JavaScript', JS: 'app.alert("open")' } }));

  // A file attachment, a highlight (must survive) and a link carrying a Launch action.
  page.node.addAnnot(context.register(context.obj({ Type: 'Annot', Subtype: 'FileAttachment', Rect: [0, 0, 10, 10] })));
  page.node.addAnnot(context.register(context.obj({ Type: 'Annot', Subtype: 'Highlight', Rect: [20, 20, 40, 40] })));
  page.node.addAnnot(
    context.register(
      context.obj({ Type: 'Annot', Subtype: 'Link', Rect: [50, 50, 90, 60], A: { S: 'Launch', F: 'payload.exe' } }),
    ),
  );

  return doc.save();
}

/** Reloads output the way our own ops do — `updateMetadata: false`, so pdf-lib does not
 * re-stamp Producer/ModDate on load and hide what the operation actually wrote. */
const reload = (bytes: Uint8Array) => loadPdf({ name: 'out.pdf', bytes });

const asText = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

const run = (bytes: Uint8Array, activeContent = true) =>
  removeMetadata({ input: { name: 'doc.pdf', bytes }, activeContent, outputName: 'clean.pdf' }, noProgress);

const annotTypes = (doc: PDFDocument): string[] => {
  const annots = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  if (!annots) return [];
  return annots.asArray().map((entry) => {
    const dict = doc.context.lookup(entry, PDFDict);
    return dict.lookupMaybe(PDFName.of('Subtype'), PDFName)?.decodeText() ?? '';
  });
};

describe('removeMetadata', () => {
  it('empties the document information fields', async () => {
    const result = await run(await richPdf());
    expect(result.infoFields).toBeGreaterThan(0);

    const doc = await reload(result.file.bytes);
    expect(doc.getTitle()).toBeUndefined();
    expect(doc.getAuthor()).toBeUndefined();
    expect(doc.getSubject()).toBeUndefined();
    expect(doc.getKeywords()).toBeUndefined();
  });

  it('does not stamp our own name on the result', async () => {
    const result = await run(await richPdf());
    const doc = await reload(result.file.bytes);
    expect(doc.getProducer()).toBeUndefined();
    expect(doc.getCreator()).toBeUndefined();
  });

  it('removes the XMP packet from the bytes, not just from the catalog', async () => {
    const before = await richPdf();
    expect(asText(before)).toContain(XMP_AUTHOR);

    const result = await run(before);
    expect(result.xmp).toBe(true);
    expect(asText(result.file.bytes)).not.toContain(XMP_AUTHOR);
  });

  it('removes an embedded page thumbnail from the bytes', async () => {
    const doc = await PDFDocument.load(await richPdf());
    const thumb = doc.context.stream('THUMBNAIL-PIXELS-MARKER', { Type: 'XObject', Subtype: 'Image', Width: 1, Height: 1 });
    doc.getPage(0).node.set(PDFName.of('Thumb'), doc.context.register(thumb));
    const before = await doc.save();
    expect(asText(before)).toContain('THUMBNAIL-PIXELS-MARKER');

    const result = await run(before);
    expect(asText(result.file.bytes)).not.toContain('THUMBNAIL-PIXELS-MARKER');
  });

  it('removes the document ID and per-page editing leftovers', async () => {
    const result = await run(await richPdf());
    expect(result.documentId).toBe(true);
    expect(result.pages).toBe(1);

    const doc = await reload(result.file.bytes);
    expect(doc.context.trailerInfo.ID).toBeUndefined();
    expect(doc.getPage(0).node.has(PDFName.of('PieceInfo'))).toBe(false);
    expect(doc.getPage(0).node.has(PDFName.of('LastModified'))).toBe(false);
  });

  it('removes JavaScript, embedded files and open actions when asked', async () => {
    const result = await run(await richPdf(), true);
    expect(result.activeItems).toBeGreaterThan(0);

    const doc = await reload(result.file.bytes);
    expect(doc.catalog.has(PDFName.of('OpenAction'))).toBe(false);
    const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
    expect(names?.has(PDFName.of('JavaScript'))).toBe(false);
    expect(names?.has(PDFName.of('EmbeddedFiles'))).toBe(false);
    expect(asText(result.file.bytes)).not.toContain('app.alert');
  });

  it('keeps named destinations, so bookmarks and links still resolve', async () => {
    const result = await run(await richPdf(), true);
    const doc = await reload(result.file.bytes);
    const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
    expect(names?.has(PDFName.of('Dests'))).toBe(true);
  });

  it('leaves active content alone when not asked', async () => {
    const result = await run(await richPdf(), false);
    expect(result.activeItems).toBe(0);

    const doc = await reload(result.file.bytes);
    expect(doc.catalog.has(PDFName.of('OpenAction'))).toBe(true);
    expect(annotTypes(doc)).toContain('FileAttachment');
  });

  it('drops a file attachment and a link’s Launch action but keeps the markup', async () => {
    const result = await run(await richPdf(), true);
    const doc = await reload(result.file.bytes);

    // The highlight and the link survive; only the attachment and the executable bit go.
    expect(annotTypes(doc)).toEqual(['Highlight', 'Link']);
    const annots = doc.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray)!;
    const link = doc.context.lookup(annots.get(1), PDFDict);
    expect(link.has(PDFName.of('A'))).toBe(false);
    expect(link.has(PDFName.of('Rect'))).toBe(true);
    expect(doc.getPage(0).node.has(PDFName.of('AA'))).toBe(false);
  });

  it('reports nothing left to remove on a file it already cleaned', async () => {
    const first = await run(await richPdf());
    await expect(run(first.file.bytes)).rejects.toMatchObject({
      code: 'no-metadata',
      values: { name: 'doc.pdf' },
    });
  });
});
