import { PDFDict, PDFDocument, PDFName, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { loadPdf, PdfInputError } from '../../src/lib/pdf/load';
import { pdfToPdfA } from '../../src/lib/pdf/ops/pdfToPdfA';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';

/** A fixture carrying document JavaScript, an open action, and an embedded file, the
 * same technique `removeMetadata.test.ts` uses for the same kind of fixture. */
async function richPdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([300, 400]);
  page.drawText('Hello', { x: 20, y: 200, size: 18, font });
  doc.setTitle('A Report');
  doc.setAuthor('A. Writer');

  const context = doc.context;
  const js = context.register(context.obj({ S: 'JavaScript', JS: 'app.alert("hi")' }));
  doc.catalog.set(PDFName.of('OpenAction'), js);
  doc.catalog.set(
    PDFName.of('Names'),
    context.register(
      context.obj({
        JavaScript: { Names: ['startup', js] },
        EmbeddedFiles: { Names: ['payload.exe', context.register(context.obj({ Type: 'Filespec', F: 'payload.exe' }))] },
      }),
    ),
  );

  return doc.save();
}

const run = (bytes: Uint8Array) => pdfToPdfA({ input: { name: 'doc.pdf', bytes }, outputName: 'pdfa.pdf' }, noProgress);
const reload = (bytes: Uint8Array) => loadPdf({ name: 'out.pdf', bytes });
const asText = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

describe('pdfToPdfA', () => {
  it('adds an sRGB output intent carrying an embedded ICC profile', async () => {
    const result = await run(await makePdf([[300, 400]]));
    const doc = await reload(result.file.bytes);

    expect(doc.catalog.has(PDFName.of('OutputIntents'))).toBe(true);
    expect(asText(result.file.bytes)).toContain('GTS_PDFA1');
  });

  it('writes PDF/A identification into the XMP packet', async () => {
    const result = await run(await makePdf([[300, 400]]));
    const text = asText(result.file.bytes);
    expect(text).toContain('<pdfaid:part>2</pdfaid:part>');
    expect(text).toContain('<pdfaid:conformance>B</pdfaid:conformance>');
  });

  it('carries the Info dictionary\'s title and author into the XMP packet', async () => {
    const result = await run(await richPdf());
    const text = asText(result.file.bytes);
    expect(text).toContain('A Report');
    expect(text).toContain('A. Writer');
  });

  it('removes JavaScript, the open action and embedded files, which PDF/A forbids', async () => {
    const result = await run(await richPdf());
    expect(result.activeContentRemoved).toBeGreaterThan(0);

    const doc = await reload(result.file.bytes);
    expect(doc.catalog.has(PDFName.of('OpenAction'))).toBe(false);
    const names = doc.catalog.lookupMaybe(PDFName.of('Names'), PDFDict);
    expect(names?.has(PDFName.of('JavaScript'))).toBe(false);
    expect(names?.has(PDFName.of('EmbeddedFiles'))).toBe(false);
    expect(asText(result.file.bytes)).not.toContain('app.alert');
  });

  it('reports a non-embedded standard font rather than silently claiming conformance', async () => {
    const result = await run(await makePdf([[300, 400]]));
    expect(result.nonEmbeddedFonts).toContain('Helvetica');
  });

  it('rejects an encrypted file, even a restriction-only one with no open password', async () => {
    const restrictedOnly = await makePdf([[300, 400]], { ownerPassword: 'owner-secret' });
    await expect(run(restrictedOnly)).rejects.toThrow(PdfInputError);
  });
});
