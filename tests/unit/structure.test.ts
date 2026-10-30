import { describe, expect, it } from 'vitest';
import { bodyTextSize, pageStructure, type TextRun } from '../../src/lib/convert/structure';

const PAGE_WIDTH = 595;

/** A text run, with the boring fields defaulted. Width is estimated from the text. */
function run(text: string, x: number, y: number, options: Partial<TextRun> = {}): TextRun {
  const size = options.size ?? 11;
  return {
    text,
    x,
    y,
    width: options.width ?? text.length * size * 0.5,
    size,
    bold: options.bold ?? false,
    italic: options.italic ?? false,
    ...options,
  };
}

/** Lines of body text at this document's single spacing (16pt for 11pt text). */
function bodyLines(texts: string[], startY = 700, x = 60): TextRun[] {
  return texts.map((text, index) => run(text, x, startY - index * 16));
}

const structure = (runs: TextRun[], bodySize = 11) => pageStructure(runs, PAGE_WIDTH, bodySize);
const textOf = (spans: { text: string }[]) => spans.map((span) => span.text).join('');

describe('pageStructure', () => {
  it('joins the lines of a paragraph into one block', () => {
    const { blocks } = structure(bodyLines(['The first line of the paragraph', 'and its second line.']));

    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.kind).toBe('paragraph');
    expect(textOf(blocks[0]!.spans)).toBe('The first line of the paragraph and its second line.');
  });

  it('splits paragraphs on a gap wider than the document’s own line spacing', () => {
    const runs = [
      ...bodyLines(['First paragraph line one', 'first paragraph line two'], 700),
      // 34pt below the last line, against the 16pt the document uses for single spacing.
      ...bodyLines(['Second paragraph.'], 700 - 16 - 34),
    ];

    const { blocks } = structure(runs);
    expect(blocks.map((block) => textOf(block.spans))).toEqual([
      'First paragraph line one first paragraph line two',
      'Second paragraph.',
    ]);
  });

  it('reads a heading from its size relative to the body, not an absolute point value', () => {
    const runs = [
      run('Quarterly Report', 60, 760, { size: 24, bold: true }),
      run('Section one', 60, 710, { size: 14, bold: true }),
      ...bodyLines(['Body copy follows.'], 680),
    ];

    const { blocks } = structure(runs);
    expect(blocks.map((block) => [block.kind, 'level' in block ? block.level : undefined])).toEqual([
      ['heading', 1],
      ['heading', 2],
      ['paragraph', undefined],
    ]);
  });

  it('scales with the document: the same sizes are body text when the body is bigger', () => {
    // 14pt text is a heading in an 11pt document and body text in a 14pt one.
    const runs = [run('Fourteen point text', 60, 700, { size: 14 })];
    expect(structure(runs, 11).blocks[0]!.kind).toBe('heading');
    expect(structure(runs, 14).blocks[0]!.kind).toBe('paragraph');
  });

  it('keeps bold and italic as separate spans within a line', () => {
    const runs = [
      run('Normal then ', 60, 700),
      run('bold', 120, 700, { bold: true }),
      run(' then italic', 150, 700, { italic: true }),
    ];

    const { blocks } = structure(runs);
    expect(blocks[0]!.spans).toEqual([
      { text: 'Normal then ', bold: false, italic: false },
      { text: 'bold', bold: true, italic: false },
      { text: ' then italic', bold: false, italic: true },
    ]);
  });

  it('merges neighbouring runs that share a style', () => {
    const runs = [run('one ', 60, 700, { width: 20 }), run('two', 80, 700)];
    expect(structure(runs).blocks[0]!.spans).toHaveLength(1);
  });

  it('adds a space where the PDF positioned words instead of drawing one', () => {
    // Two runs with a real gap between them and no spaces of their own.
    const runs = [run('widely', 60, 700, { width: 40 }), run('spaced', 140, 700)];
    expect(textOf(structure(runs).blocks[0]!.spans)).toBe('widely spaced');
  });

  it('closes up a word hyphenated across a line break', () => {
    const { blocks } = structure(bodyLines(['a sentence with hyphen-', 'ated wording in it']));
    expect(textOf(blocks[0]!.spans)).toBe('a sentence with hyphenated wording in it');
  });

  it('does not treat a real trailing hyphen as hyphenation', () => {
    // Followed by a capital, so it is a dash rather than a broken word.
    const { blocks } = structure(bodyLines(['see appendix B -', 'Notes on method']));
    expect(textOf(blocks[0]!.spans)).toBe('see appendix B - Notes on method');
  });

  it('recognises bulleted and numbered list items and drops the marker', () => {
    const runs = [
      ...bodyLines(['• First point'], 700),
      ...bodyLines(['• Second point'], 668),
      ...bodyLines(['1. Numbered point'], 636),
    ];

    const { blocks } = structure(runs);
    expect(blocks.map((block) => [block.kind, 'ordered' in block ? block.ordered : undefined, textOf(block.spans)])).toEqual([
      ['listItem', false, 'First point'],
      ['listItem', false, 'Second point'],
      ['listItem', true, 'Numbered point'],
    ]);
  });

  it('starts a new list item even when the lines are tightly spaced', () => {
    // Consecutive bullets at single spacing would otherwise merge into one paragraph.
    const { blocks } = structure(bodyLines(['- one', '- two', '- three']));
    expect(blocks).toHaveLength(3);
    expect(blocks.every((block) => block.kind === 'listItem')).toBe(true);
  });

  it('reads top to bottom, left to right, whatever order the runs arrive in', () => {
    const shuffled = [run('second', 60, 684), run('third', 200, 684), run('first', 60, 700)];
    expect(textOf(structure(shuffled).blocks[0]!.spans)).toBe('first second third');
  });

  it('ignores runs that are only whitespace', () => {
    expect(structure([run('   ', 60, 700), run('real text', 60, 700)]).blocks).toHaveLength(1);
  });

  it('has no blocks for a page with no text', () => {
    expect(structure([])).toEqual({ blocks: [], columnsSuspected: false });
  });

  describe('column detection', () => {
    it('suspects columns when a clear gutter runs down the page', () => {
      const runs: TextRun[] = [];
      for (let i = 0; i < 10; i++) {
        runs.push(run('left column text here', 60, 700 - i * 16, { width: 180 }));
        runs.push(run('right column text here', 330, 700 - i * 16, { width: 180 }));
      }
      expect(structure(runs).columnsSuspected).toBe(true);
    });

    it('does not suspect columns in ordinary full-width prose', () => {
      const runs = Array.from({ length: 10 }, (_, i) =>
        run('a full width line of ordinary prose running across', 60, 700 - i * 16, { width: 470 }),
      );
      expect(structure(runs).columnsSuspected).toBe(false);
    });

    it('needs enough lines before guessing', () => {
      const runs = [run('left', 60, 700, { width: 100 }), run('right', 330, 700, { width: 100 })];
      expect(structure(runs).columnsSuspected).toBe(false);
    });
  });
});

describe('bodyTextSize', () => {
  it('picks the size covering the most characters, not the most runs', () => {
    const pages = [
      [
        run('H', 60, 700, { size: 24 }),
        run('a much longer run of body text', 60, 680, { size: 11 }),
        run('more body text here', 60, 664, { size: 11 }),
      ],
    ];
    expect(bodyTextSize(pages)).toBe(11);
  });

  it('falls back to 12pt for a document with no text', () => {
    expect(bodyTextSize([[], []])).toBe(12);
  });
});
