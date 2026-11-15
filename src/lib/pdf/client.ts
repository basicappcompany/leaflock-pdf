import { claimJob, holdingClaim } from '../usage';
import type { OpArgs, OpName, OpResult } from './ops';
import type { JobFailure, JobMessage, JobRequest } from './protocol';

/** Rejection value when the worker reports a failure. */
export class JobError extends Error {
  readonly failure: JobFailure;

  constructor(failure: JobFailure) {
    super(
      failure.kind === 'input'
        ? `${failure.fileName}: ${failure.problem}`
        : failure.kind === 'tool'
          ? failure.code
          : failure.message,
    );
    this.name = 'JobError';
    this.failure = failure;
  }
}

interface Pending {
  resolve: (result: unknown) => void;
  reject: (error: unknown) => void;
  onProgress: ((fraction: number) => void) | undefined;
}

let worker: Worker | undefined;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./pdf.worker.ts', import.meta.url), { type: 'module' });
  worker.addEventListener('message', (event: MessageEvent<JobMessage>) => {
    const message = event.data;
    const handlers = pending.get(message.id);
    if (!handlers) return;
    if (message.type === 'progress') {
      handlers.onProgress?.(message.fraction);
      return;
    }
    pending.delete(message.id);
    if (message.type === 'done') handlers.resolve(message.result);
    else handlers.reject(new JobError(message.failure));
  });
  worker.addEventListener('error', (event) => {
    // A crashed worker (e.g. out of memory) fails every job in flight; the next job starts a fresh one.
    for (const { reject } of pending.values()) reject(new JobError({ kind: 'unexpected', message: event.message }));
    pending.clear();
    worker?.terminate();
    worker = undefined;
  });
  return worker;
}

/**
 * Starts the worker before any job needs it.
 *
 * Two reasons, and the second is the one that made this necessary. It takes the wait for
 * roughly a megabyte of worker code off the first job, so the first click feels
 * immediate. And it is what makes a tool work with no network: the worker's own module
 * imports are only requested when a job runs, so without this they would never reach the
 * service worker's cache during an online visit, and the first offline job would fail
 * even though the page itself loaded (see public/sw.js).
 *
 * Safe to call repeatedly and on any thread with Worker support; a running worker is
 * reused.
 */
export function warmPdfWorker(): void {
  if (typeof Worker === 'undefined') return;
  try {
    getWorker();
  } catch {
    /* No worker support, or blocked: jobs will fail later with a real message. */
  }
}

/**
 * Runs a PDF operation in the background worker.
 * Inputs are copied, not transferred, so callers can keep using their bytes.
 *
 * Every tool's work funnels through here, so this is also where one job is counted
 * against the free tier's daily allowance (src/lib/usage.ts). The file itself never
 * leaves the device: only the fact that a job ran is reported.
 */
export async function runPdfJob<K extends OpName>(
  op: K,
  args: OpArgs<K>,
  onProgress?: (fraction: number) => void,
  options?: {
    /** Set false for work that isn't a tool run of its own: bundling results into a
     * zip, or a single file inside a batch that was already counted once. */
    metered?: boolean;
  },
): Promise<OpResult<K>> {
  if (options?.metered !== false && !holdingClaim()) await claimJob();
  const id = nextId++;
  const request: JobRequest = { id, op, args };
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve: resolve as (result: unknown) => void, reject, onProgress });
    getWorker().postMessage(request);
  });
}
