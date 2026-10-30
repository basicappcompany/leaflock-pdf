/// <reference types="node" />
import { fileURLToPath } from 'node:url';
import { degrees, PDFDocument } from '@cantoo/pdf-lib';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { describe, expect, it } from 'vitest';
import { addTextLayer, toPagePoint, type OcrWord } from '../../src/lib/pdf/ops/addTextLayer';
import { noProgress } from '../../src/lib/pdf/types';

// pdf.js in Node wants a plain file path, with forward slashes and a trailing slash, for its standard fonts.
const fontsDir = fileURLToPath(new URL('../../node_modules/pdfjs-dist/standard_fonts/', import.meta.url)).replaceAll(
  '\\',
  '/',
);

async function blankPdf(rotation = 0): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  page.setRotation(degrees(rotation));
  return doc.save();
}

/** Text items pdf.js finds on page 1, with their positions. */
async function textItems(bytes: Uint8Array) {
  const task = getDocument({ data: bytes.slice(), standardFontDataUrl: fontsDir });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const items = content.items.flatMap((item) => ('str' in item && item.str.trim() ? [item] : []));
  await task.destroy();
  return items;
}

const word = (text: string, x0: number, x1: number): OcrWord => ({ text, x0, x1, top: 100, bottom: 140, baseline: 132 });

describe('addTextLayer', () => {
  it('makes recognised words extractable, in reading order', async () => {
    const [output] = await addTextLayer(
      {
        input: { name: 'scan.pdf', bytes: await blankPdf() },
        // Rendered at 2 pixels per point: 1200×1600.
        pages: [{ pageIndex: 0, imageWidth: 1200, imageHeight: 1600, words: [word('Hello', 100, 300), word('world', 340, 560)] }],
        outputName: 'searchable.pdf',
      },
      noProgress,
    );

    const items = await textItems(output!.bytes);
    expect(items.map((item) => item.str)).toEqual(['Hello', 'world']);
    // "Hello" starts 50 pt from the left; its baseline is 66 pt from the top (800 - 66 = 734).
    const [, , , , x, y] = items[0]!.transform as number[];
    expect(x).toBeCloseTo(50, 0);
    expect(y).toBeCloseTo(734, 0);
    // Squeezed to the word's width: 100 pt.
    expect(items[0]!.width).toBeCloseTo(100, 0);
  });

  it('keeps encodable accents and drops characters Helvetica cannot draw', async () => {
    const [output] = await addTextLayer(
      {
        input: { name: 'scan.pdf', bytes: await blankPdf() },
        pages: [{ pageIndex: 0, imageWidth: 600, imageHeight: 800, words: [word('Café', 10, 90), word('Łódź', 100, 190), word('日本', 200, 260)] }],
        outputName: 'searchable.pdf',
      },
      noProgress,
    );
    const text = (await textItems(output!.bytes)).map((item) => item.str).join(' ');
    expect(text.trim().split(/\s+/)).toEqual(['Café', 'Lódz']);
  });

  it('places text correctly on rotated pages', async () => {
    const [output] = await addTextLayer(
      {
        input: { name: 'scan.pdf', bytes: await blankPdf(90) },
        // Displayed sideways: 800×600 points, rendered 1:1.
        pages: [{ pageIndex: 0, imageWidth: 800, imageHeight: 600, words: [word('Sideways', 100, 300)] }],
        outputName: 'searchable.pdf',
      },
      noProgress,
    );
    const [item] = await textItems(output!.bytes);
    expect(item!.str).toBe('Sideways');
    // Text runs up the unrotated page, so it reads left to right once the page is shown rotated.
    const [a, b] = item!.transform as number[];
    expect(Math.round(Math.atan2(b!, a!) * (180 / Math.PI))).toBe(90);
  });
});

describe('toPagePoint', () => {
  const box = { x: 0, y: 0, width: 600, height: 800 };
  it('maps the displayed top-left corner for every rotation', () => {
    expect(toPagePoint(0, 0, box, 0)).toEqual([0, 800]);
    expect(toPagePoint(0, 0, box, 90)).toEqual([0, 0]);
    expect(toPagePoint(0, 0, box, 180)).toEqual([600, 0]);
    expect(toPagePoint(0, 0, box, 270)).toEqual([600, 800]);
  });
});
