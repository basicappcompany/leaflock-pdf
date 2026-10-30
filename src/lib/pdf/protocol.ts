import type { PdfInputProblem } from './inputError';
import type { OpName } from './ops';

export type JobRequest = { id: number; op: OpName; args: unknown };

export type JobFailure =
  | { kind: 'input'; fileName: string; problem: PdfInputProblem }
  | { kind: 'tool'; code: string; values: Record<string, string | number> }
  | { kind: 'unexpected'; message: string };

export type JobMessage =
  | { id: number; type: 'progress'; fraction: number }
  | { id: number; type: 'done'; result: unknown }
  | { id: number; type: 'failed'; failure: JobFailure };

/** Every ArrayBuffer inside a value, so results can be transferred instead of copied. */
export function collectBuffers(value: unknown, found = new Set<ArrayBuffer>()): ArrayBuffer[] {
  if (value instanceof ArrayBuffer) {
    found.add(value);
  } else if (ArrayBuffer.isView(value)) {
    if (value.buffer instanceof ArrayBuffer) found.add(value.buffer);
  } else if (Array.isArray(value)) {
    for (const item of value) collectBuffers(item, found);
  } else if (value !== null && typeof value === 'object') {
    for (const item of Object.values(value)) collectBuffers(item, found);
  }
  return [...found];
}
