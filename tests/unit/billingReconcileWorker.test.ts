import { describe, expect, it } from 'vitest';
import worker, { runSweep, sendAlert } from '../../workers/billing-reconcile/index';

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

describe('the failure alert', () => {
  const alertEnv = { ...env, RESEND_API_KEY: 're_key', EMAIL_FROM: 'hello@example.test', ALERT_EMAIL: 'owner@example.test' };

  it('emails the owner with the reason and nothing secret', async () => {
    let sent: { url: string; body: string } | undefined;
    const fetcher = (async (url: string, init: RequestInit) => {
      sent = { url, body: String(init.body) };
      return { ok: true, status: 200 };
    }) as unknown as typeof fetch;

    await sendAlert(alertEnv, 'the reconcile endpoint answered 500', fetcher);
    expect(sent?.url).toBe('https://api.resend.com/emails');
    const body = JSON.parse(sent!.body) as { to: string; subject: string; text: string };
    expect(body.to).toBe('owner@example.test');
    expect(body.subject).toMatch(/billing sweep failed/i);
    expect(body.text).toContain('answered 500');
    expect(sent!.body).not.toContain('token-123');
    expect(sent!.body).not.toContain('re_key');
  });

  it('never throws, whether the email is refused, the network fails, or nothing is configured', async () => {
    await expect(sendAlert(alertEnv, 'x', answer(500, {}))).resolves.toBeUndefined();
    await expect(sendAlert(alertEnv, 'x', (async () => { throw new Error('offline'); }) as unknown as typeof fetch)).resolves.toBeUndefined();
    await expect(sendAlert(env, 'x')).resolves.toBeUndefined();
  });

  it('is sent when a scheduled sweep fails, the failure is still thrown, and nothing is sent when it succeeds', async () => {
    const emails: string[] = [];
    const original = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes('resend.com')) {
        emails.push(String(url));
        return { ok: true, status: 200 };
      }
      return { ok: false, status: 502, json: async () => ({}) };
    }) as unknown as typeof fetch;
    try {
      await expect(worker.scheduled!({} as ScheduledController, alertEnv as never)).rejects.toThrow(/502/);
      expect(emails).toHaveLength(1);

      globalThis.fetch = (async () => ({ ok: true, status: 200, json: async () => ({ checked: 0, corrected: 0, errors: 0 }) })) as unknown as typeof fetch;
      emails.length = 0;
      await worker.scheduled!({} as ScheduledController, alertEnv as never);
      expect(emails).toHaveLength(0);
    } finally {
      globalThis.fetch = original;
    }
  });
});
