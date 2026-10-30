/**
 * Turns the flat list of positioned text runs pdf.js reports into a document outline —
 * paragraphs, headings and list items — ready to be written as .docx.
 *
 * A PDF has no paragraphs. It has glyphs at coordinates, so every structure below is
 * inferred from geometry and font size, and the thresholds that do the inferring are
 * **relative to the document itself** rather than absolute: a document's own modal line
 * gap and modal font size are what "normal" means in it. Absolute point values would
 * work on the documents they were tuned against and fail on the rest.
 *
 * Deliberately not inferred, and stated on the tool page instead: tables, images, and
 * multi-column reading order. Columns are *detected* (`columnsSuspected`) so the tool can
 * say the order may be wrong, which is better than a page of silently interleaved text.
 */

/** One run of text as pdf.js reports it, with the style resolved. */
export interface TextRun {
  text: string;
  /** Left edge, in PDF points from the left of the page. */
  x: number;
  /** Baseline, in PDF points from the bottom of the page. */
  y: number;
  width: number;
  /** Font size in points. */
  size: number;
  bold: boolean;
  italic: boolean;
}

export interface Span {
  text: string;
  bold: boolean;
  italic: boolean;
}

export type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; spans: Span[] }
  | { kind: 'paragraph'; spans: Span[] }
  | { kind: 'listItem'; spans: Span[]; ordered: boolean };

export interface PageStructure {
  blocks: Block[];
  /** The page has a clear vertical gutter, so its reading order is probably wrong. */
  columnsSuspected: boolean;
}

import { dominantSize, toLines, type Line } from './lines';

/** A baseline gap this much bigger than the document's usual one starts a new paragraph. */
const PARAGRAPH_GAP_RATIO = 1.5;

/** Text this much larger than the body size is a heading. */
const HEADING_RATIO = 1.15;

/** A horizontal gap this many times the font size means a word space was never drawn. */
const WORD_GAP_RATIO = 0.2;

/** Bullet glyphs that start an unordered list item. */
const BULLETS = ['•', '◦', '▪', '·', '‣', '-', '–', '—', '*'];

const ORDERED = /^\(?\d{1,3}[.)]\s+/;

/** A gutter must be this wide, as a fraction of the page width, to suggest columns. */
const GUTTER_MIN_WIDTH = 0.06;

/** Share of runs allowed to cross a gutter, for full-width titles over a columned body. */
const GUTTER_CROSSING_TOLERANCE = 0.1;

/**
 * What single spacing looks like in this document: the most common gap between
 * consecutive baselines, ties going to the smaller.
 *
 * The *mode* rather than the mean or median, because paragraph gaps are outliers that
 * drag both upwards — on a page with two paragraphs there may be only one normal gap and
 * one paragraph gap, and a median would land on the paragraph gap and then find nothing
 * unusual about it.
 */
function usualLineGap(lines: Line[]): number {
  const counts = new Map<number, number>();
  for (let i = 1; i < lines.length; i++) {
    const gap = Math.round(lines[i - 1]!.y - lines[i]!.y);
    if (gap > 0) counts.set(gap, (counts.get(gap) ?? 0) + 1);
  }

  let best = 0;
  let most = 0;
  for (const [gap, count] of [...counts].sort((a, b) => a[0] - b[0])) {
    if (count > most) {
      most = count;
      best = gap;
    }
  }
  return best;
}

/** Joins a line's runs, adding a space where the PDF relied on positioning instead of one. */
function lineSpans(line: Line): Span[] {
  const spans: Span[] = [];
  let previous: TextRun | undefined;

  for (const run of line.runs) {
    const gap = previous ? run.x - (previous.x + previous.width) : 0;
    const needsSpace =
      previous !== undefined &&
      gap > run.size * WORD_GAP_RATIO &&
      !/\s$/.test(previous.text) &&
      !/^\s/.test(run.text);

    const last = spans[spans.length - 1];
    const text = (needsSpace ? ' ' : '') + run.text;
    if (last && last.bold === run.bold && last.italic === run.italic) last.text += text;
    else spans.push({ text, bold: run.bold, italic: run.italic });
    previous = run;
  }

  return spans;
}

/** Appends `next`'s spans to `into`, joining the two lines the way prose reads. */
function appendLine(into: Span[], next: Span[]): void {
  const last = into[into.length - 1];
  const first = next[0];
  if (!last || !first) {
    into.push(...next);
    return;
  }

  // A word broken across lines: drop the hyphen and close it up, rather than leaving
  // "hyphen- ated" in the Word document.
  const hyphenated = /[^\s-]-$/.test(last.text) && /^[a-z]/.test(first.text);
  if (hyphenated) last.text = last.text.slice(0, -1);
  else if (!/\s$/.test(last.text) && !/^\s/.test(first.text)) last.text += ' ';

  for (const span of next) {
    const tail = into[into.length - 1]!;
    if (tail.bold === span.bold && tail.italic === span.italic) tail.text += span.text;
    else into.push({ ...span });
  }
}

function listMarker(spans: Span[]): { ordered: boolean; strip: number } | undefined {
  const text = spans.map((span) => span.text).join('');
  for (const bullet of BULLETS) {
    if (text.startsWith(`${bullet} `)) return { ordered: false, strip: bullet.length + 1 };
  }
  const ordered = ORDERED.exec(text);
  return ordered ? { ordered: true, strip: ordered[0].length } : undefined;
}

/** Removes `count` characters from the front of a span list, in place. */
function stripFront(spans: Span[], count: number): void {
  let left = count;
  while (left > 0 && spans.length > 0) {
    const first = spans[0]!;
    if (first.text.length <= left) {
      left -= first.text.length;
      spans.shift();
    } else {
      first.text = first.text.slice(left);
      left = 0;
    }
  }
  if (spans[0]) spans[0].text = spans[0].text.replace(/^\s+/, '');
}

/** Typical of a document with 11pt body text: 24pt titles, 14pt section headings. */
function headingLevel(size: number, body: number): 1 | 2 | 3 {
  const ratio = size / body;
  if (ratio >= 1.7) return 1;
  if (ratio >= 1.2) return 2;
  return 3;
}

/**
 * Looks for a vertical band that no text crosses — a column gutter.
 *
 * Tested against the **runs**, not the lines: two columns printed side by side share a
 * baseline, so line grouping merges them into one line spanning the whole page and the
 * gutter disappears before it can be measured. A run, by contrast, never spans a gutter.
 *
 * A few crossings are tolerated so that a full-width title or footer over a two-column
 * body does not hide the gutter underneath it. Only a warning either way: blocks are
 * still produced top to bottom, which is right for everything except columns.
 */
function hasGutter(runs: TextRun[], pageWidth: number): boolean {
  const baselines = new Set(runs.map((item) => Math.round(item.y)));
  if (baselines.size < 6 || pageWidth <= 0 || runs.length === 0) return false;

  const allowedCrossings = Math.floor(runs.length * GUTTER_CROSSING_TOLERANCE);
  const step = pageWidth / 100;
  let clear = 0;
  let widest = 0;
  for (let x = pageWidth * 0.2; x <= pageWidth * 0.8; x += step) {
    const crossing = runs.filter((item) => item.x < x && item.x + item.width > x).length;
    if (crossing <= allowedCrossings) {
      clear++;
      widest = Math.max(widest, clear);
    } else {
      clear = 0;
    }
  }
  return (widest * step) / pageWidth >= GUTTER_MIN_WIDTH;
}

/**
 * Infers the structure of one page.
 *
 * `bodySize` comes from the whole document rather than this page, so that a page which
 * happens to be all heading does not decide that headings are normal size.
 */
export function pageStructure(runs: TextRun[], pageWidth: number, bodySize: number): PageStructure {
  const lines = toLines(runs);
  if (lines.length === 0) return { blocks: [], columnsSuspected: false };

  const usualGap = usualLineGap(lines);
  const blocks: Block[] = [];

  let spans: Span[] = [];
  let blockSize = lines[0]!.size;

  const flush = () => {
    if (spans.length === 0) return;
    const marker = listMarker(spans);
    if (marker) {
      stripFront(spans, marker.strip);
      if (spans.length > 0) blocks.push({ kind: 'listItem', spans, ordered: marker.ordered });
    } else if (blockSize >= bodySize * HEADING_RATIO) {
      blocks.push({ kind: 'heading', level: headingLevel(blockSize, bodySize), spans });
    } else {
      blocks.push({ kind: 'paragraph', spans });
    }
    spans = [];
  };

  for (const [index, line] of lines.entries()) {
    const previous = lines[index - 1];
    const gap = previous ? previous.y - line.y : 0;

    const startsBlock =
      !previous ||
      // A gap noticeably wider than this document's own single spacing.
      (usualGap > 0 && gap > usualGap * PARAGRAPH_GAP_RATIO) ||
      // A size change: a heading beginning, or body text resuming after one.
      Math.abs(line.size - previous.size) > 0.5 ||
      // A line of its own that opens a list item.
      listMarker(lineSpans(line)) !== undefined;

    if (startsBlock) {
      flush();
      blockSize = line.size;
    }

    const next = lineSpans(line);
    if (spans.length === 0) spans = next;
    else appendLine(spans, next);
  }
  flush();

  return { blocks, columnsSuspected: hasGutter(runs, pageWidth) };
}

/** The size covering the most characters across every page: this document's body text. */
export function bodyTextSize(pages: TextRun[][]): number {
  const all = pages.flat();
  return all.length === 0 ? 12 : dominantSize(all);
}
