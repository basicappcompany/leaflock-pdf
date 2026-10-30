/** Enough of pdf-lib's `PDFFont` to measure text — kept narrow so this stays unit-testable
 * without embedding a real font. */
export interface MeasurableFont {
  widthOfTextAtSize(text: string, size: number): number;
}

export interface Token {
  text: string;
  font: MeasurableFont;
  size: number;
}

/**
 * Breaks a run of styled tokens (one per word or whitespace run, each already carrying
 * its own font) into lines that fit `maxWidth`, the way a word processor wraps text.
 *
 * Works on tokens rather than whole spans because a single span can be wider than the
 * page on its own, and a line can mix styles — "plain **bold** plain" has to wrap as one
 * flowing line of three fonts, not three independent ones.
 */
export function wrapTokens(tokens: Token[], maxWidth: number): Token[][] {
  const lines: Token[][] = [];
  let current: Token[] = [];
  let width = 0;

  for (const token of tokens) {
    const tokenWidth = token.font.widthOfTextAtSize(token.text, token.size);
    const isSpace = /^\s+$/.test(token.text);

    if (!isSpace && current.length > 0 && width + tokenWidth > maxWidth) {
      lines.push(trimTrailingSpace(current));
      current = [];
      width = 0;
    }
    // A leading space on a fresh line carries no meaning once the line has wrapped.
    if (isSpace && current.length === 0) continue;

    current.push(token);
    width += tokenWidth;
  }
  if (current.length > 0) lines.push(trimTrailingSpace(current));
  return lines;
}

function trimTrailingSpace(line: Token[]): Token[] {
  const last = line[line.length - 1];
  return last && /^\s+$/.test(last.text) ? line.slice(0, -1) : line;
}

/** The width a wrapped line actually occupies, for right-aligning or centring if ever needed. */
export function lineWidth(line: Token[]): number {
  return line.reduce((total, token) => total + token.font.widthOfTextAtSize(token.text, token.size), 0);
}

/** Splits spans into word/whitespace tokens, each still carrying the font `styleFont`
 * resolves for its own bold/italic — the input `wrapTokens` expects. */
export function tokensOf<S extends { text: string; bold: boolean; italic: boolean }>(
  spans: readonly S[],
  size: number,
  styleFont: (span: S) => MeasurableFont,
): Token[] {
  const tokens: Token[] = [];
  for (const span of spans) {
    const font = styleFont(span);
    for (const piece of span.text.split(/(\s+)/)) {
      if (piece) tokens.push({ text: piece, font, size });
    }
  }
  return tokens;
}
