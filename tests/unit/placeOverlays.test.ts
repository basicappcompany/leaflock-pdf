import { degrees, PDFDict, PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import type { OverlayItem } from '../../src/lib/edit/overlays';
import { placeOverlays } from '../../src/lib/pdf/ops/placeOverlays';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';
import { makePng, pdf, readPages } from './editHelpers';

async function run(bytes: Uint8Array, items: OverlayItem[], images = {}) {
  const [output] = await placeOverlays({ input: pdf('in.pdf', bytes), outputName: 'out.pdf', items, images }, noProgress);
  return output!.bytes;
}

const box = { x: 0.1, y: 0.2, w: 0.3, h: 0.1 };

describe('placeOverlays', () => {
  it('writes text starting at the box’s top-left corner', async () => {
    const bytes = await run(await makePdf([[400, 600]]), [
      { id: 't', page: 0, kind: 'text', text: 'Approved', fontSize: 14, color: '#000000', ...box },
    ]);
    const page = (await readPages(bytes))[0]!;
    const item = page.items.find((candidate) => candidate.text === 'Approved')!;
    expect(item.x).toBeCloseTo(40, 0);
    // Baseline sits one line below the top of the box (120 pt from the top).
    expect(item.y).toBeGreaterThan(120);
    expect(item.y).toBeLessThan(140);
  });

  it('keeps text upright on a rotated page', async () => {
    const doc = await PDFDocument.create();
    doc.addPage([400, 600]).setRotation(degrees(90));
    const bytes = await run(await doc.save(), [
      { id: 't', page: 0, kind: 'text', text: 'Upright', fontSize: 14, color: '#000000', ...box },
    ]);
    const page = (await readPages(bytes))[0]!;
    const item = page.items.find((candidate) => candidate.text === 'Upright')!;
    // Displayed page is 600 wide; the box starts 10% in from the left and 20% down.
    expect(item.x).toBeCloseTo(60, 0);
    expect(item.y).toBeGreaterThan(80);
    expect(item.y).toBeLessThan(100);
  });

  it('embeds a shared image once and places it on several pages', async () => {
    const images = { sig: { bytes: makePng(30, 10, [0, 0, 0, 255]), type: 'png' as const } };
    const bytes = await run(
      await makePdf([[400, 600], [400, 600]]),
      [
        { id: 'a', page: 0, kind: 'image', imageId: 'sig', ...box },
        { id: 'b', page: 1, kind: 'image', imageId: 'sig', ...box },
      ],
      images,
    );
    const doc = await PDFDocument.load(bytes);
    const refs = doc.getPages().map((page) => {
      const xObjects = page.node.Resources()!.lookup(PDFName.of('XObject'), PDFDict);
      return xObjects.get(xObjects.keys()[0]!)!.toString();
    });
    expect(refs[0]).toBe(refs[1]);
  });

  it('draws shapes, highlights and white-out boxes', async () => {
    const bytes = await run(await makePdf([[400, 600]]), [
      { id: 'r', page: 0, kind: 'rect', stroke: '#ff0000', fill: null, strokeWidth: 2, ...box },
      { id: 'h', page: 0, kind: 'highlight', color: '#ffeb3b', ...box, y: 0.4 },
      { id: 'w', page: 0, kind: 'whiteout', ...box, y: 0.6 },
    ]);
    const doc = await PDFDocument.load(bytes);
    // The highlight's transparency needs a graphics state.
    const states = doc.getPage(0).node.Resources()!.lookup(PDFName.of('ExtGState'), PDFDict);
    expect(states.keys().length).toBeGreaterThan(0);
  });

  it('ignores items on pages that don’t exist, and refuses an empty list', async () => {
    const source = await makePdf([[400, 600]]);
    await expect(run(source, [{ id: 'x', page: 5, kind: 'whiteout', ...box }])).resolves.toBeInstanceOf(Uint8Array);
    await expect(run(source, [])).rejects.toMatchObject({ code: 'nothing-placed' });
  });
});
