import { claimJob } from '../usage';
import type { OutputFile } from './types';

export type BatchRowState = 'waiting' | 'working' | 'done' | 'failed';

export interface BatchUpdate {
  index: number;
  state: BatchRowState;
  output?: OutputFile;
  /** Raw failure, for the caller to turn into a sentence. */
  error?: unknown;
}

export interface BatchResult {
  outputs: OutputFile[];
  failed: number;
}

/**
 * Runs the same operation over many files, one after another.
 *
 * Two deliberate choices. One file failing doesn't stop the rest — the point of a
 * batch is to come back to a finished pile, not to find it stopped on file three,
 * so failures are reported per row and the run carries on. And the whole batch
 * counts as a single job against the daily allowance rather than one per file,
 * which is both kinder and the natural reading of "tools per day".
 *
 * Files are processed in sequence, not in parallel: each one already uses the
 * worker and a lot of memory, and twenty at once would simply run the device out.
 */
export async function runBatch<T>(
  items: readonly T[],
  work: (item: T, onProgress: (fraction: number) => void) => Promise<OutputFile>,
  report: (update: BatchUpdate) => void,
  onProgress?: (fraction: number) => void,
): Promise<BatchResult> {
  await claimJob();

  const outputs: OutputFile[] = [];
  let failed = 0;

  for (const [index, item] of items.entries()) {
    report({ index, state: 'working' });
    try {
      const output = await work(item, (fraction) => onProgress?.((index + fraction) / items.length));
      outputs.push(output);
      report({ index, state: 'done', output });
    } catch (error) {
      failed++;
      report({ index, state: 'failed', error });
    }
    onProgress?.((index + 1) / items.length);
  }

  return { outputs, failed };
}
