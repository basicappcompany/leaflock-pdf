import { afterEach, describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../functions/api/billing/webhook';
import type { UserRow } from '../../src/lib/server/db';

const secretBytes = new Uint8Array(24).map((_, i) => i + 1);
const SECRET = `whsec_${btoa(String.fromCharCode(...secretBytes))}`;

const baseEnv = {
  DODO_WEBHOOK_SECRET: SECRET,
  DODO_API_KEY: undefined,
  DODO_PRODUCT_PRO_YEARLY: 'pdt_pro',
  DODO_PRODUCT_PRACTICE_YEARLY: 'pdt_practice',
  DODO_PRODUCT_LIFETIME: 'pdt_ten',
} as unknown as Env;

const future = '2028-12-01T00:00:00Z';

const makeUser = (overrides: Partial<UserRow> = {}): UserRow =>
  ({
    id: 'u1', email: 'a@example.com', created_at: 0, last_login_at: null, plan: 'free', status: 'active',
    dodo_customer_id: null, subscription_id: null, plan_status: 'none', current_period_end: null,
    password_hash: null, google_sub: null, billing_event_at: null, billing_synced_at: null, dodo_payment_id: null,
    ...overrides,
  }) as UserRow;

/** Just enough of D1 for the webhook: the users and the delivery log live in memory. */
function memoryDb(users: UserRow[]) {
  const seen = new Set<string>();
  const find = (predicate: (u: UserRow) => boolean) => users.find(predicate) ?? null;
  const statement = (sql: string, args: unknown[]) => ({
    first: async () => {
      if (sql.includes('INSERT INTO webhook_events')) {
        const id = args[0] as string;
        if (seen.has(id)) return null;
        seen.add(id);
        return { id };
      }
      if (sql.includes('WHERE id = ?')) return find((u) => u.id === args[0]);
      if (sql.includes('WHERE subscription_id = ?')) return find((u) => u.subscription_id === args[0]);
      if (sql.includes('WHERE dodo_payment_id = ?')) return find((u) => u.dodo_payment_id === args[0]);
      if (sql.includes('WHERE email = ?')) return find((u) => u.email === args[0]);
      return null;
    },
    run: async () => {
      if (sql.includes('DELETE FROM webhook_events')) seen.delete(args[0] as string);
      if (sql.includes('UPDATE users SET plan')) {
        const [plan, status, end, customer, subscription, payment, eventAt, now, id] = args as [UserRow['plan'], UserRow['plan_status'], number | null, string | null, string | null, string | null, number | null, number, string];
        const u = users.find((x) => x.id === id)!;
        Object.assign(u, {
          plan, plan_status: status, current_period_end: end,
          dodo_customer_id: customer ?? u.dodo_customer_id,
          subscription_id: subscription ?? u.subscription_id,
          dodo_payment_id: payment ?? u.dodo_payment_id,
          billing_event_at: eventAt ?? u.billing_event_at,
          billing_synced_at: now,
        });
      }
      if (sql.includes('UPDATE users SET billing_synced_at')) users.find((x) => x.id === args[1])!.billing_synced_at = args[0] as number;
      return {};
    },
  });
  return { prepare: (sql: string) => ({ bind: (...args: unknown[]) => statement(sql, args) }) } as unknown as D1Database;
}

async function sign(id: string, timestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', secretBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;
}

let counter = 0;
async function deliver(env: Env, event: Record<string, unknown>, overrides: { badSignature?: boolean } = {}): Promise<number> {
  const body = JSON.stringify(event);
  const id = `msg_${++counter}`;
  const timestamp = String(Math.floor(Date.now() / 1000));
  const request = new Request('https://leaflockpdf.com/api/billing/webhook', {
    method: 'POST',
    headers: {
      'webhook-id': id,
      'webhook-timestamp': timestamp,
      'webhook-signature': overrides.badSignature ? 'v1,AAAA' : await sign(id, timestamp, body),
    },
    body,
  });
  return (await onRequestPost({ request, env })).status;
}

const subscriptionEvent = (type: string, at: string, data: Record<string, unknown> = {}) => ({
  type,
  timestamp: at,
  data: { subscription_id: 'sub_1', product_id: 'pdt_pro', next_billing_date: future, customer: { customer_id: 'cus_1' }, metadata: { user_id: 'u1' }, ...data },
});

/** Dodo answering GET /subscriptions/sub_1 with this status, and recording that it was asked. */
function dodoSays(status: string) {
  const asked: string[] = [];
  vi.stubGlobal('fetch', async (url: string) => {
    asked.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => ({ status, product_id: 'pdt_pro', next_billing_date: future, subscription_id: 'sub_1', customer: { customer_id: 'cus_1' } }),
    };
  });
  return asked;
}

describe('the billing webhook', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects a delivery that is not signed by Dodo', async () => {
    const users = [makeUser()];
    expect(await deliver({ ...baseEnv, DB: memoryDb(users) } as Env, subscriptionEvent('subscription.active', '2027-01-01T00:00:00Z'), { badSignature: true })).toBe(401);
    expect(users[0]?.plan).toBe('free');
  });

  it('grants the plan on an activation and records when it happened', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    expect(await deliver(env, subscriptionEvent('subscription.active', '2027-01-01T00:00:00Z', { status: 'active' }))).toBe(204);
    expect(users[0]).toMatchObject({ plan: 'pro', plan_status: 'active', subscription_id: 'sub_1', billing_event_at: Date.parse('2027-01-01T00:00:00Z') });
  });

  it('reads Dodo instead of trusting an event older than the last one applied', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DODO_API_KEY: 'key', DB: memoryDb(users) } as Env;
    await deliver(env, subscriptionEvent('subscription.on_hold', '2027-03-01T00:00:00Z', { status: 'on_hold' }));
    expect(users[0]?.plan).toBe('free');

    // A late "renewed" from February: Dodo is asked, and Dodo says the subscription is active.
    const asked = dodoSays('active');
    const status = await deliver(env, subscriptionEvent('subscription.renewed', '2027-02-01T00:00:00Z', { status: 'active' }));
    expect(status).toBe(204);
    expect(asked.some((url) => url.includes('/subscriptions/sub_1'))).toBe(true);
    expect(users[0]?.plan).toBe('pro');
  });

  it('reads Dodo on a tie too, because two events with the same time cannot be ordered', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DODO_API_KEY: 'key', DB: memoryDb(users) } as Env;
    await deliver(env, subscriptionEvent('subscription.active', '2027-03-01T00:00:00Z', { status: 'active' }));
    const asked = dodoSays('on_hold');
    await deliver(env, subscriptionEvent('subscription.on_hold', '2027-03-01T00:00:00Z', { status: 'on_hold' }));
    expect(asked).toHaveLength(1);
    expect(users[0]?.plan).toBe('free');
  });

  it('retries the delivery when it must read Dodo and cannot, rather than trust the order', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    await deliver(env, subscriptionEvent('subscription.active', '2027-03-01T00:00:00Z', { status: 'active' }));
    expect(await deliver(env, subscriptionEvent('subscription.renewed', '2027-02-01T00:00:00Z', { status: 'active' }))).toBe(500);
  });

  it('reads Dodo for an authenticated event type it has never heard of, instead of dropping it', async () => {
    const users = [makeUser({ plan: 'pro', plan_status: 'active', subscription_id: 'sub_1', current_period_end: Date.parse(future) })];
    const env = { ...baseEnv, DODO_API_KEY: 'key', DB: memoryDb(users) } as Env;
    const asked = dodoSays('expired');
    expect(await deliver(env, { type: 'subscription.something_new', timestamp: '2027-06-01T00:00:00Z', data: { subscription_id: 'sub_1', metadata: { user_id: 'u1' } } })).toBe(204);
    expect(asked).toHaveLength(1);
    expect(users[0]?.plan).toBe('free');
  });

  it('records but does not act on events that say nothing about who has paid', async () => {
    const users = [makeUser({ plan: 'pro', plan_status: 'active', subscription_id: 'sub_1', current_period_end: Date.parse(future) })];
    const env = { ...baseEnv, DODO_API_KEY: 'key', DB: memoryDb(users) } as Env;
    const asked = dodoSays('expired');
    expect(await deliver(env, { type: 'payment.failed', timestamp: '2027-06-01T00:00:00Z', data: { subscription_id: 'sub_1', metadata: { user_id: 'u1' } } })).toBe(204);
    expect(asked).toHaveLength(0);
    expect(users[0]?.plan).toBe('pro');
  });

  it('follows the status in the payload when an old event is retried, so it cannot grant a cancelled plan back', async () => {
    const users = [makeUser({ plan: 'pro', plan_status: 'cancelled', current_period_end: Date.parse(future), subscription_id: 'sub_1' })];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    await deliver(env, subscriptionEvent('subscription.active', '2027-06-01T00:00:00Z', { status: 'cancelled' }));
    expect(users[0]).toMatchObject({ plan: 'pro', plan_status: 'cancelled' });
  });

  it('takes the plan away while a subscription is paused', async () => {
    const users = [makeUser({ plan: 'pro', plan_status: 'active', current_period_end: Date.parse(future), subscription_id: 'sub_1' })];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    await deliver(env, subscriptionEvent('subscription.paused', '2027-06-01T00:00:00Z'));
    expect(users[0]).toMatchObject({ plan: 'free', plan_status: 'expired', subscription_id: 'sub_1' });
  });

  it('applies the same status change from a subscription.updated event', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    await deliver(env, subscriptionEvent('subscription.updated', '2027-06-01T00:00:00Z', { status: 'active', product_id: 'pdt_practice' }));
    expect(users[0]?.plan).toBe('practice');
  });

  it('answers 500 for an unrecognised product, so Dodo retries once the configuration is fixed', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    expect(await deliver(env, subscriptionEvent('subscription.active', '2027-06-01T00:00:00Z', { status: 'active', product_id: 'pdt_mystery' }))).toBe(500);
    expect(users[0]?.plan).toBe('free');
  });

  it('grants the ten-year plan on its payment and keeps the payment id for later refunds', async () => {
    const users = [makeUser()];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    const status = await deliver(env, {
      type: 'payment.succeeded',
      timestamp: '2027-06-01T00:00:00Z',
      data: { payment_id: 'pay_1', status: 'succeeded', product_cart: [{ product_id: 'pdt_ten' }], customer: { customer_id: 'cus_1' }, metadata: { user_id: 'u1' } },
    });
    expect(status).toBe(204);
    expect(users[0]).toMatchObject({ plan: 'lifetime', dodo_payment_id: 'pay_1', current_period_end: null });
  });

  it('retries a refund it cannot verify, rather than let a refunded plan stay', async () => {
    const users = [makeUser({ plan: 'lifetime', plan_status: 'active', dodo_payment_id: 'pay_1' })];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    expect(await deliver(env, { type: 'refund.succeeded', timestamp: '2027-06-02T00:00:00Z', data: { payment_id: 'pay_1' } })).toBe(500);
    expect(users[0]?.plan).toBe('lifetime');
  });

  it('acknowledges a refund for an account that holds no Dodo billing', async () => {
    const users = [makeUser({ email: 'a@example.com' })];
    const env = { ...baseEnv, DB: memoryDb(users) } as Env;
    expect(await deliver(env, { type: 'refund.succeeded', timestamp: '2027-06-02T00:00:00Z', data: { payment_id: 'pay_x', customer: { email: 'a@example.com' } } })).toBe(204);
  });

  it('acknowledges a delivery for an account we do not know, so Dodo stops retrying it', async () => {
    const env = { ...baseEnv, DB: memoryDb([]) } as Env;
    expect(await deliver(env, subscriptionEvent('subscription.active', '2027-06-01T00:00:00Z', { metadata: {} }))).toBe(204);
  });
});
