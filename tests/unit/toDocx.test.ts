import { unzipSync, strFromU8 } from 'fflate';
import { describe, expect, it } from 'vitest';
import type { PageStructure } from '../../src/lib/convert/structure';
import { toDocx } from '../../src/lib/convert/docx';

const page = (blocks: PageStructure['blocks'], columnsSuspected = false): PageStructure => ({
  blocks,
  columnsSuspected,
});

const span = (text: string, bold = false, italic = false) => ({ text, bold, italic });

const run = (pages: PageStructure[], pageBreaks = true) =>
  toDocx({ pages, outputName: 'out.docx', pageBreaks });

/** A .docx is a ZIP of XML parts; this is the one that holds the text. */
function documentXml(bytes: Uint8Array): string {
  const files = unzipSync(bytes);
  const entry = files['word/document.xml'];
  expect(entry, 'word/document.xml missing — the file is not a valid .docx').toBeDefined();
  return strFromU8(entry!);
}

describe('toDocx', () => {
  it('produces a real .docx: a ZIP with the parts Word requires', async () => {
    const result = await run([page([{ kind: 'paragraph', spans: [span('Hello')] }])]);

    expect(result.file.name).toBe('out.docx');
    expect(result.file.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    // PK zip magic, so it is at least a ZIP before we look inside.
    expect([...result.file.bytes.slice(0, 2)]).toEqual([0x50, 0x4b]);

    const names = Object.keys(unzipSync(result.file.bytes));
    expect(names).toContain('[Content_Types].xml');
    expect(names).toContain('word/document.xml');
    expect(names).toContain('_rels/.rels');
  });

  it('writes the text of every block', async () => {
    const result = await run([
      page([
        { kind: 'heading', level: 1, spans: [span('The Title')] },
        { kind: 'paragraph', spans: [span('Body copy.')] },
        { kind: 'listItem', spans: [span('A point')], ordered: false },
      ]),
    ]);

    const xml = documentXml(result.file.bytes);
    expect(xml).toContain('The Title');
    expect(xml).toContain('Body copy.');
    expect(xml).toContain('A point');
  });

  it('maps heading levels onto Word heading styles', async () => {
    const result = await run([
      page([
        { kind: 'heading', level: 1, spans: [span('One')] },
        { kind: 'heading', level: 2, spans: [span('Two')] },
        { kind: 'heading', level: 3, spans: [span('Three')] },
      ]),
    ]);

    const xml = documentXml(result.file.bytes);
    expect(xml).toContain('Heading1');
    expect(xml).toContain('Heading2');
    expect(xml).toContain('Heading3');
    expect(result.headings).toBe(3);
  });

  it('carries bold and italic through as real run formatting', async () => {
    const result = await run([
      page([{ kind: 'paragraph', spans: [span('plain '), span('bold', true), span('italic', false, true)] }]),
    ]);

    const xml = documentXml(result.file.bytes);
    expect(xml).toMatch(/<w:b\b/);
    expect(xml).toMatch(/<w:i\b/);
  });

  it('uses Word list formatting rather than typed-in bullet characters', async () => {
    const result = await run([
      page([
        { kind: 'listItem', spans: [span('unordered')], ordered: false },
        { kind: 'listItem', spans: [span('ordered')], ordered: true },
      ]),
    ]);

    const xml = documentXml(result.file.bytes);
    expect(xml).toContain('<w:numPr>');
    // The marker is formatting, so it must not appear as literal text.
    expect(xml).not.toContain('•');
    expect(result.listItems).toBe(2);
  });

  it('counts the blocks it wrote', async () => {
    const result = await run([
      page([
        { kind: 'paragraph', spans: [span('one')] },
        { kind: 'paragraph', spans: [span('two')] },
        { kind: 'heading', level: 2, spans: [span('head')] },
        { kind: 'listItem', spans: [span('item')], ordered: false },
      ]),
    ]);

    expect(result).toMatchObject({ paragraphs: 2, headings: 1, listItems: 1 });
  });

  it('breaks between PDF pages when asked, and not when not', async () => {
    const pages = [
      page([{ kind: 'paragraph', spans: [span('page one')] }]),
      page([{ kind: 'paragraph', spans: [span('page two')] }]),
    ];

    expect(documentXml((await run(pages, true)).file.bytes)).toContain('pageBreakBefore');
    expect(documentXml((await run(pages, false)).file.bytes)).not.toContain('pageBreakBefore');
  });

  it('reports which pages look like columns, by page number', async () => {
    const result = await run([
      page([{ kind: 'paragraph', spans: [span('ordinary')] }]),
      page([{ kind: 'paragraph', spans: [span('columned')] }], true),
    ]);
    expect(result.columnPages).toEqual([2]);
  });

  it('refuses a PDF it found no text in', async () => {
    await expect(run([page([]), page([])])).rejects.toMatchObject({ code: 'no-text' });
  });
});
