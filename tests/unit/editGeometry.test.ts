import { degrees, PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { pageFrame, parseHexColor, placeInBox } from '../../src/lib/edit/geometry';

async function page(rotation: number, crop?: [number, number, number, number]) {
  const doc = await PDFDocument.create();
  const p = doc.addPage([600, 800]);
  if (crop) p.setCropBox(...crop);
  p.setRotation(degrees(rotation));
  return p;
}

describe('pageFrame', () => {
  it('maps the displayed top-left corner for every rotation', async () => {
    // Unrotated user space: the displayed top-left corner is where a viewer starts drawing.
    expect((await page(0)).getRotation().angle).toBe(0);
    const cases: [number, { x: number; y: number }, [number, number]][] = [
      [0, { x: 0, y: 800 }, [600, 800]],
      [90, { x: 0, y: 0 }, [800, 600]],
      [180, { x: 600, y: 0 }, [600, 800]],
      [270, { x: 600, y: 800 }, [800, 600]],
    ];
    for (const [rotation, topLeft, size] of cases) {
      const frame = pageFrame(await page(rotation));
      expect(frame.toUser(0, 0)).toEqual(topLeft);
      expect([frame.width, frame.height]).toEqual(size);
    }
  });

  it('works inside the crop box', async () => {
    const frame = pageFrame(await page(0, [50, 100, 400, 500]));
    expect([frame.width, frame.height]).toEqual([400, 500]);
    expect(frame.toUser(0, 0)).toEqual({ x: 50, y: 600 });
    expect(frame.toUser(400, 500)).toEqual({ x: 450, y: 100 });
  });

  it('treats negative rotations like their positive equivalent', async () => {
    expect(pageFrame(await page(-90)).rotation).toBe(270);
  });
});

describe('placeInBox', () => {
  it('puts an unrotated box’s bottom-left corner where pdf-lib expects it', async () => {
    const frame = pageFrame(await page(0));
    const at = placeInBox(frame, { centerX: 100, centerY: 100, width: 40, height: 20 });
    expect(at).toEqual({ x: 80, y: 690, rotate: 0 });
  });

  it('counter-rotates content on rotated pages', async () => {
    const frame = pageFrame(await page(90));
    const at = placeInBox(frame, { centerX: 100, centerY: 100, width: 40, height: 20 });
    expect(at.rotate).toBe(90);
    // The box's displayed bottom-left (80, 110) maps to user space (110, 80).
    expect(at.x).toBeCloseTo(110);
    expect(at.y).toBeCloseTo(80);
  });
});

describe('parseHexColor', () => {
  it('reads #rrggbb and falls back to black', () => {
    expect(parseHexColor('#ff8000')).toEqual({ r: 1, g: 128 / 255, b: 0 });
    expect(parseHexColor('nope')).toEqual({ r: 0, g: 0, b: 0 });
  });
});
