import { describe, expect, it } from 'vitest';
import { parseRtf } from '../../src/lib/convert/rtfBlocks';

const textOf = (spans: { text: string }[]) => spans.map((span) => span.text).join('');
const wrap = (body: string) => `{\\rtf1\\ansi\\deff0${body}}`;

describe('parseRtf', () => {
  it('reads plain paragraphs, separated by \\par', () => {
    const { blocks } = parseRtf(wrap('First paragraph.\\par Second paragraph.'));
    expect(blocks.map((b) => textOf(b.spans))).toEqual(['First paragraph.', 'Second paragraph.']);
    expect(blocks.every((b) => b.kind === 'paragraph')).toBe(true);
  });

  it('tracks bold and italic, including nested', () => {
    const { blocks } = parseRtf(wrap('plain \\b bold \\i bold italic\\i0  bold\\b0  plain'));
    expect(blocks[0]!.spans.map((s) => [s.text.trim(), s.bold, s.italic])).toEqual([
      ['plain', false, false],
      ['bold', true, false],
      ['bold italic', true, true],
      ['bold', true, false],
      ['plain', false, false],
    ]);
  });

  it('restores the outer group’s formatting once a nested group closes', () => {
    // Bold set inside {...} must not leak past its own closing brace.
    const { blocks } = parseRtf(wrap('before {\\b inside} after'));
    expect(blocks[0]!.spans.map((s) => [s.text.trim(), s.bold])).toEqual([
      ['before', false],
      ['inside', true],
      ['after', false],
    ]);
  });

  it('skips the font table entirely, by name, with no leading \\*', () => {
    const { blocks } = parseRtf(wrap('{\\fonttbl{\\f0 Arial;}{\\f1 Times New Roman;}}Hello'));
    expect(textOf(blocks[0]!.spans)).toBe('Hello');
  });

  it('skips the colour table and document info', () => {
    const { blocks } = parseRtf(wrap('{\\colortbl;\\red255\\green0\\blue0;}{\\info{\\title My Doc}}Hello'));
    expect(blocks).toHaveLength(1);
    expect(textOf(blocks[0]!.spans)).toBe('Hello');
  });

  it('discards any group marked \\* as unrecognised', () => {
    const { blocks } = parseRtf(wrap('{\\*\\generator Some Writer}Hello'));
    expect(textOf(blocks[0]!.spans)).toBe('Hello');
  });

  it('unescapes literal braces and backslashes', () => {
    const { blocks } = parseRtf(wrap('a \\{brace\\} and a \\\\backslash'));
    expect(textOf(blocks[0]!.spans)).toBe('a {brace} and a \\backslash');
  });

  it('decodes a \\\'xx hex escape as a CP1252 byte', () => {
    // 0x93/0x94 are curly quotes in CP1252, not their Latin-1 code points.
    const { blocks } = parseRtf(wrap("\\'93quoted\\'94"));
    expect(textOf(blocks[0]!.spans)).toBe('“quoted”');
  });

  it('decodes a \\uN unicode escape and discards its ANSI fallback character', () => {
    // 荤 is the euro sign; RTF follows it with one fallback char (often "?") that a
    // Unicode-aware reader must discard, not display.
    const { blocks } = parseRtf(wrap('\\u8364?5.00'));
    expect(textOf(blocks[0]!.spans)).toBe('€5.00');
  });

  it('handles a negative \\u parameter as RTF’s signed 16-bit encoding', () => {
    // RTF encodes code points above 32767 as negative signed 16-bit values.
    const { blocks } = parseRtf(wrap('\\u-10179?'));
    expect(textOf(blocks[0]!.spans)).toBe(String.fromCodePoint(65536 - 10179));
  });

  it('ignores an unrecognised control word without emitting text or crashing', () => {
    const { blocks } = parseRtf(wrap('\\fs24\\f0\\cf1 styled text'));
    expect(textOf(blocks[0]!.spans)).toBe('styled text');
  });

  it('treats a raw line break in the source as whitespace, not a paragraph break', () => {
    const { blocks } = parseRtf(wrap('one\r\ntwo'));
    expect(blocks).toHaveLength(1);
    expect(textOf(blocks[0]!.spans)).toBe('onetwo');
  });

  it('drops a trailing empty paragraph rather than producing a blank block', () => {
    const { blocks } = parseRtf(wrap('Text.\\par '));
    expect(blocks).toHaveLength(1);
  });

  it('produces nothing for a document with no text', () => {
    expect(parseRtf(wrap(''))).toEqual({ blocks: [] });
  });

  it('is unmoved by a trailing lone backslash at the end of input', () => {
    expect(() => parseRtf('abc\\')).not.toThrow();
  });
});
