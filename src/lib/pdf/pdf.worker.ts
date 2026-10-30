/// <reference lib="webworker" />
import { ToolError } from './errors';
import { PdfInputError } from './load';
import { ops, type OpName } from './ops';
import { collectBuffers, type JobFailure, type JobMessage, type JobRequest } from './protocol';
import type { OpContext } from './types';

declare const self: DedicatedWorkerGlobalScope;

function toFailure(error: unknown): JobFailure {
  if (error instanceof PdfInputError) {
    return { kind: 'input', fileName: error.fileName, problem: error.problem };
  }
  if (error instanceof ToolError) {
    return { kind: 'tool', code: error.code, values: error.values };
  }
  console.error(error);
  return { kind: 'unexpected', message: error instanceof Error ? error.message : String(error) };
}

function post(message: JobMessage, transfer: Transferable[] = []) {
  self.postMessage(message, transfer);
}

self.addEventListener('message', async (event: MessageEvent<JobRequest>) => {
  const { id, op, args } = event.data;
  let lastReport = 0;
  const ctx: OpContext = {
    progress(fraction: number) {
      // Throttle: a message per page is plenty.
      const now = performance.now();
      if (now - lastReport < 100 && fraction < 1) return;
      lastReport = now;
      post({ id, type: 'progress', fraction });
    },
  };
  try {
    const run = ops[op as OpName] as (args: unknown, ctx: OpContext) => Promise<unknown>;
    const result = await run(args, ctx);
    post({ id, type: 'done', result }, collectBuffers(result));
  } catch (error) {
    post({ id, type: 'failed', failure: toFailure(error) });
  }
});
