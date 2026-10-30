import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { Block } from '../../src/lib/convert/structure';
import { blocksToPdf } from '../../src/lib/pdf/ops/blocksToPdf';
import { pageTextRuns } from '../../src/lib/pdfjs';
import { noProgress } from '../../src/lib/pdf/types';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

const span = (text: string, bold = false, italic = false) => ({ text, bold, italic });

const run = (blocks: Block[]) => blocksToPdf({ blocks, outputName: 'out.pdf' }, noProgress);

/** Every text run of every page, read the same way `pageTextRuns` resolves bold/italic
 * for PDF -> Word — the round trip proves both that layout drew correctly and that this
 * writer and that reader agree on what bold and italic mean. */
async function allRuns(bytes: Uint8Array) {
  const doc = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const page = await doc.getPage(number);
    pages.push(await pageTextRuns(page));
  }
  await doc.loadingTask.destroy();
  return pages;
}

describe('blocksToPdf', () => {
  it('draws paragraph text onto the page', async () => {
    const result = await run([{ kind: 'paragraph', spans: [span('Hello, world.')] }]);
    expect(result.pages).toBe(1);

    const pages = await allRuns(result.file.bytes);
    expect(pages[0]!.map((r) => r.text).join('')).toBe('Hello, world.');
  });

  it('draws bold and italic with the right fonts', async () => {
    const result = await run([
      { kind: 'paragraph', spans: [span('plain '), span('bold', true), span(' and '), span('italic', false, true)] },
    ]);
    const runs = (await allRuns(result.file.bytes))[0]!;

    // Whitespace-only runs are skipped: a space glyph looks identical whichever font it
    // is drawn in, and pdf.js's own text layer does not reliably attribute its style.
    const by = (text: string) => runs.find((r) => r.text === text)!;
    expect(by('bold').bold).toBe(true);
    expect(by('italic').italic).toBe(true);
    expect(by('plain').bold).toBe(false);
    expect(by('plain').italic).toBe(false);
    expect(by('and').bold).toBe(false);
  });

  it('renders a heading bold even when its source span was not marked bold', async () => {
    const result = await run([{ kind: 'heading', level: 1, spans: [span('Title', false, false)] }]);
    const runs = (await allRuns(result.file.bytes))[0]!;
    expect(runs.find((r) => r.text === 'Title')!.bold).toBe(true);
  });

  it('draws a bigger heading than body text', async () => {
    const result = await run([
      { kind: 'heading', level: 1, spans: [span('Big')] },
      { kind: 'paragraph', spans: [span('small')] },
    ]);
    const runs = (await allRuns(result.file.bytes))[0]!;
    const heading = runs.find((r) => r.text === 'Big')!;
    const body = runs.find((r) => r.text === 'small')!;
    expect(heading.size).toBeGreaterThan(body.size);
  });

  it('draws a bullet before an unordered item and numbers an ordered one', async () => {
    const result = await run([
      { kind: 'listItem', spans: [span('first')], ordered: false },
      { kind: 'listItem', spans: [span('one')], ordered: true },
      { kind: 'listItem', spans: [span('two')], ordered: true },
    ]);
    const texts = (await allRuns(result.file.bytes))[0]!.map((r) => r.text);
    expect(texts).toContain('•');
    expect(texts).toContain('1.');
    expect(texts).toContain('2.');
  });

  it('restarts numbering after a non-list block interrupts the list', async () => {
    const result = await run([
      { kind: 'listItem', spans: [span('one')], ordered: true },
      { kind: 'listItem', spans: [span('two')], ordered: true },
      { kind: 'paragraph', spans: [span('a break')] },
      { kind: 'listItem', spans: [span('restarted')], ordered: true },
    ]);
    const texts = (await allRuns(result.file.bytes))[0]!.map((r) => r.text);
    // Two "1."s: the list restarted rather than continuing to "3.".
    expect(texts.filter((t) => t === '1.')).toHaveLength(2);
    expect(texts).not.toContain('3.');
  });

  it('wraps a long paragraph onto more than one line', async () => {
    const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(' ');
    const result = await run([{ kind: 'paragraph', spans: [span(long)] }]);
    const runs = (await allRuns(result.file.bytes))[0]!;
    const distinctY = new Set(runs.map((r) => Math.round(r.y)));
    expect(distinctY.size).toBeGreaterThan(1);
  });

  it('starts a new page once content overflows the first', async () => {
    const blocks: Block[] = Array.from({ length: 80 }, (_, i) => ({
      kind: 'paragraph' as const,
      spans: [span(`Paragraph number ${i} with a little bit of text in it.`)],
    }));
    const result = await run(blocks);
    expect(result.pages).toBeGreaterThan(1);

    const doc = await getDocument({ data: new Uint8Array(result.file.bytes) }).promise;
    expect(doc.numPages).toBe(result.pages);
    await doc.loadingTask.destroy();
  });

  it('refuses an empty document rather than writing a blank PDF', async () => {
    await expect(run([])).rejects.toMatchObject({ code: 'no-text' });
  });
});
