/**
 * Pure page helpers shared by the organize operations (in the worker) and their UIs.
 * Kept free of pdf-lib so importing them doesn't pull it into page bundles.
 */
import { formatPageRanges } from '../pageRanges';
import { baseName } from '../pdf/types';

export type QuarterTurn = 0 | 90 | 180 | 270;

/** Normalises any multiple of 90 (including negatives) to 0–270. */
export function normaliseRotation(angle: number): QuarterTurn {
  return ((((Math.round(angle / 90) * 90) % 360) + 360) % 360) as QuarterTurn;
}

export type SplitMode =
  /** One output per group of 0-based page indices, in the order given. */
  | { kind: 'ranges'; groups: number[][] }
  /** Consecutive chunks of `size` pages. */
  | { kind: 'every'; size: number }
  /** One output per page. */
  | { kind: 'single' };

/** The page groups a split mode produces for a document of `pageCount` pages. */
export function splitGroups(mode: SplitMode, pageCount: number): number[][] {
  const all = Array.from({ length: pageCount }, (_, index) => index);
  switch (mode.kind) {
    case 'ranges':
      return mode.groups.filter((group) => group.length > 0);
    case 'every': {
      const size = Math.max(1, Math.floor(mode.size));
      const groups: number[][] = [];
      for (let start = 0; start < pageCount; start += size) groups.push(all.slice(start, start + size));
      return groups;
    }
    case 'single':
      return all.map((index) => [index]);
  }
}

/** "report.pdf", [0, 1, 2] → "report-pages-1-3.pdf"; [4] → "report-page-5.pdf". */
export function splitFileName(fileName: string, group: readonly number[]): string {
  const base = baseName(fileName);
  if (group.length === 1) return `${base}-page-${group[0]! + 1}.pdf`;
  return `${base}-pages-${formatPageRanges(group).replace(/, /g, '_')}.pdf`;
}

export interface InterleaveOptions {
  /** How many pages to take from each file before switching to the other. */
  step: number;
  /** Take the second file's pages from the end. A second scanning pass usually goes back
   * through the same stack of paper, so the even-numbered pages come out back to front. */
  reverseSecond: boolean;
}

/**
 * Picks pages alternately from two documents: the usual way to rejoin a stack of paper
 * scanned in two passes, fronts then backs. Once one document runs out, the rest of the
 * other follows on the end rather than being dropped.
 */
export function interleavePages(
  first: number,
  second: number,
  { step, reverseSecond }: InterleaveOptions,
): { source: number; index: number }[] {
  const size = Math.max(1, Math.floor(step));
  const secondOrder = Array.from({ length: second }, (_, index) => (reverseSecond ? second - 1 - index : index));

  const order: { source: number; index: number }[] = [];
  let a = 0;
  let b = 0;
  while (a < first || b < secondOrder.length) {
    for (let taken = 0; taken < size && a < first; taken++) order.push({ source: 0, index: a++ });
    for (let taken = 0; taken < size && b < secondOrder.length; taken++) order.push({ source: 1, index: secondOrder[b++]! });
  }
  return order;
}
