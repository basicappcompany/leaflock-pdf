import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { repair } from '../../src/lib/pdf/ops/repair';
import { noProgress } from '../../src/lib/pdf/types';
import { pageSizesOf } from '../fixtures/pdfs';

/** A classic (non-object-stream) PDF, so objects sit in the file as plain text we can damage. */
async function plainPdf(sizes: [number, number][]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const [width, height] of sizes) doc.addPage([width, height]).drawText('Hello', { x: 20, y: 20, font, size: 12 });
  return doc.save({ useObjectStreams: false });
}

const latin1 = (bytes: Uint8Array) => new TextDecoder('latin1').decode(bytes);
const fromLatin1 = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0));

async function rebuild(bytes: Uint8Array) {
  return repair({ mode: 'rebuild', input: { name: 'broken.pdf', bytes }, outputName: 'repaired.pdf' }, noProgress);
}

describe('repair', () => {
  it('recovers a file whose cross-reference offsets are wrong', async () => {
    const original = await plainPdf([[200, 300], [300, 400]]);
    // Shift every xref offset so none of them point at the right object.
    const damaged = latin1(original).replace(/(\d{10}) (\d{5}) n/g, (_match, offset: string, gen: string) =>
      `${String(Number(offset) + 7).padStart(10, '0')} ${gen} n`,
    );
    const result = await rebuild(fromLatin1(damaged));
    expect(result).toMatchObject({ method: 'rebuilt', pages: 2, lostPages: 0 });
    expect(await pageSizesOf(result.file.bytes)).toEqual([[200, 300], [300, 400]]);
  });

  it('recovers a file cut off before its cross-reference table', async () => {
    const original = latin1(await plainPdf([[200, 300], [300, 400], [400, 500]]));
    const truncated = original.slice(0, original.lastIndexOf('endobj') + 'endobj'.length);
    const result = await rebuild(fromLatin1(truncated));
    expect(result.pages).toBe(3);
    expect(await pageSizesOf(result.file.bytes)).toEqual([[200, 300], [300, 400], [400, 500]]);
  });

  it('gives up cleanly on something that is not a PDF', async () => {
    await expect(rebuild(new TextEncoder().encode('just some text, no PDF here'))).rejects.toMatchObject({
      code: 'cannot-rebuild',
      values: { name: 'broken.pdf' },
    });
  });

  it('rebuilds from rendered page images', async () => {
    // Smallest valid baseline JPEG (1×1 px).
    const jpeg = Uint8Array.from(
      atob(
        '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
      ),
      (char) => char.charCodeAt(0),
    );
    const result = await repair(
      {
        mode: 'from-images',
        pages: [
          { jpeg, width: 200, height: 300 },
          { jpeg, width: 400, height: 300 },
        ],
        outputName: 'repaired.pdf',
      },
      noProgress,
    );
    expect(result).toMatchObject({ method: 'images', pages: 2 });
    expect(await pageSizesOf(result.file.bytes)).toEqual([[200, 300], [400, 300]]);
  });
});
