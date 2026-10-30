import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { tableToPdf, type TableSheet } from '../../src/lib/pdf/ops/tableToPdf';
import { noProgress } from '../../src/lib/pdf/types';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

const run = (sheets: TableSheet[]) => tableToPdf({ sheets, outputName: 'out.pdf' }, noProgress);

/** Text runs of every page, positioned, so a test can check a cell landed in the right
 * column rather than merely that its text exists somewhere on the page. */
async function allRuns(bytes: Uint8Array) {
  const doc = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const content = await (await doc.getPage(number)).getTextContent();
    pages.push(content.items.flatMap((item) => ('str' in item && item.str.trim() ? [{ text: item.str, x: item.transform[4] as number }] : [])));
  }
  await doc.loadingTask.destroy();
  return pages;
}

describe('tableToPdf', () => {
  it('draws a sheet name as a heading and every cell in its row', async () => {
    const result = await run([{ name: 'Prices', rows: [['Item', 'Price'], ['Widget', '$9']] }]);
    expect(result.pages).toBe(1);

    const runs = (await allRuns(result.file.bytes))[0]!;
    const texts = runs.map((r) => r.text);
    expect(texts).toEqual(['Prices', 'Item', 'Price', 'Widget', '$9']);
  });

  it('keeps each column in its own x band across every row', async () => {
    const result = await run([
      { name: 'Sheet', rows: [['a', 'b', 'c'], ['dd', 'ee', 'ff']] },
    ]);
    const runs = (await allRuns(result.file.bytes))[0]!;

    const byText = (text: string) => runs.find((r) => r.text === text)!;
    // Same column, two different rows: the x position matches to the nearest point.
    expect(Math.round(byText('a').x)).toBe(Math.round(byText('dd').x));
    expect(Math.round(byText('b').x)).toBe(Math.round(byText('ee').x));
    expect(Math.round(byText('c').x)).toBe(Math.round(byText('ff').x));
    // Different columns land at different x.
    expect(byText('a').x).toBeLessThan(byText('b').x);
    expect(byText('b').x).toBeLessThan(byText('c').x);
  });

  it('starts a new page for a second sheet', async () => {
    const result = await run([
      { name: 'First', rows: [['a']] },
      { name: 'Second', rows: [['b']] },
    ]);
    expect(result.pages).toBe(2);

    const pages = await allRuns(result.file.bytes);
    expect(pages[0]!.map((r) => r.text)).toEqual(['First', 'a']);
    expect(pages[1]!.map((r) => r.text)).toEqual(['Second', 'b']);
  });

  it('skips an empty sheet rather than giving it a blank page', async () => {
    const result = await run([
      { name: 'Empty', rows: [] },
      { name: 'Real', rows: [['x']] },
    ]);
    expect(result.pages).toBe(1);
    expect((await allRuns(result.file.bytes))[0]!.map((r) => r.text)).toEqual(['Real', 'x']);
  });

  it('wraps a long cell onto more than one line without losing the row after it', async () => {
    const long = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
    const result = await run([{ name: 'Sheet', rows: [['short', long], ['next', 'row']] }]);
    const texts = (await allRuns(result.file.bytes))[0]!.map((r) => r.text);
    expect(texts).toContain('next');
    expect(texts).toContain('row');
  });

  it('starts a new page once rows overflow the first', async () => {
    const rows = Array.from({ length: 60 }, (_, i) => [`row ${i}`, 'value']);
    const result = await run([{ name: 'Big sheet', rows }]);
    expect(result.pages).toBeGreaterThan(1);

    const doc = await getDocument({ data: new Uint8Array(result.file.bytes) }).promise;
    expect(doc.numPages).toBe(result.pages);
    await doc.loadingTask.destroy();
  });

  it('refuses a workbook with no rows on any sheet', async () => {
    await expect(run([{ name: 'A', rows: [] }, { name: 'B', rows: [] }])).rejects.toMatchObject({ code: 'no-text' });
  });
});
