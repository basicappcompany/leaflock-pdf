import { afterEach, describe, expect, it, vi } from 'vitest';
import { runBatch, type BatchUpdate } from '../../src/lib/pdf/batch';
import { setCachedPlan } from '../../src/lib/planCache';
import type { OutputFile } from '../../src/lib/pdf/types';

const out = (name: string): OutputFile => ({ name, bytes: new Uint8Array(new ArrayBuffer(4)), type: 'application/pdf' });

/** The usage endpoint, answering however the test wants. */
function mockClaim(body: unknown = { allowed: true, remaining: 9 }) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setCachedPlan('anonymous');
});

describe('running a batch', () => {
  it('processes every file in order and collects the results', async () => {
    mockClaim();
    const seen: string[] = [];
    const result = await runBatch(['a', 'b', 'c'], async (name) => {
      seen.push(name);
      return out(`${name}.pdf`);
    }, () => {});

    expect(seen).toEqual(['a', 'b', 'c']);
    expect(result.outputs.map((f) => f.name)).toEqual(['a.pdf', 'b.pdf', 'c.pdf']);
    expect(result.failed).toBe(0);
  });

  it('keeps going when one file fails, and reports which', async () => {
    mockClaim();
    const updates: BatchUpdate[] = [];
    const result = await runBatch(
      ['ok', 'locked', 'ok2'],
      async (name) => {
        if (name === 'locked') throw new Error('password-protected');
        return out(`${name}.pdf`);
      },
      (u) => updates.push(u),
    );

    // The failure must not stop the third file.
    expect(result.outputs.map((f) => f.name)).toEqual(['ok.pdf', 'ok2.pdf']);
    expect(result.failed).toBe(1);

    const failure = updates.find((u) => u.state === 'failed');
    expect(failure?.index).toBe(1);
    expect(failure?.error).toBeInstanceOf(Error);
    expect(updates.filter((u) => u.state === 'done')).toHaveLength(2);
  });

  it('counts the whole batch as one job, not one per file', async () => {
    const fetchMock = mockClaim();
    await runBatch(['a', 'b', 'c', 'd', 'e'], async (n) => out(`${n}.pdf`), () => {});

    const claims = fetchMock.mock.calls.filter(([url]) => String(url).includes('/api/usage/claim'));
    expect(claims).toHaveLength(1);
  });

  it('refuses the batch when the daily allowance is gone', async () => {
    mockClaim({ allowed: false, remaining: 0, reason: 'free-account' });
    const work = vi.fn();

    await expect(runBatch(['a', 'b'], work as never, () => {})).rejects.toMatchObject({ name: 'UsageLimitError' });
    // Nothing should have been processed.
    expect(work).not.toHaveBeenCalled();
  });

  it('reports progress across the whole batch, not per file', async () => {
    mockClaim();
    const seen: number[] = [];
    await runBatch(['a', 'b'], async (n, onProgress) => { onProgress(0.5); return out(`${n}.pdf`); }, () => {}, (f) => seen.push(f));

    expect(seen[0]).toBeCloseTo(0.25);
    expect(seen.at(-1)).toBe(1);
  });

  it('does nothing gracefully when given no files', async () => {
    mockClaim();
    await expect(runBatch([], async () => out('x.pdf'), () => {})).resolves.toEqual({ outputs: [], failed: 0 });
  });
});
