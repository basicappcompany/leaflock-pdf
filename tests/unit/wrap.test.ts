import { describe, expect, it } from 'vitest';
import { lineWidth, tokensOf, wrapTokens, type MeasurableFont, type Token } from '../../src/lib/convert/wrap';

/** Every character is exactly 10 units wide at size 1, whatever the size — so widths in
 * these tests are just `text.length * size * 10`, easy to reason about by hand. */
const fixedWidthFont: MeasurableFont = { widthOfTextAtSize: (text, size) => text.length * size * 10 };

const token = (text: string, size = 1): Token => ({ text, font: fixedWidthFont, size });
const textOf = (lines: Token[][]) => lines.map((line) => line.map((t) => t.text).join(''));

describe('wrapTokens', () => {
  it('keeps everything on one line when it fits', () => {
    const tokens = [token('one'), token(' '), token('two')];
    expect(wrapTokens(tokens, 1000)).toEqual([tokens]);
  });

  it('wraps at a word boundary once the line is full', () => {
    // "one"=30, " "=10, "two"=30, " "=10, "three"=50. Width 70 fits "one two" (70 exactly)
    // but not "one two three".
    const tokens = [token('one'), token(' '), token('two'), token(' '), token('three')];
    expect(textOf(wrapTokens(tokens, 70))).toEqual(['one two', 'three']);
  });

  it('drops the space that would otherwise start a new line', () => {
    const tokens = [token('aaaaaaaaaa'), token(' '), token('bbbbbbbbbb')];
    // Width 100 fits exactly one 10-char word; wrapping must not begin the next line
    // with a leading space.
    const lines = wrapTokens(tokens, 100);
    expect(lines[1]![0]!.text).not.toMatch(/^\s/);
    expect(textOf(lines)).toEqual(['aaaaaaaaaa', 'bbbbbbbbbb']);
  });

  it('puts a single word wider than the line on its own line rather than dropping it', () => {
    const tokens = [token('short'), token(' '), token('awordwiderthantheline')];
    const lines = wrapTokens(tokens, 60);
    expect(textOf(lines)).toEqual(['short', 'awordwiderthantheline']);
  });

  it('keeps mixed-style tokens on the same wrapped line', () => {
    const bold: MeasurableFont = { widthOfTextAtSize: (text, size) => text.length * size * 10 };
    const tokens: Token[] = [token('plain'), { text: ' ', font: fixedWidthFont, size: 1 }, { text: 'bold', font: bold, size: 1 }];
    const lines = wrapTokens(tokens, 1000);
    expect(lines).toHaveLength(1);
    expect(lines[0]!.map((t) => t.font)).toEqual([fixedWidthFont, fixedWidthFont, bold]);
  });

  it('produces no lines for no tokens', () => {
    expect(wrapTokens([], 1000)).toEqual([]);
  });
});

describe('lineWidth', () => {
  it('sums the width of every token on the line', () => {
    expect(lineWidth([token('one'), token(' '), token('two')])).toBe(70);
  });
});

describe('tokensOf', () => {
  it('splits spans into word and whitespace tokens, keeping each span’s own font', () => {
    const spans = [
      { text: 'plain text', bold: false, italic: false },
      { text: ' bold', bold: true, italic: false },
    ];
    const boldFont: MeasurableFont = { widthOfTextAtSize: () => 1 };
    const tokens = tokensOf(spans, 11, (span) => (span.bold ? boldFont : fixedWidthFont));

    expect(tokens.map((t) => t.text)).toEqual(['plain', ' ', 'text', ' ', 'bold']);
    expect(tokens.map((t) => t.font)).toEqual([fixedWidthFont, fixedWidthFont, fixedWidthFont, boldFont, boldFont]);
    expect(tokens.every((t) => t.size === 11)).toBe(true);
  });

  it('produces nothing for an empty span list', () => {
    expect(tokensOf([], 11, () => fixedWidthFont)).toEqual([]);
  });
});
