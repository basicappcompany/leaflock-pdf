import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { hasProcessingPayment, quoteUpgrade } from '../../src/lib/server/dodoUpgrade';
import { signedInHintCookieHeader } from '../../src/lib/server/session';

const env = { DODO_API_KEY: 'key', DODO_MODE: 'test' } as unknown as Env;
const reply = (body: unknown, ok = true) => (async () => ({ ok, status: ok ? 200 : 500, json: async () => body })) as unknown as typeof fetch;
const now = Date.UTC(2026, 10, 12, 12);

describe('hasProcessingPayment', () => {
  it('is true while a recent charge on the subscription has not settled', async () => {
    const fetcher = reply({ items: [{ status: 'processing', created_at: '2026-11-11T21:22:07Z' }, { status: 'succeeded', created_at: '2026-11-11T20:40:04Z' }] });
    expect(await hasProcessingPayment(env, 'sub_1', now, fetcher)).toBe(true);
  });

  it('is false when everything has settled, or a stuck charge is older than three days', async () => {
    expect(await hasProcessingPayment(env, 'sub_1', now, reply({ items: [{ status: 'succeeded', created_at: '2026-11-11T20:40:04Z' }] }))).toBe(false);
    expect(await hasProcessingPayment(env, 'sub_1', now, reply({ items: [{ status: 'processing', created_at: '2026-11-01T00:00:00Z' }] }))).toBe(false);
    expect(await hasProcessingPayment(env, 'sub_1', now, reply({ items: [] }))).toBe(false);
  });

  it('throws rather than guessing when Dodo cannot be read', async () => {
    await expect(hasProcessingPayment(env, 'sub_1', now, reply({}, false))).rejects.toThrow();
  });
});

describe('quoteUpgrade', () => {
  it('reads the exact charge and the next renewal from the preview', async () => {
    const fetcher = reply({ immediate_charge: { summary: { total_amount: 1294603, currency: 'INR' } }, new_plan: { next_billing_date: '2027-11-12T00:00:00Z' } });
    expect(await quoteUpgrade(env, 'sub_1', { productId: 'pdt_p' }, fetcher)).toEqual({ amount: 1294603, currency: 'INR', renewsOn: '2027-11-12T00:00:00Z' });
  });

  it('returns null when the preview is unusable, so the page does not guess a price', async () => {
    expect(await quoteUpgrade(env, 'sub_1', { productId: 'pdt_p' }, reply({}))).toBeNull();
    expect(await quoteUpgrade(env, 'sub_1', { productId: 'pdt_p' }, reply({}, false))).toBeNull();
  });
});

describe('the member hint', () => {
  it('carries the plan in the signed-in cookie, and writes anything unknown as free', () => {
    expect(signedInHintCookieHeader('pro')).toContain('leaflock_signed_in=pro;');
    expect(signedInHintCookieHeader('practice')).toContain('leaflock_signed_in=practice;');
    expect(signedInHintCookieHeader('nonsense')).toContain('leaflock_signed_in=free;');
    expect(signedInHintCookieHeader()).toContain('leaflock_signed_in=free;');
    expect(signedInHintCookieHeader('pro')).not.toContain('HttpOnly');
  });

  it('is applied before first paint on the home and pricing pages only', () => {
    const base = readFileSync('src/layouts/Base.astro', 'utf8');
    expect(base).toContain('memberHint &&');
    expect(base).toContain('leaflock_signed_in=([a-z]+)');
    expect(base).toContain("d.dataset.started='1'");
    expect(readFileSync('src/pages/index.astro', 'utf8')).toMatch(/\n\s+memberHint\n/);
    expect(readFileSync('src/pages/pricing.astro', 'utf8')).toContain('memberHint>');
    // A tool page carries nothing for it: the bytes would count against every page's HTML budget.
    expect(readFileSync('src/pages/[tool].astro', 'utf8')).not.toContain('memberHint');
  });

  it('refreshes the cookie from /api/auth/me so a plan change shows on the next page', () => {
    const me = readFileSync('functions/api/auth/me.ts', 'utf8');
    expect(me).toContain('signedInHintCookieHeader(session.plan)');
    expect(me).toContain('clearSignedInHintCookieHeader()');
  });
});
