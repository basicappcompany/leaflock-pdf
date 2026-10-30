import { degrees, PDFDocument } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { addPageNumbers, type AddPageNumbersArgs } from '../../src/lib/pdf/ops/addPageNumbers';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';
import { pdf, readPages } from './editHelpers';

const base: Omit<AddPageNumbersArgs, 'input'> = {
  outputName: 'numbered.pdf',
  template: 'Page {n} of {total}',
  position: 'bottom-center',
  startAt: 1,
  fontSize: 12,
  margin: 24,
  color: '#000000',
  pages: null,
};

async function run(bytes: Uint8Array, options: Partial<AddPageNumbersArgs> = {}) {
  const [output] = await addPageNumbers({ ...base, input: pdf('in.pdf', bytes), ...options }, noProgress);
  return readPages(output!.bytes);
}

describe('addPageNumbers', () => {
  it('numbers every page with the template', async () => {
    const pages = await run(await makePdf([[300, 400], [300, 400], [300, 400]]));
    expect(pages.map((page) => page.text)).toEqual([
      expect.stringContaining('Page 1 of 3'),
      expect.stringContaining('Page 2 of 3'),
      expect.stringContaining('Page 3 of 3'),
    ]);
  });

  it('numbers only the chosen pages, starting at the chosen number', async () => {
    const pages = await run(await makePdf([[300, 400], [300, 400], [300, 400]]), {
      pages: [1, 2],
      startAt: 5,
      template: '{n} / {total}',
    });
    expect(pages[0]!.text).not.toContain('/');
    expect(pages[1]!.text).toContain('5 / 6');
    expect(pages[2]!.text).toContain('6 / 6');
  });

  it('puts the number at the bottom edge the reader sees, on rotated and cropped pages', async () => {
    const doc = await PDFDocument.create();
    const rotated = doc.addPage([600, 800]);
    rotated.setRotation(degrees(90));
    const cropped = doc.addPage([600, 800]);
    cropped.setCropBox(100, 200, 300, 400);
    const bytes = await doc.save();

    const pages = await run(bytes, { template: 'n{n}', position: 'bottom-center' });
    for (const page of pages) {
      const item = page.items.find((candidate) => candidate.text.startsWith('n'))!;
      expect(item).toBeDefined();
      // Baseline a little above the displayed bottom edge, roughly centred.
      expect(page.height - item.y).toBeGreaterThan(20);
      expect(page.height - item.y).toBeLessThan(40);
      expect(Math.abs(item.x - page.width / 2)).toBeLessThan(20);
    }
  });

  it('places top-right numbers at the top-right corner', async () => {
    const pages = await run(await makePdf([[300, 400]]), { template: '{n}', position: 'top-right' });
    const item = pages[0]!.items.find((candidate) => candidate.text === '1')!;
    expect(item.y).toBeLessThan(45);
    expect(item.x).toBeGreaterThan(250);
  });
});
