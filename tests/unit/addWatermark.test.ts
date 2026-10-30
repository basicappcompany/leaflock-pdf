import { PDFDict, PDFDocument, PDFName } from '@cantoo/pdf-lib';
import { describe, expect, it } from 'vitest';
import { ToolError } from '../../src/lib/pdf/errors';
import { addWatermark, type AddWatermarkArgs } from '../../src/lib/pdf/ops/addWatermark';
import { noProgress } from '../../src/lib/pdf/types';
import { makePdf } from '../fixtures/pdfs';
import { makePng, pdf, readPages } from './editHelpers';

const textArgs: Omit<AddWatermarkArgs, 'input'> = {
  outputName: 'marked.pdf',
  content: { kind: 'text', text: 'CONFIDENTIAL', fontSize: 48, color: '#cc0000' },
  opacity: 0.3,
  angle: 45,
  placement: 'center',
  layer: 'over',
  pages: null,
};

async function run(bytes: Uint8Array, options: Partial<AddWatermarkArgs> = {}) {
  const [output] = await addWatermark({ ...textArgs, input: pdf('in.pdf', bytes), ...options }, noProgress);
  return output!.bytes;
}

describe('addWatermark', () => {
  it('stamps text on every page, centred', async () => {
    const pages = await readPages(await run(await makePdf([[400, 600], [400, 600]])));
    for (const page of pages) {
      expect(page.text).toContain('CONFIDENTIAL');
    }
  });

  it('draws over the content by default and under it when asked', async () => {
    const source = await makePdf([[400, 600]]);
    const over = (await readPages(await run(source)))[0]!.items.map((item) => item.text);
    const under = (await readPages(await run(source, { layer: 'under' })))[0]!.items.map((item) => item.text);
    // Text order follows drawing order.
    expect(over).toEqual(['Page 1', 'CONFIDENTIAL']);
    expect(under).toEqual(['CONFIDENTIAL', 'Page 1']);
  });

  it('only marks the chosen pages', async () => {
    const pages = await readPages(await run(await makePdf([[400, 600], [400, 600], [400, 600]]), { pages: [1] }));
    expect(pages.map((page) => page.text.includes('CONFIDENTIAL'))).toEqual([false, true, false]);
  });

  it('tiles the mark across the page', async () => {
    const pages = await readPages(
      await run(await makePdf([[600, 800]]), {
        placement: 'tile',
        content: { kind: 'text', text: 'DRAFT', fontSize: 24, color: '#000000' },
      }),
    );
    expect(pages[0]!.items.filter((item) => item.text === 'DRAFT').length).toBeGreaterThan(6);
  });

  it('embeds an image watermark', async () => {
    const bytes = await run(await makePdf([[400, 600]]), {
      content: { kind: 'image', bytes: makePng(20, 10, [0, 0, 255, 255]), type: 'png', scale: 0.5 },
    });
    const doc = await PDFDocument.load(bytes);
    const xObjects = doc.getPage(0).node.Resources()!.lookup(PDFName.of('XObject'), PDFDict);
    expect(xObjects.keys().length).toBe(1);
  });

  it('rejects empty text and broken images', async () => {
    const source = await makePdf([[400, 600]]);
    await expect(run(source, { content: { kind: 'text', text: '  ', fontSize: 20, color: '#000000' } })).rejects.toMatchObject({
      code: 'empty-text',
    });
    await expect(
      run(source, { content: { kind: 'image', bytes: new Uint8Array([1, 2, 3]), type: 'png', scale: 0.5 } }),
    ).rejects.toBeInstanceOf(ToolError);
  });
});
