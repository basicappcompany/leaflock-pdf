import { PDFDocument, PDFName, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { compress } from '../../src/lib/pdf/ops/compress';
import { noProgress } from '../../src/lib/pdf/types';
import { pageSizesOf } from '../fixtures/pdfs';

/**
 * Node has no OffscreenCanvas, so these tests cover everything except image re-encoding
 * (tests/e2e/secure.spec.ts covers that in a real browser).
 */
describe('compress', () => {
  it('shrinks a bloated file by dropping unused objects, thumbnails and using object streams', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    for (let i = 0; i < 20; i++) {
      const page = doc.addPage([300, 400]);
      page.drawText(`Page ${i + 1}`, { x: 20, y: 200, font, size: 20 });
      // A thumbnail and an unused blob: both are dead weight.
      const thumb = doc.context.register(doc.context.flateStream(new Uint8Array(4000).fill(i)));
      page.node.set(PDFName.of('Thumb'), thumb);
      doc.context.register(doc.context.stream(new Uint8Array(5000).fill(7)));
    }
    const bloated = await doc.save({ useObjectStreams: false });

    const result = await compress({ input: { name: 'b.pdf', bytes: bloated }, level: 'recommended', outputName: 'c.pdf' }, noProgress);

    expect(result.unchanged).toBe(false);
    expect(result.before).toBe(bloated.byteLength);
    expect(result.after).toBe(result.file.bytes.byteLength);
    expect(result.after).toBeLessThan(result.before / 3);
    const reopened = await PDFDocument.load(result.file.bytes);
    expect(reopened.getPageCount()).toBe(20);
    expect(reopened.getPage(0).node.get(PDFName.of('Thumb'))).toBeUndefined();
  });

  it('returns the original when it cannot be made smaller', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 200]);
    const tight = await doc.save({ useObjectStreams: true });

    const result = await compress({ input: { name: 't.pdf', bytes: tight }, level: 'strong', outputName: 'c.pdf' }, noProgress);

    expect(result.unchanged).toBe(true);
    expect(result.after).toBe(result.before);
    expect(result.file.bytes).toEqual(tight);
    expect(await pageSizesOf(result.file.bytes)).toEqual([[200, 200]]);
  });
});
