export type DiffPart = { type: 'equal' | 'insert' | 'delete'; words: string[] };

export interface DiffSummary {
  inserted: number;
  deleted: number;
}

/** Above this many cells (words × words) the middle of a page is shown as one replacement. */
const MAX_CELLS = 4_000_000;

export function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Word-level diff of two texts (longest common subsequence), as runs of equal,
 * inserted and deleted words. Common leading and trailing words are trimmed first,
 * so the expensive part only covers what actually changed.
 */
export function diffWords(before: string, after: string): DiffPart[] {
  const a = words(before);
  const b = words(after);

  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length;
  let endB = b.length;
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--;
    endB--;
  }

  const parts: DiffPart[] = [];
  push(parts, 'equal', a.slice(0, start));
  for (const part of diffMiddle(a.slice(start, endA), b.slice(start, endB))) push(parts, part.type, part.words);
  push(parts, 'equal', a.slice(endA));
  return parts;
}

export function summarize(parts: readonly DiffPart[]): DiffSummary {
  let inserted = 0;
  let deleted = 0;
  for (const part of parts) {
    if (part.type === 'insert') inserted += part.words.length;
    else if (part.type === 'delete') deleted += part.words.length;
  }
  return { inserted, deleted };
}

function diffMiddle(a: string[], b: string[]): DiffPart[] {
  if (a.length === 0 || b.length === 0 || a.length * b.length > MAX_CELLS) {
    return [
      { type: 'delete', words: a },
      { type: 'insert', words: b },
    ];
  }

  // lengths[i][j] = LCS length of a[i..] and b[j..], stored row by row.
  const columns = b.length + 1;
  const lengths = new Uint32Array((a.length + 1) * columns);
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i * columns + j] =
        a[i] === b[j]
          ? lengths[(i + 1) * columns + j + 1]! + 1
          : Math.max(lengths[(i + 1) * columns + j]!, lengths[i * columns + j + 1]!);
    }
  }

  const parts: DiffPart[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push(parts, 'equal', [a[i]!]);
      i++;
      j++;
    } else if (lengths[(i + 1) * columns + j]! >= lengths[i * columns + j + 1]!) {
      push(parts, 'delete', [a[i]!]);
      i++;
    } else {
      push(parts, 'insert', [b[j]!]);
      j++;
    }
  }
  push(parts, 'delete', a.slice(i));
  push(parts, 'insert', b.slice(j));
  return parts;
}

/** Appends words, merging with the previous part when it has the same type. */
function push(parts: DiffPart[], type: DiffPart['type'], items: string[]) {
  if (items.length === 0) return;
  const last = parts[parts.length - 1];
  if (last?.type === type) last.words.push(...items);
  else parts.push({ type, words: [...items] });
}
