import { describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../../functions/api/billing/webhook';
import { createUser } from '../../../src/lib/server/db';
import { createFakeD1 } from './fakeD1';

const SECRET = 'whsec_c2VjcmV0LWtleS1mb3ItdGVzdHM=';

async function sign(id: string, timestamp: string, body: string): Promise<string> {
  const raw = atob(SECRET.replace(/^whsec_/, ''));
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  const key = await crypto.subtle.importKey('raw', bytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  let binary = '';
  for (const byte of new Uint8Array(signature)) binary += String.fromCharCode(byte);
  return `v1,${btoa(binary)}`;
}

async function setup() {
  const { db, tables } = createFakeD1();
  const user = await createUser(db, 'buyer@example.com', Date.now());
  const env = {
    DB: db,
    DODO_WEBHOOK_SECRET: SECRET,
    DODO_PRODUCT_PRO_YEARLY: 'prod_pro_year',
    DODO_PRODUCT_PRACTICE_YEARLY: 'prod_practice_year',
  } as unknown as Env;

  async function deliver(id: string, product: string | undefined, target: Env = env): Promise<number> {
    const body = JSON.stringify({
      type: 'subscription.active',
      data: { subscription_id: 'sub_1', product_id: product, metadata: { user_id: user.id } },
    });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const request = new Request('https://leaflockpdf.com/api/billing/webhook', {
      method: 'POST',
      headers: { 'webhook-id': id, 'webhook-timestamp': timestamp, 'webhook-signature': await sign(id, timestamp, body) },
      body,
    });
    return (await onRequestPost({ request, env: target })).status;
  }

  const planOf = () => tables.users.find((row) => row['id'] === user.id)!['plan'];
  return { env, tables, db, deliver, planOf };
}

describe('billing webhook', () => {
  it('grants the plan the product is for, once', async () => {
    const { deliver, planOf, tables } = await setup();
    expect(await deliver('evt_1', 'prod_practice_year')).toBe(204);
    expect(planOf()).toBe('practice');
    expect(await deliver('evt_1', 'prod_practice_year')).toBe(204);
    expect(tables.webhookEvents).toHaveLength(1);
  });

  it('refuses a product it does not recognise instead of defaulting to Pro, and lets the retry through', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env, deliver, planOf, tables } = await setup();
    // Practice product id unset: the situation TODO.md §3 describes.
    const misconfigured = { ...env, DODO_PRODUCT_PRACTICE_YEARLY: undefined } as unknown as Env;

    expect(await deliver('evt_2', 'prod_practice_year', misconfigured)).toBe(500);
    expect(planOf()).toBe('free');
    expect(tables.webhookEvents).toHaveLength(0);

    // Configuration fixed; Dodo retries the same delivery id and it now takes effect.
    expect(await deliver('evt_2', 'prod_practice_year')).toBe(204);
    expect(planOf()).toBe('practice');
    error.mockRestore();
  });

  it('un-records a delivery whose database write failed, so the retry is applied', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { env, db, deliver, planOf, tables } = await setup();
    const realPrepare = db.prepare.bind(db);
    let failNext = true;
    const flaky = {
      ...db,
      prepare(sql: string) {
        if (failNext && sql.includes('UPDATE users SET plan')) {
          failNext = false;
          throw new Error('D1 unavailable');
        }
        return realPrepare(sql);
      },
    } as unknown as D1Database;

    expect(await deliver('evt_3', 'prod_pro_year', { ...env, DB: flaky } as unknown as Env)).toBe(500);
    expect(planOf()).toBe('free');
    expect(tables.webhookEvents).toHaveLength(0);

    expect(await deliver('evt_3', 'prod_pro_year')).toBe(204);
    expect(planOf()).toBe('pro');
    error.mockRestore();
  });
});
