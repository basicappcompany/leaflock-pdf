import { PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { extractImages } from '../../src/lib/pdf/ops/extractImages';
import { ToolError } from '../../src/lib/pdf/errors';
import { noProgress } from '../../src/lib/pdf/types';
import { makeJpeg } from '../fixtures/images';

describe('extractImages', () => {
  it('extracts a JPEG-filtered image byte for byte, under a position-based name', async () => {
    const doc = await PDFDocument.create();
    const jpeg = makeJpeg(40, 30);
    const image = await doc.embedJpg(jpeg);
    const page = doc.addPage([100, 100]);
    page.drawImage(image, { x: 0, y: 0, width: 40, height: 30 });
    const bytes = await doc.save();

    const result = await extractImages({ input: { name: 'photo.pdf', bytes } }, noProgress);

    expect(result.extracted).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.files).toHaveLength(1);
    expect(result.files[0]!.name).toBe('photo-image-1.jpg');
    expect(result.files[0]!.type).toBe('image/jpeg');
    expect(result.files[0]!.bytes).toEqual(jpeg);
  });

  it('extracts more than one image, named in order', async () => {
    const doc = await PDFDocument.create();
    const page = doc.addPage([200, 100]);
    const a = await doc.embedJpg(makeJpeg(10, 10));
    const b = await doc.embedJpg(makeJpeg(10, 10));
    page.drawImage(a, { x: 0, y: 0, width: 10, height: 10 });
    page.drawImage(b, { x: 50, y: 0, width: 10, height: 10 });
    const bytes = await doc.save();

    const result = await extractImages({ input: { name: 'two.pdf', bytes } }, noProgress);
    expect(result.files.map((file) => file.name).sort()).toEqual(['two-image-1.jpg', 'two-image-2.jpg']);
  });

  it('does not extract a soft mask as if it were a content image of its own', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    const context = doc.context;

    const mask = context.register(
      context.stream(new Uint8Array(100).fill(255), {
        Type: 'XObject', Subtype: 'Image', Width: 10, Height: 10, BitsPerComponent: 8, ColorSpace: 'DeviceGray',
      }),
    );
    context.register(
      context.stream(makeJpeg(10, 10), {
        Type: 'XObject', Subtype: 'Image', Filter: 'DCTDecode', Width: 10, Height: 10, BitsPerComponent: 8, ColorSpace: 'DeviceRGB', SMask: mask,
      }),
    );
    const bytes = await doc.save();

    const result = await extractImages({ input: { name: 'masked.pdf', bytes } }, noProgress);
    // Only the base image is content; the mask stream must not show up as a second file.
    expect(result.extracted).toBe(1);
    expect(result.files[0]!.name).toBe('masked-image-1.jpg');
  });

  it('counts an unsupported filter as skipped rather than silently dropping it', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    doc.context.register(
      doc.context.stream(new Uint8Array([1, 2, 3, 4]), {
        Type: 'XObject',
        Subtype: 'Image',
        Filter: 'CCITTFaxDecode',
        Width: 10,
        Height: 10,
        BitsPerComponent: 1,
        ColorSpace: 'DeviceGray',
      }),
    );
    const bytes = await doc.save();

    const result = await extractImages({ input: { name: 'fax.pdf', bytes } }, noProgress);
    expect(result.extracted).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.files).toEqual([]);
  });

  it('rejects a document with no images at all', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    const bytes = await doc.save();
    await expect(extractImages({ input: { name: 'blank.pdf', bytes } }, noProgress)).rejects.toThrow(ToolError);
  });
});
