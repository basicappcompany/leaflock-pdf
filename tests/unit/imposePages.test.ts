import { degrees, PDFDict, PDFDocument, PDFName, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { bookletSheets, nUpSheets } from '../../src/lib/organize/imposition';
import { loadPdf } from '../../src/lib/pdf/load';
import { imposePages } from '../../src/lib/pdf/ops/imposePages';
import { noProgress } from '../../src/lib/pdf/types';
import { pageSizesOf } from '../fixtures/pdfs';

const A4 = { width: 595, height: 842 };

/** Pages with drawn content, so they can be embedded. */
async function contentPdf(count: number, size: [number, number] = [200, 300]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < count; i++) {
    doc.addPage(size).drawText(`Page ${i + 1}`, { x: 10, y: 10, size: 12, font });
  }
  doc.setTitle('Source Title');
  return doc.save();
}

const run = (bytes: Uint8Array, sheets: (number | null)[][], grid: { columns: number; rows: number }, border = false) =>
  imposePages(
    { input: { name: 'doc.pdf', bytes }, sheets, grid, sheet: A4, margin: 20, gutter: 10, border, outputName: 'out.pdf' },
    noProgress,
  );

/** How many embedded pages were drawn onto each sheet of the output. */
async function xobjectsPerSheet(bytes: Uint8Array): Promise<number[]> {
  const doc = await loadPdf({ name: 'out.pdf', bytes });
  return doc.getPages().map((page) => {
    const resources = page.node.Resources();
    const xobjects = resources?.lookupMaybe(PDFName.of('XObject'), PDFDict);
    return xobjects ? xobjects.keys().length : 0;
  });
}

describe('imposePages', () => {
  it('makes one output sheet per entry, at the sheet size asked for', async () => {
    const result = await run(await contentPdf(8), nUpSheets(8, 4), { columns: 2, rows: 2 });
    expect(result.sheets).toBe(2);
    expect(await pageSizesOf(result.file.bytes)).toEqual([
      [595, 842],
      [595, 842],
    ]);
  });

  it('draws every page of the layout, and nothing for an empty cell', async () => {
    const result = await run(await contentPdf(5), nUpSheets(5, 4), { columns: 2, rows: 2 });
    // Four on the first sheet, one on the second; the three padding cells draw nothing.
    expect(await xobjectsPerSheet(result.file.bytes)).toEqual([4, 1]);
  });

  it('embeds a page used twice only once', async () => {
    // A booklet of one page puts it on one side and leaves the rest empty.
    const result = await run(await contentPdf(1), bookletSheets(1), { columns: 2, rows: 1 });
    expect(result.sheets).toBe(2);
    expect(await xobjectsPerSheet(result.file.bytes)).toEqual([1, 0]);
  });

  it('skips a page with no content instead of failing the whole job', async () => {
    // A scanner's blank back: a real page, but with no /Contents at all. pdf-lib refuses
    // to embed it, and before this was handled it took the entire operation down.
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    doc.addPage([200, 300]).drawText('Front', { x: 10, y: 10, size: 12, font });
    doc.addPage([200, 300]); // never drawn on, so it has no contents
    const result = await run(await doc.save(), nUpSheets(2, 2), { columns: 2, rows: 1 });

    expect(result.skipped).toBe(1);
    expect(await xobjectsPerSheet(result.file.bytes)).toEqual([1]);
  });

  it('fails only when no page can be drawn at all', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([200, 300]);
    await expect(run(await doc.save(), nUpSheets(1, 2), { columns: 2, rows: 1 })).rejects.toMatchObject({
      code: 'nothing-to-impose',
      values: { name: 'doc.pdf' },
    });
  });

  it('lays out a quarter-turned page without failing', async () => {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([200, 400]);
    page.drawText('sideways', { x: 10, y: 10, size: 12, font });
    page.setRotation(degrees(90));
    const result = await run(await doc.save(), nUpSheets(1, 2), { columns: 2, rows: 1 });
    expect(await xobjectsPerSheet(result.file.bytes)).toEqual([1]);
  });

  it('draws a border around each page when asked', async () => {
    const plain = await run(await contentPdf(2), nUpSheets(2, 2), { columns: 2, rows: 1 }, false);
    const bordered = await run(await contentPdf(2), nUpSheets(2, 2), { columns: 2, rows: 1 }, true);
    expect(bordered.file.bytes.length).toBeGreaterThan(plain.file.bytes.length);
  });

  it('carries the source title onto the result', async () => {
    const result = await run(await contentPdf(4), nUpSheets(4, 4), { columns: 2, rows: 2 });
    expect((await loadPdf({ name: 'out.pdf', bytes: result.file.bytes })).getTitle()).toBe('Source Title');
  });

  it('refuses a page index the document does not have', async () => {
    await expect(run(await contentPdf(2), [[0, 9]], { columns: 2, rows: 1 })).rejects.toBeInstanceOf(RangeError);
  });
});
