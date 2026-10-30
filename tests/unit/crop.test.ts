import { degrees, PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { crop, croppedBox, unrotateMargins } from '../../src/lib/pdf/ops/crop';
import { dragCrop, minimumSize, noMargins, setMargin } from '../../src/lib/organize/cropMath';
import { noProgress } from '../../src/lib/pdf/types';

const margins = { left: 0.1, top: 0.2, right: 0.3, bottom: 0.05 };

describe('unrotateMargins', () => {
  it('is unchanged without rotation', () => {
    expect(unrotateMargins(margins, 0)).toEqual(margins);
  });

  it('maps displayed edges back to page edges for each quarter turn', () => {
    // At 90° clockwise the page's left edge is displayed on top.
    expect(unrotateMargins(margins, 90)).toEqual({ left: 0.2, top: 0.3, right: 0.05, bottom: 0.1 });
    expect(unrotateMargins(margins, 180)).toEqual({ left: 0.3, top: 0.05, right: 0.1, bottom: 0.2 });
    expect(unrotateMargins(margins, 270)).toEqual({ left: 0.05, top: 0.1, right: 0.2, bottom: 0.3 });
    expect(unrotateMargins(margins, -90)).toEqual(unrotateMargins(margins, 270));
  });
});

describe('croppedBox', () => {
  it('trims inside an existing, offset crop box', () => {
    const box = croppedBox({ x: 50, y: 100, width: 200, height: 400 }, margins, 0);
    expect(box.x).toBeCloseTo(70);
    expect(box.y).toBeCloseTo(120);
    expect(box.width).toBeCloseTo(120);
    expect(box.height).toBeCloseTo(300);
  });
});

async function cropOnePage(rotation: number) {
  const original = await PDFDocument.create();
  const page = original.addPage([200, 400]);
  page.setRotation(degrees(rotation));
  original.addPage([200, 400]);
  const [output] = await crop(
    { input: { name: 'doc.pdf', bytes: await original.save() }, margins: { left: 0.25, top: 0, right: 0, bottom: 0 }, pages: [0] },
    noProgress,
  );
  expect(output!.name).toBe('doc-cropped.pdf');
  const doc = await PDFDocument.load(output!.bytes);
  return doc.getPages().map((p) => p.getCropBox());
}

describe('crop', () => {
  it('trims the displayed left edge of an unrotated page', async () => {
    const [first, second] = await cropOnePage(0);
    expect(first).toEqual({ x: 50, y: 0, width: 150, height: 400 });
    // Pages not chosen are untouched.
    expect(second).toEqual({ x: 0, y: 0, width: 200, height: 400 });
  });

  it('trims the edge that is shown on the left of a rotated page', async () => {
    // At 90° the page's bottom edge is displayed on the left, so 25% of the height goes.
    const [first] = await cropOnePage(90);
    expect(first).toEqual({ x: 0, y: 100, width: 200, height: 300 });
  });

  it('refuses margins that leave nothing', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([100, 100]);
    await expect(
      crop(
        { input: { name: 'a.pdf', bytes: await doc.save() }, margins: { left: 0.6, top: 0, right: 0.5, bottom: 0 }, pages: [0] },
        noProgress,
      ),
    ).rejects.toBeInstanceOf(RangeError);
  });
});

describe('dragCrop', () => {
  const start = { left: 0.1, top: 0.1, right: 0.1, bottom: 0.1 };

  it('moves single edges and corners', () => {
    expect(dragCrop(start, 'left', 0.2, 0.5)).toEqual({ ...start, left: 0.30000000000000004 });
    expect(dragCrop(start, 'bottomRight', -0.1, -0.1)).toEqual({ ...start, right: 0.2, bottom: 0.2 });
  });

  it('stops at the page border and keeps a minimum size', () => {
    expect(dragCrop(start, 'top', 0, -1).top).toBe(0);
    expect(dragCrop(start, 'left', 5, 0).left).toBeCloseTo(1 - 0.1 - minimumSize);
  });

  it('moves the whole box without resizing it', () => {
    const moved = dragCrop(start, 'move', 0.5, -0.5);
    expect(moved.left + moved.right).toBeCloseTo(0.2);
    expect(moved).toEqual({ left: 0.2, top: 0, right: 0, bottom: 0.2 });
  });
});

describe('setMargin', () => {
  it('clamps typed values', () => {
    expect(setMargin(noMargins, 'top', 2).top).toBeCloseTo(1 - minimumSize);
    expect(setMargin(noMargins, 'top', -1).top).toBe(0);
    expect(setMargin(noMargins, 'top', Number.NaN).top).toBe(0);
  });
});
