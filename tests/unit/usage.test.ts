import { afterEach, describe, expect, it, vi } from 'vitest';
import { setCachedPlan } from '../../src/lib/planCache';
import { UsageLimitError, claimJob } from '../../src/lib/usage';

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({ ok, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setCachedPlan('anonymous');
});

describe('claiming a job against the daily allowance', () => {
  it('passes when the allowance has room', async () => {
    mockFetch({ allowed: true, remaining: 4, reason: 'anonymous' });
    await expect(claimJob()).resolves.toBeUndefined();
  });

  it('throws once the allowance is used up, saying which nudge to show', async () => {
    mockFetch({ allowed: false, remaining: 0, reason: 'free-account' });
    await expect(claimJob()).rejects.toBeInstanceOf(UsageLimitError);

    mockFetch({ allowed: false, remaining: 0, reason: 'free-account' });
    await expect(claimJob()).rejects.toMatchObject({ reason: 'free-account' });
  });

  it('never calls the server on a paid plan, so paid work waits on nothing', async () => {
    const fetchMock = mockFetch({ allowed: false, remaining: 0 });
    setCachedPlan('pro');

    await expect(claimJob()).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fails open when the request fails, so a backend hiccup never blocks a tool', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    await expect(claimJob()).resolves.toBeUndefined();
  });

  it('fails open when the server answers with an error status', async () => {
    mockFetch(null, false);
    await expect(claimJob()).resolves.toBeUndefined();
  });
});
