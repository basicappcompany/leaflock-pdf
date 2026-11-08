import { PDFDocument, PDFName, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { compress, compressSettings, targetLadder } from '../../src/lib/pdf/ops/compress';
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

  describe('to a target size', () => {
    /** A bloated file whose dead weight compress removes, so its size really does change. */
    async function bloated() {
      const doc = await PDFDocument.create();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      for (let i = 0; i < 20; i++) {
        const page = doc.addPage([300, 400]);
        page.drawText(`Page ${i + 1}`, { x: 20, y: 200, font, size: 20 });
        page.node.set(PDFName.of('Thumb'), doc.context.register(doc.context.flateStream(new Uint8Array(4000).fill(i))));
        doc.context.register(doc.context.stream(new Uint8Array(5000).fill(7)));
      }
      return doc.save({ useObjectStreams: false });
    }
    const run = (bytes: Uint8Array, targetBytes: number) =>
      compress({ input: { name: 'b.pdf', bytes }, targetBytes, outputName: 'c.pdf' }, noProgress);

    it('leaves a file that is already under the target exactly as it is', async () => {
      const original = await bloated();
      const result = await run(original, original.byteLength + 1);
      expect(result.unchanged).toBe(true);
      expect(result.target).toEqual({ bytes: original.byteLength + 1, reached: true });
      expect(result.file.bytes).toEqual(original);
    });

    it('reaches a target the file can be brought under, and says so', async () => {
      const original = await bloated();
      const level = await compress({ input: { name: 'b.pdf', bytes: original }, level: 'light', outputName: 'c.pdf' }, noProgress);
      const target = level.after + 500;
      const result = await run(original, target);
      expect(result.unchanged).toBe(false);
      expect(result.target).toEqual({ bytes: target, reached: true });
      expect(result.after).toBeLessThanOrEqual(target);
      expect(result.file.bytes.byteLength).toBe(result.after);
      expect((await PDFDocument.load(result.file.bytes)).getPageCount()).toBe(20);
    });

    it('reports a missed target and still hands back the smallest file it made', async () => {
      const original = await bloated();
      const result = await run(original, 100);
      expect(result.target).toEqual({ bytes: 100, reached: false });
      expect(result.unchanged).toBe(false);
      expect(result.after).toBeLessThan(result.before);
      expect(result.after).toBeGreaterThan(100);
    });

    it('returns the original, marked as missed, when nothing could make it smaller', async () => {
      const doc = await PDFDocument.create();
      doc.addPage([200, 200]);
      const tight = await doc.save({ useObjectStreams: true });
      const result = await run(tight, 10);
      expect(result.unchanged).toBe(true);
      expect(result.target).toEqual({ bytes: 10, reached: false });
      expect(result.file.bytes).toEqual(tight);
    });

    it('does not change what a level does', async () => {
      const original = await bloated();
      const byLevel = await compress({ input: { name: 'b.pdf', bytes: original }, level: 'strong', outputName: 'c.pdf' }, noProgress);
      expect(byLevel.target).toBeUndefined();
      expect(byLevel.after).toBeLessThan(byLevel.before);
    });

    it('tries the gentlest settings first, and only the first three are the levels people can pick', () => {
      expect(targetLadder.slice(0, 3)).toEqual([compressSettings.light, compressSettings.recommended, compressSettings.strong]);
      for (let i = 1; i < targetLadder.length; i++) {
        expect(targetLadder[i]!.maxSide, `step ${i} is smaller`).toBeLessThan(targetLadder[i - 1]!.maxSide);
        expect(targetLadder[i]!.quality, `step ${i} is lower quality`).toBeLessThan(targetLadder[i - 1]!.quality);
      }
      // It stops where a photo is still a photo.
      expect(targetLadder.at(-1)!.maxSide).toBeGreaterThanOrEqual(400);
    });
  });
});
