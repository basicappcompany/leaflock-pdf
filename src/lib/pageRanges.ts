/**
 * Parses what a user types for "which pages", e.g. "1-3, 5, 8-" or "all".
 * Pages are 1-based in the text and 0-based in the result. Returns null if the
 * text is invalid or names a page beyond `pageCount`.
 * Order is kept as typed and duplicates are dropped ("3, 1-2" → [2, 0, 1]).
 */
export function parsePageRanges(text: string, pageCount: number): number[] | null {
  // "1 – 3" → "1-3", so splitting on spaces below doesn't break ranges apart.
  const trimmed = text.trim().replace(/\s*[-–]\s*/g, '-');
  if (trimmed === '') return null;

  const pages: number[] = [];
  const seen = new Set<number>();
  for (const part of trimmed.split(/[,;\s]+/).filter(Boolean)) {
    const range = parseRange(part, pageCount);
    if (!range) return null;
    const [start, end] = range;
    const step = start <= end ? 1 : -1;
    for (let page = start; page !== end + step; page += step) {
      if (!seen.has(page)) {
        seen.add(page);
        pages.push(page - 1);
      }
    }
  }
  return pages;
}

function parseRange(part: string, pageCount: number): [number, number] | null {
  const match = /^(\d*)-(\d*)$/.exec(part);
  if (match) {
    const start = match[1] ? Number(match[1]) : 1;
    const end = match[2] ? Number(match[2]) : pageCount;
    return valid(start, pageCount) && valid(end, pageCount) ? [start, end] : null;
  }
  if (/^\d+$/.test(part)) {
    const page = Number(part);
    return valid(page, pageCount) ? [page, page] : null;
  }
  return null;
}

function valid(page: number, pageCount: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= pageCount;
}

/** The reverse: [0, 1, 2, 4] → "1-3, 5". Input order is kept; runs must ascend. */
export function formatPageRanges(pages: readonly number[]): string {
  const parts: string[] = [];
  let index = 0;
  while (index < pages.length) {
    const start = pages[index]!;
    let end = start;
    while (pages[index + 1] === end + 1) {
      end++;
      index++;
    }
    parts.push(start === end ? `${start + 1}` : `${start + 1}-${end + 1}`);
    index++;
  }
  return parts.join(', ');
}
