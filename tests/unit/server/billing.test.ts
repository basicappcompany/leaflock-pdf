import { describe, expect, it } from 'vitest';
import { effectivePlan, planForProduct, productIdFor, verifyWebhook } from '../../../src/lib/server/billing';

const SECRET = 'whsec_c2VjcmV0LWtleS1mb3ItdGVzdHM=';

/** Signs a body the way Dodo does, so the verifier is tested against a real signature. */
async function sign(id: string, timestamp: string, body: string, secret = SECRET): Promise<string> {
  const raw = atob(secret.replace(/^whsec_/, ''));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  let binary = '';
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return `v1,${btoa(binary)}`;
}

const env = {
  DODO_PRODUCT_PRO_MONTHLY: 'prod_month',
  DODO_PRODUCT_PRO_YEARLY: 'prod_year',
  DODO_PRODUCT_LIFETIME: 'prod_life',
} as unknown as Env;

describe('webhook verification', () => {
  const body = JSON.stringify({ type: 'subscription.active' });
  const now = Date.parse('2026-10-22T12:00:00Z');
  const timestamp = String(Math.floor(now / 1000));

  it('accepts a genuine delivery', async () => {
    const signatureHeader = await sign('evt_1', timestamp, body);
    await expect(
      verifyWebhook({ secret: SECRET, id: 'evt_1', timestamp, signatureHeader, body, now }),
    ).resolves.toBe(true);
  });

  it('rejects a tampered body', async () => {
    const signatureHeader = await sign('evt_1', timestamp, body);
    await expect(
      verifyWebhook({ secret: SECRET, id: 'evt_1', timestamp, signatureHeader, body: '{"type":"evil"}', now }),
    ).resolves.toBe(false);
  });

  it('rejects a signature made with another secret', async () => {
    const signatureHeader = await sign('evt_1', timestamp, body, 'whsec_b3RoZXIta2V5LWZvci10ZXN0cw==');
    await expect(
      verifyWebhook({ secret: SECRET, id: 'evt_1', timestamp, signatureHeader, body, now }),
    ).resolves.toBe(false);
  });

  it('rejects a replay of an old delivery', async () => {
    const signatureHeader = await sign('evt_1', timestamp, body);
    await expect(
      verifyWebhook({ secret: SECRET, id: 'evt_1', timestamp, signatureHeader, body, now: now + 10 * 60 * 1000 }),
    ).resolves.toBe(false);
  });

  it('rejects a delivery with headers missing', async () => {
    await expect(
      verifyWebhook({ secret: SECRET, id: null, timestamp, signatureHeader: 'v1,x', body, now }),
    ).resolves.toBe(false);
    await expect(
      verifyWebhook({ secret: SECRET, id: 'evt_1', timestamp, signatureHeader: null, body, now }),
    ).resolves.toBe(false);
  });

  it('accepts when the header carries several signatures', async () => {
    const real = await sign('evt_1', timestamp, body);
    await expect(
      verifyWebhook({ secret: SECRET, id: 'evt_1', timestamp, signatureHeader: `v1,bm90LWl0 ${real}`, body, now }),
    ).resolves.toBe(true);
  });
});

describe('plans and products', () => {
  it('maps each product to the plan it grants', () => {
    expect(planForProduct(env, 'prod_month')).toBe('pro');
    expect(planForProduct(env, 'prod_year')).toBe('pro');
    expect(planForProduct(env, 'prod_life')).toBe('lifetime');
    expect(planForProduct(env, 'prod_unknown')).toBeNull();
    expect(planForProduct(env, null)).toBeNull();
  });

  it('finds the product behind each plan we sell', () => {
    expect(productIdFor(env, 'proMonthly')).toBe('prod_month');
    expect(productIdFor(env, 'proTenYear')).toBe('prod_life');
  });
});

describe('the plan an account actually has', () => {
  const now = Date.parse('2026-10-22T12:00:00Z');
  const base = { plan: 'pro', plan_status: 'active', current_period_end: now + 86_400_000 } as const;

  it('grants an active subscription', () => {
    expect(effectivePlan(base, now)).toBe('pro');
  });

  it('keeps a cancelled plan until the paid-for period ends, then drops it', () => {
    const cancelled = { ...base, plan_status: 'cancelled' } as const;
    expect(effectivePlan(cancelled, now)).toBe('pro');
    expect(effectivePlan({ ...cancelled, current_period_end: now - 1 }, now)).toBe('free');
  });

  it('keeps access while a renewal is retried', () => {
    expect(effectivePlan({ ...base, plan_status: 'past_due' }, now)).toBe('pro');
  });

  it('drops an expired subscription at once', () => {
    expect(effectivePlan({ ...base, plan_status: 'expired' }, now)).toBe('free');
  });

  it('never expires the lifetime plan', () => {
    expect(effectivePlan({ plan: 'lifetime', plan_status: 'active', current_period_end: null }, now)).toBe('lifetime');
  });

  it('leaves free and Business accounts alone', () => {
    expect(effectivePlan({ plan: 'free', plan_status: 'none', current_period_end: null }, now)).toBe('free');
    expect(effectivePlan({ plan: 'business', plan_status: 'none', current_period_end: null }, now)).toBe('business');
  });
});
