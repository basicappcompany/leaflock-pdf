import { describe, expect, it } from 'vitest';
import { toMarkdown } from '../../src/lib/convert/markdown';
import type { PageStructure } from '../../src/lib/convert/structure';

const page = (blocks: PageStructure['blocks'], columnsSuspected = false): PageStructure => ({ blocks, columnsSuspected });
const span = (text: string, bold = false, italic = false) => ({ text, bold, italic });

const run = (pages: PageStructure[]) => toMarkdown({ pages, outputName: 'out.md' });
const text = (pages: PageStructure[]) => new TextDecoder().decode(run(pages).file.bytes);

describe('toMarkdown', () => {
  it('writes a file with the right name and type', () => {
    const result = run([page([{ kind: 'paragraph', spans: [span('Hello')] }])]);
    expect(result.file.name).toBe('out.md');
    expect(result.file.type).toBe('text/markdown');
    expect(new TextDecoder().decode(result.file.bytes)).toContain('Hello');
  });

  it('maps heading levels onto # count', () => {
    const md = text([
      page([
        { kind: 'heading', level: 1, spans: [span('One')] },
        { kind: 'heading', level: 2, spans: [span('Two')] },
        { kind: 'heading', level: 3, spans: [span('Three')] },
      ]),
    ]);
    expect(md).toContain('# One');
    expect(md).toContain('## Two');
    expect(md).toContain('### Three');
  });

  it('carries bold and italic through as real markdown emphasis', () => {
    const md = text([page([{ kind: 'paragraph', spans: [span('plain '), span('bold', true), span(' and '), span('italic', false, true)] }])]);
    expect(md).toContain('**bold**');
    expect(md).toContain('*italic*');
  });

  it('merges adjacent spans with the same formatting into one wrapped run', () => {
    const md = text([page([{ kind: 'paragraph', spans: [span('Hel', true), span('lo', true)] }])]);
    expect(md).toContain('**Hello**');
    expect(md).not.toContain('**Hel****lo**');
  });

  it('writes unordered items with a dash and ordered items numbered in sequence', () => {
    const md = text([
      page([
        { kind: 'listItem', spans: [span('first')], ordered: true },
        { kind: 'listItem', spans: [span('second')], ordered: true },
        { kind: 'listItem', spans: [span('bullet')], ordered: false },
      ]),
    ]);
    expect(md).toContain('1. first');
    expect(md).toContain('2. second');
    expect(md).toContain('- bullet');
  });

  it('restarts ordered numbering after a non-list block interrupts the run', () => {
    const md = text([
      page([
        { kind: 'listItem', spans: [span('a')], ordered: true },
        { kind: 'paragraph', spans: [span('interruption')] },
        { kind: 'listItem', spans: [span('b')], ordered: true },
      ]),
    ]);
    expect(md).toContain('1. a');
    expect(md).toContain('1. b');
  });

  it('escapes markdown-significant characters found in real PDF text', () => {
    const md = text([page([{ kind: 'paragraph', spans: [span('Use *caution* with [brackets] and `code`.')] }])]);
    expect(md).toContain('Use \\*caution\\* with \\[brackets\\] and \\`code\\`.');
  });

  it('counts the blocks it wrote', () => {
    const result = run([
      page([
        { kind: 'paragraph', spans: [span('one')] },
        { kind: 'paragraph', spans: [span('two')] },
        { kind: 'heading', level: 2, spans: [span('head')] },
        { kind: 'listItem', spans: [span('item')], ordered: false },
      ]),
    ]);
    expect(result).toMatchObject({ paragraphs: 2, headings: 1, listItems: 1 });
  });

  it('reports which pages look like columns, by page number', () => {
    const result = run([
      page([{ kind: 'paragraph', spans: [span('ordinary')] }]),
      page([{ kind: 'paragraph', spans: [span('columned')] }], true),
    ]);
    expect(result.columnPages).toEqual([2]);
  });

  it('refuses a PDF it found no text in', () => {
    expect(() => run([page([]), page([])])).toThrow(expect.objectContaining({ code: 'no-text' }));
  });
});
