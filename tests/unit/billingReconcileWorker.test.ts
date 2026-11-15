import { describe, expect, it } from 'vitest';
import { runSweep } from '../../workers/billing-reconcile/index';

const env = { RECONCILE_TOKEN: 'token-123', SITE_URL: 'https://example.test' };

const answer = (status: number, body: unknown) =>
  (async () => ({ ok: status >= 200 && status < 300, status, json: async () => body })) as unknown as typeof fetch;

describe('the billing reconcile worker', () => {
  it('posts to the reconcile endpoint with the shared token and a named user agent', async () => {
    let seen: { url: string; init: RequestInit } | undefined;
    const fetcher = (async (url: string, init: RequestInit) => {
      seen = { url, init };
      return { ok: true, status: 200, json: async () => ({ checked: 3, corrected: 1, errors: 0 }) };
    }) as unknown as typeof fetch;

    expect(await runSweep(env, fetcher)).toEqual({ checked: 3, corrected: 1, errors: 0 });
    expect(seen?.url).toBe('https://example.test/api/billing/reconcile');
    expect(seen?.init.method).toBe('POST');
    const headers = seen?.init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer token-123');
    expect(headers['User-Agent']).toMatch(/billing-reconcile/);
  });

  it('fails the invocation when the endpoint refuses, so an outage or a bad token is visible', async () => {
    await expect(runSweep(env, answer(401, {}))).rejects.toThrow(/401/);
    await expect(runSweep(env, answer(403, {}))).rejects.toThrow(/403/);
  });

  it('fails the invocation when any account could not be read from Dodo', async () => {
    await expect(runSweep(env, answer(200, { checked: 5, corrected: 0, errors: 2 }))).rejects.toThrow(/2 account/);
  });
});
