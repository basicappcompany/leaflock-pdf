import type { TextRun } from './structure';

/** Runs within this fraction of a font size share a baseline, and so share a line. */
const SAME_LINE_TOLERANCE = 0.4;

/** One baseline's worth of text, left to right. Shared by prose structure (`structure.ts`)
 * and table detection (`table.ts`) — both start from "what's on this line together". */
export interface Line {
  runs: TextRun[];
  /** Baseline of the line, taken from its first run. */
  y: number;
  left: number;
  right: number;
  /** The size covering the most characters on this line. */
  size: number;
}

/** Groups runs sharing a baseline into lines, top to bottom, each run left to right. */
export function toLines(runs: TextRun[]): Line[] {
  const usable = runs.filter((run) => run.text.trim() !== '');
  if (usable.length === 0) return [];

  // Top to bottom: PDF y grows upwards, so descending.
  const sorted = [...usable].sort((a, b) => b.y - a.y || a.x - b.x);

  const lines: Line[] = [];
  let current: TextRun[] = [];
  for (const run of sorted) {
    const first = current[0];
    if (first && Math.abs(first.y - run.y) <= Math.max(first.size, run.size) * SAME_LINE_TOLERANCE) {
      current.push(run);
    } else {
      if (current.length > 0) lines.push(makeLine(current));
      current = [run];
    }
  }
  if (current.length > 0) lines.push(makeLine(current));
  return lines;
}

function makeLine(runs: TextRun[]): Line {
  const ordered = [...runs].sort((a, b) => a.x - b.x);
  return {
    runs: ordered,
    y: ordered[0]!.y,
    left: Math.min(...ordered.map((run) => run.x)),
    right: Math.max(...ordered.map((run) => run.x + run.width)),
    size: dominantSize(ordered),
  };
}

/** The font size covering the most characters — the size a reader would call this text's. */
export function dominantSize(runs: TextRun[]): number {
  const weight = new Map<number, number>();
  for (const run of runs) {
    const rounded = Math.round(run.size * 10) / 10;
    weight.set(rounded, (weight.get(rounded) ?? 0) + run.text.trim().length);
  }
  let best = runs[0]?.size ?? 0;
  let most = -1;
  for (const [size, chars] of weight) {
    if (chars > most) {
      most = chars;
      best = size;
    }
  }
  return best;
}
