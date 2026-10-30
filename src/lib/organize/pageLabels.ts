/** How a range's running number is rendered. `'none'` means the prefix alone. */
export type PageLabelStyle = 'decimal' | 'upperRoman' | 'lowerRoman' | 'upperLetters' | 'lowerLetters' | 'none';

export interface PageLabelRange {
  /** 0-based index of the page this range starts at. The first range must start at 0. */
  startIndex: number;
  style: PageLabelStyle;
  /** Text before the number, e.g. "A-". Empty string for none. */
  prefix: string;
  /** The counter value given to `startIndex` itself. */
  startAt: number;
}

const ROMAN_TABLE: readonly (readonly [number, string])[] = [
  [1000, 'm'], [900, 'cm'], [500, 'd'], [400, 'cd'], [100, 'c'], [90, 'xc'],
  [50, 'l'], [40, 'xl'], [10, 'x'], [9, 'ix'], [5, 'v'], [4, 'iv'], [1, 'i'],
];

function toRoman(n: number): string {
  let result = '';
  let remaining = n;
  for (const [value, symbol] of ROMAN_TABLE) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }
  return result;
}

/** PDF's own letter style: not base-26 positional — the 27th value is "aa", not "ab". */
function toLetters(n: number): string {
  if (n < 1) return '';
  const letter = String.fromCharCode(97 + ((n - 1) % 26));
  return letter.repeat(Math.floor((n - 1) / 26) + 1);
}

/** The label a reader would see on the page at `pageIndex` (0-based) under `range`. */
export function formatPageLabel(range: PageLabelRange, pageIndex: number): string {
  const counter = range.startAt + (pageIndex - range.startIndex);
  const numeric = {
    decimal: () => String(counter),
    upperRoman: () => toRoman(counter).toUpperCase(),
    lowerRoman: () => toRoman(counter),
    upperLetters: () => toLetters(counter).toUpperCase(),
    lowerLetters: () => toLetters(counter),
    none: () => '',
  }[range.style]();
  return `${range.prefix}${numeric}`;
}

export type PageLabelProblem = 'empty' | 'mustStartAtFirstPage' | 'outOfOrder' | 'outOfRange';

/**
 * Checks that `ranges` is a valid number-tree input: non-empty, starting at page 1,
 * strictly ascending, and every start inside the document. Pure so the UI can disable
 * its own button with the same rule the operation enforces.
 */
export function validateRanges(ranges: readonly PageLabelRange[], pageCount: number): PageLabelProblem | null {
  if (ranges.length === 0) return 'empty';
  if (ranges[0]!.startIndex !== 0) return 'mustStartAtFirstPage';
  for (const range of ranges) {
    if (range.startIndex < 0 || range.startIndex >= pageCount) return 'outOfRange';
  }
  for (let i = 1; i < ranges.length; i++) {
    if (ranges[i]!.startIndex <= ranges[i - 1]!.startIndex) return 'outOfOrder';
  }
  return null;
}
