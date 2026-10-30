import { PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { jpegOrientation } from '../../src/lib/convert/exif';
import { ToolError } from '../../src/lib/pdf/errors';
import { imagesToPdf, orientationMatrix, type ImagesToPdfArgs } from '../../src/lib/pdf/ops/imagesToPdf';
import { noProgress } from '../../src/lib/pdf/types';
import { makeJpeg, makePng } from '../fixtures/images';

async function convert(overrides: Partial<ImagesToPdfArgs>) {
  const [output] = await imagesToPdf(
    { images: [], pageSize: 'fit', orientation: 'auto', margin: 'none', outputName: 'images.pdf', ...overrides },
    noProgress,
  );
  return PDFDocument.load(output!.bytes);
}

function sizes(doc: PDFDocument) {
  return doc.getPages().map((page) => {
    const { width, height } = page.getSize();
    return [Math.round(width), Math.round(height)];
  });
}

describe('imagesToPdf', () => {
  it('makes one page per image, sized to the image at 96 dpi', async () => {
    const doc = await convert({
      images: [
        { name: 'wide.png', bytes: makePng(400, 200) },
        { name: 'tall.jpg', bytes: makeJpeg(80, 160) },
      ],
    });
    expect(sizes(doc)).toEqual([[300, 150], [60, 120]]);
  });

  it('adds margins around fitted pages', async () => {
    const small = await convert({ images: [{ name: 'a.png', bytes: makePng(400, 200) }], margin: 'small' });
    const large = await convert({ images: [{ name: 'a.png', bytes: makePng(400, 200) }], margin: 'large' });
    expect(sizes(small)).toEqual([[348, 198]]);
    expect(sizes(large)).toEqual([[400, 250]]);
  });

  it('uses A4 and Letter, turning pages to suit wide images in auto mode', async () => {
    const images = [
      { name: 'wide.png', bytes: makePng(400, 200) },
      { name: 'tall.png', bytes: makePng(200, 400) },
    ];
    expect(sizes(await convert({ images, pageSize: 'a4' }))).toEqual([[842, 595], [595, 842]]);
    expect(sizes(await convert({ images, pageSize: 'letter' }))).toEqual([[792, 612], [612, 792]]);
    expect(sizes(await convert({ images, pageSize: 'a4', orientation: 'portrait' }))).toEqual([[595, 842], [595, 842]]);
    expect(sizes(await convert({ images, pageSize: 'letter', orientation: 'landscape' }))).toEqual([[792, 612], [792, 612]]);
  });

  it('caps huge images at the largest page size viewers accept', async () => {
    const doc = await convert({ images: [{ name: 'huge.jpg', bytes: makeJpeg(40_000, 10_000) }] });
    expect(sizes(doc)).toEqual([[14400, 3600]]);
  });

  it('names the image it could not read', async () => {
    const broken = makeJpeg(10, 10).slice(0, 10);
    await expect(convert({ images: [{ name: 'broken.jpg', bytes: broken }] })).rejects.toMatchObject({
      code: 'unreadableImage',
      values: { name: 'broken.jpg' },
    });
  });

  it('reports formats it cannot convert outside a browser', async () => {
    const webp = new TextEncoder().encode('RIFF....WEBPVP8 ');
    await expect(convert({ images: [{ name: 'photo.webp', bytes: webp }] })).rejects.toBeInstanceOf(ToolError);
  });

  it('swaps page orientation for sideways phone photos', async () => {
    // A 160×80 stored JPEG tagged "rotate 90° clockwise" shows as 80×160.
    const doc = await convert({ images: [{ name: 'phone.jpg', bytes: makeJpeg(160, 80, 6) }] });
    expect(sizes(doc)).toEqual([[60, 120]]);
  });
});

describe('orientationMatrix', () => {
  // Where the stored image's top-left corner (u=0, v=1) ends up in a 10×20 box at the origin.
  const topLeft = (exif: number) => {
    const [a, b, c, d, e, f] = orientationMatrix(exif, 0, 0, 10, 20);
    return [a * 0 + c * 1 + e, b * 0 + d * 1 + f];
  };

  it('puts the top-left corner where each EXIF orientation says', () => {
    expect(topLeft(1)).toEqual([0, 20]);
    expect(topLeft(3)).toEqual([10, 0]);
    expect(topLeft(6)).toEqual([10, 20]);
    expect(topLeft(8)).toEqual([0, 0]);
  });
});

describe('jpegOrientation', () => {
  it('reads the EXIF tag, and defaults to 1', () => {
    expect(jpegOrientation(makeJpeg(4, 4, 6))).toBe(6);
    expect(jpegOrientation(makeJpeg(4, 4, 3))).toBe(3);
    expect(jpegOrientation(makeJpeg(4, 4))).toBe(1);
    expect(jpegOrientation(new Uint8Array([1, 2, 3]))).toBe(1);
  });
});
