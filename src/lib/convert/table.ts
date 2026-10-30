import { toLines, type Line } from './lines';
import type { TextRun } from './structure';

/**
 * Infers a spreadsheet grid from positioned text, the same way Adobe's own "export to
 * spreadsheet" and `pdftotext -layout` do for a PDF with no tagged table structure: by
 * finding vertical bands of whitespace that run down the whole page. A PDF never records
 * "this is a table" — only glyphs at coordinates — so this is a guess, and
 * `columnsDetected` says whether it found one, rather than silently returning one column
 * for a page that was never tabular.
 */
export interface PageTable {
  /** One entry per line on the page, each cell already joined to plain text. */
  rows: string[][];
  columns: number;
  /** Whether a column structure was actually found, or `rows` is just one wide column. */
  columnsDetected: boolean;
}

/** A line needs at least this many separate runs before it can evidence a column boundary. */
const CANDIDATE_MIN_RUNS = 2;

/** At least this many such lines before boundaries are trusted at all — two numbers lined
 * up by coincidence is not a table. */
const MIN_CANDIDATE_ROWS = 3;

/** A gap must stay clear across at least this fraction of candidate rows. */
const COLUMN_MIN_COVERAGE = 0.75;

/**
 * A clear band must be at least this many points wide to count as a column gutter rather
 * than a wide word-space — the two look identical to this scan when both happen to be
 * consistent across rows, so the threshold has to clear a normal word gap by a wide
 * margin. A word gap is `size * WORD_GAP_RATIO` at most; this sits well above it for any
 * body text size this product deals with.
 */
const COLUMN_MIN_WIDTH = 10;

const SCAN_STEPS = 200;

/** A horizontal gap this many times the font size means a word space was never drawn. */
const WORD_GAP_RATIO = 0.2;

/** Finds the x positions that split the page into columns, by scanning for vertical bands
 * that no candidate row's text crosses. Returns the midpoint of each qualifying band. */
function columnBoundaries(candidates: Line[], pageWidth: number): number[] {
  if (candidates.length < MIN_CANDIDATE_ROWS || pageWidth <= 0) return [];

  const left = Math.min(...candidates.map((line) => line.left));
  const right = Math.max(...candidates.map((line) => line.right));
  if (right <= left) return [];

  const step = Math.max((right - left) / SCAN_STEPS, 0.5);
  const allowedCrossings = Math.floor(candidates.length * (1 - COLUMN_MIN_COVERAGE));

  const boundaries: number[] = [];
  let bandStart: number | undefined;
  let bandEnd = left;

  const closeBand = () => {
    if (bandStart !== undefined && bandEnd - bandStart >= COLUMN_MIN_WIDTH) {
      boundaries.push((bandStart + bandEnd) / 2);
    }
    bandStart = undefined;
  };

  for (let x = left; x <= right; x += step) {
    // Per run, not per line: a line's own bounding box spans its first run's left to its
    // last run's right, so testing against that would call every gap "crossed".
    const crossing = candidates.filter((line) => line.runs.some((run) => run.x < x && run.x + run.width > x)).length;
    if (crossing <= allowedCrossings) {
      bandStart ??= x;
      bandEnd = x;
    } else {
      closeBand();
    }
  }
  closeBand();

  return boundaries;
}

/** Plain text of the runs in one column of one line, spaces added where the PDF relied on
 * positioning instead of drawing one. */
function cellText(runs: TextRun[]): string {
  let text = '';
  let previous: TextRun | undefined;
  for (const run of runs) {
    const gap = previous ? run.x - (previous.x + previous.width) : 0;
    const needsSpace = previous !== undefined && gap > run.size * WORD_GAP_RATIO && !/\s$/.test(previous.text) && !/^\s/.test(run.text);
    text += (needsSpace ? ' ' : '') + run.text;
    previous = run;
  }
  return text.trim();
}

/** Splits one line's runs into cells at `boundaries`. */
function rowCells(line: Line, boundaries: number[]): string[] {
  const cells: TextRun[][] = Array.from({ length: boundaries.length + 1 }, () => []);
  for (const run of line.runs) {
    let column = 0;
    while (column < boundaries.length && run.x >= boundaries[column]!) column++;
    cells[column]!.push(run);
  }
  return cells.map(cellText);
}

/** Infers the spreadsheet grid of one page. */
export function pageTable(runs: TextRun[], pageWidth: number): PageTable {
  const lines = toLines(runs);
  if (lines.length === 0) return { rows: [], columns: 1, columnsDetected: false };

  const candidates = lines.filter((line) => line.runs.length >= CANDIDATE_MIN_RUNS);
  const boundaries = columnBoundaries(candidates, pageWidth);

  if (boundaries.length === 0) {
    return { rows: lines.map((line) => [cellText(line.runs)]), columns: 1, columnsDetected: false };
  }

  return {
    rows: lines.map((line) => rowCells(line, boundaries)),
    columns: boundaries.length + 1,
    columnsDetected: true,
  };
}
