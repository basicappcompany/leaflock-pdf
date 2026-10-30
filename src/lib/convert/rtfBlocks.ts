import type { Block, Span } from './structure';

export interface RtfBlocksResult {
  blocks: Block[];
}

/**
 * Reads RTF into the same `Block`/`Span` shape `docxBlocks.ts` produces from a .docx, so
 * both feed the one `blocksToPdf.ts` renderer. No dependency: nothing current and
 * browser-safe exists (`rtf-parser` is Node-only, stream-based, last published 2019 —
 * the same "nothing off the shelf" result as the mammoth/read-excel-file survey), and
 * RTF's grammar, scoped to what this reads, is small enough for a character scan.
 *
 * Deliberately narrower than `docxBlocks.ts`: **paragraphs, bold and italic only — no
 * headings, no lists.** RTF carries no semantic heading markup the way HTML's `<h1>`
 * does; a heading is a named paragraph style (`\s`) resolved against the `\stylesheet`
 * group, and a real implementation of that is a second parser, not a feature of this
 * one. Rather than guess at headings from font size, this states the narrower scope on
 * the tool page and leaves every paragraph as a paragraph.
 *
 * Also skipped, and not approximated: tables, images, fields, and anything in a
 * `\*`-prefixed group — `\*` is RTF's own "discard this whole group if you don't
 * understand it" marker, so skipping it is the format's intended fallback, not a
 * limitation of this reader.
 */
export function parseRtf(rtf: string): RtfBlocksResult {
  const blocks: Block[] = [];
  let spans: Span[] = [];
  let bold = false;
  let italic = false;
  // Stack of {bold, italic, skip} per open `{...}` group — RTF scopes formatting and
  // skip state to the group, restoring the outer state when it closes.
  const stack: { bold: boolean; italic: boolean; skip: boolean }[] = [];
  let skip = false;

  const flushParagraph = () => {
    if (spans.length > 0) blocks.push({ kind: 'paragraph', spans });
    spans = [];
  };

  const emit = (text: string) => {
    if (skip || text === '') return;
    const last = spans[spans.length - 1];
    if (last && last.bold === bold && last.italic === italic) last.text += text;
    else spans.push({ text, bold, italic });
  };

  let i = 0;
  while (i < rtf.length) {
    const char = rtf[i]!;

    if (char === '{') {
      stack.push({ bold, italic, skip });
      // A group opening with `\*` is RTF's explicit "discard if unrecognised" marker.
      // A destination control word right after `{` (optionally after `\*`) names a
      // non-document part — the font/colour tables, document metadata — to skip outright.
      const ahead = rtf.slice(i + 1, i + 24);
      const namedDestination =
        /^\\(fonttbl|colortbl|stylesheet|info|generator|pict|object|listtable|listoverridetable|rsidtbl|latentstyles|themedata|colorschememapping|header|footer|footnote|xmlns|datastore)\b/;
      // `\*` is RTF's own "discard this whole group if unrecognised" marker — the
      // general case; the named list above covers common destinations that don't
      // bother with `\*` because every reader is expected to know them already.
      if (namedDestination.test(ahead) || /^\\\*/.test(ahead)) skip = true;
      i++;
      continue;
    }

    if (char === '}') {
      const outer = stack.pop();
      if (outer) {
        bold = outer.bold;
        italic = outer.italic;
        skip = outer.skip;
      }
      i++;
      continue;
    }

    if (char === '\\') {
      const result = readControl(rtf, i);
      i = result.next;
      switch (result.kind) {
        case 'literal':
          emit(result.text);
          break;
        case 'bold':
          bold = result.on;
          break;
        case 'italic':
          italic = result.on;
          break;
        case 'par':
          flushParagraph();
          break;
        case 'tab':
          emit('\t');
          break;
        case 'unicode':
          emit(result.text);
          i = skipPlainChars(rtf, i, result.skipAfter);
          break;
        case 'none':
          break;
      }
      continue;
    }

    // A raw newline or carriage return in the RTF source is formatting whitespace, not
    // document content — real paragraph breaks are `\par`, never a literal line break.
    if (char === '\r' || char === '\n') {
      i++;
      continue;
    }

    emit(char);
    i++;
  }

  flushParagraph();
  return { blocks };
}

type ControlResult =
  | { kind: 'literal'; text: string; next: number }
  | { kind: 'bold' | 'italic'; on: boolean; next: number }
  | { kind: 'par' | 'tab' | 'none'; next: number }
  // \uN emits the real character, then the ANSI fallback text a Unicode-blind reader
  // would show in its place must be skipped — `skipAfter` chars, starting at `next`.
  | { kind: 'unicode'; text: string; skipAfter: number; next: number };

/** CP1252's printable range above ASCII, for `\'xx` hex escapes — RTF's default
 * encoding for text outside `\uNNNN`. Only the bytes that differ from Latin-1 are listed;
 * everything else falls back to the byte's own code point, which is accurate for ASCII
 * and close enough for the rest. */
const CP1252_HIGH: Record<number, string> = {
  0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”',
  0x96: '–', 0x97: '—', 0x85: '…',
};

/** Reads one `\...` escape or control word starting at the backslash. */
function readControl(text: string, backslashIndex: number): ControlResult {
  const next = text[backslashIndex + 1];

  if (next === '{' || next === '}' || next === '\\') {
    return { kind: 'literal', text: next, next: backslashIndex + 2 };
  }
  if (next === '~') return { kind: 'literal', text: ' ', next: backslashIndex + 2 };
  if (next === undefined) return { kind: 'none', next: backslashIndex + 1 };
  if (next === '-' || next === '_') return { kind: 'none', next: backslashIndex + 2 };
  if (next === "'") {
    const hex = text.slice(backslashIndex + 2, backslashIndex + 4);
    const byte = parseInt(hex, 16);
    const char = Number.isNaN(byte) ? '' : CP1252_HIGH[byte] ?? String.fromCharCode(byte);
    return { kind: 'literal', text: char, next: backslashIndex + 4 };
  }

  const match = /^\\([a-zA-Z]+)(-?\d+)?/.exec(text.slice(backslashIndex));
  if (!match) return { kind: 'none', next: backslashIndex + 1 };

  const word = match[1]!;
  const hasParam = match[2] !== undefined;
  const param = hasParam ? Number(match[2]) : undefined;
  let consumed = backslashIndex + match[0].length;
  // A single space right after a control word is the word's own delimiter, not content.
  if (text[consumed] === ' ') consumed++;

  if (word === 'b') return { kind: 'bold', on: param !== 0, next: consumed };
  if (word === 'i') return { kind: 'italic', on: param !== 0, next: consumed };
  if (word === 'par' || word === 'line') return { kind: 'par', next: consumed };
  if (word === 'tab') return { kind: 'tab', next: consumed };
  if (word === 'u' && hasParam) {
    const codePoint = param! < 0 ? param! + 65536 : param!;
    // \uc sets how many fallback characters follow each \u; default 1, tracked as a
    // fixed default rather than full running state, since a document that changes \uc
    // mid-stream is rare and the fallback text is discarded either way.
    return { kind: 'unicode', text: String.fromCodePoint(codePoint), skipAfter: 1, next: consumed };
  }
  // Any other control word is consumed with no text effect — \fs24, \f0, \cf1 and the
  // rest of RTF's formatting vocabulary are outside this reader's stated scope.
  return { kind: 'none', next: consumed };
}

/** Skips `count` plain (non-control, non-group) characters — used after `\uN` to drop
 * the ANSI fallback text real RTF readers show when they lack Unicode support. */
function skipPlainChars(text: string, from: number, count: number): number {
  let i = from;
  let left = count;
  while (left > 0 && i < text.length && text[i] !== '\\' && text[i] !== '{' && text[i] !== '}') {
    i++;
    left--;
  }
  return i;
}
