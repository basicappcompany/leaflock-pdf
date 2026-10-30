import { describe, expect, it } from 'vitest';
import { parseBlocks } from '../../src/lib/convert/docxBlocks';

const textOf = (spans: { text: string }[]) => spans.map((span) => span.text).join('');

describe('parseBlocks', () => {
  it('reads paragraphs and headings', () => {
    const { blocks } = parseBlocks('<h1>Title</h1><p>Body copy.</p>');
    expect(blocks).toEqual([
      { kind: 'heading', level: 1, spans: [{ text: 'Title', bold: false, italic: false }] },
      { kind: 'paragraph', spans: [{ text: 'Body copy.', bold: false, italic: false }] },
    ]);
  });

  it('caps heading levels at 3, the same as PDF -> Word', () => {
    const { blocks } = parseBlocks('<h5>Deep heading</h5>');
    expect(blocks[0]).toMatchObject({ kind: 'heading', level: 3 });
  });

  it('tracks bold and italic through nested tags', () => {
    const { blocks } = parseBlocks('<p>plain <strong>bold</strong> and <em>italic <strong>both</strong></em></p>');
    expect(blocks[0]!.spans).toEqual([
      { text: 'plain ', bold: false, italic: false },
      { text: 'bold', bold: true, italic: false },
      { text: ' and ', bold: false, italic: false },
      { text: 'italic ', bold: false, italic: true },
      { text: 'both', bold: true, italic: true },
    ]);
  });

  it('treats <b> and <i> the same as <strong> and <em>', () => {
    // The whitespace-only span between them is dropped, same as any other blank span.
    const { blocks } = parseBlocks('<p><b>bold</b> <i>italic</i></p>');
    expect(blocks[0]!.spans.map((s) => [s.bold, s.italic])).toEqual([
      [true, false],
      [false, true],
    ]);
  });

  it('reads unordered and ordered lists, each item its own block', () => {
    const { blocks } = parseBlocks('<ul><li>First</li><li>Second</li></ul><ol><li>One</li></ol>');
    expect(blocks).toEqual([
      { kind: 'listItem', spans: [{ text: 'First', bold: false, italic: false }], ordered: false },
      { kind: 'listItem', spans: [{ text: 'Second', bold: false, italic: false }], ordered: false },
      { kind: 'listItem', spans: [{ text: 'One', bold: false, italic: false }], ordered: true },
    ]);
  });

  it('flattens a nested list into a following run of items', () => {
    const { blocks } = parseBlocks('<ul><li>Parent<ul><li>Child</li></ul></li></ul>');
    expect(blocks.map((b) => textOf(b.spans))).toEqual(['Parent', 'Child']);
  });

  it('unwraps a link to its text', () => {
    const { blocks } = parseBlocks('<p>See <a href="https://example.com">our site</a> for details.</p>');
    expect(textOf(blocks[0]!.spans)).toBe('See our site for details.');
  });

  it('drops images and tables but counts them, rather than crashing', () => {
    const result = parseBlocks('<p>Before</p><img src="x.png"><table><tr><td>cell</td></tr></table><p>After</p>');
    expect(result.blocks.map((b) => textOf(b.spans))).toEqual(['Before', 'After']);
    expect(result.imagesSkipped).toBe(1);
    expect(result.tablesSkipped).toBe(1);
  });

  it('drops an empty paragraph', () => {
    const { blocks } = parseBlocks('<p></p><p>Real content</p>');
    expect(blocks).toHaveLength(1);
  });

  it('decodes HTML entities', () => {
    const { blocks } = parseBlocks('<p>Ben &amp; Jerry&#39;s &mdash; &quot;quoted&quot;</p>'.replace('&mdash;', '&#8212;'));
    expect(textOf(blocks[0]!.spans)).toBe('Ben & Jerry\'s — "quoted"');
  });

  it('descends into an unrecognised wrapper rather than dropping its content', () => {
    const { blocks } = parseBlocks('<div class="some-style"><p>Still here</p></div>');
    expect(textOf(blocks[0]!.spans)).toBe('Still here');
  });

  it('collapses internal whitespace the way a browser renders it', () => {
    const { blocks } = parseBlocks('<p>line one\n   line two</p>');
    expect(textOf(blocks[0]!.spans)).toBe('line one line two');
  });

  it('is unmoved by a self-closing void tag with no matching close', () => {
    expect(() => parseBlocks('<p>Before<br>After</p>')).not.toThrow();
  });

  it('produces nothing for an empty document', () => {
    expect(parseBlocks('')).toEqual({ blocks: [], tablesSkipped: 0, imagesSkipped: 0 });
  });
});
