import { describe, expect, it } from 'vitest';
import { claimRecentPurchase, dueForResync, parsePayment, parseSubscription, reconcileUser, RESYNC_AFTER_MS } from '../../src/lib/server/dodoSync';
import { getUserByPayment, listStaleBillingUsers, markBillingSynced, setUserPlan, type UserRow } from '../../src/lib/server/db';
import { isNewerThan } from '../../src/lib/server/planState';

const env = {
  DODO_API_KEY: 'key',
  DODO_MODE: 'test',
  DODO_PRODUCT_PRO_YEARLY: 'pdt_pro',
  DODO_PRODUCT_LIFETIME: 'pdt_ten',
} as unknown as Env;

const now = Date.UTC(2027, 5, 1, 12);
const future = '2027-12-01T00:00:00Z';

/** A database that records what was written, so a test can see what changed without a real D1. */
function fakeDb() {
  const writes: { sql: string; args: unknown[] }[] = [];
  const db = {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => {
        writes.push({ sql, args });
        return { run: async () => ({}) };
      },
    }),
  } as unknown as D1Database;
  return { db, writes };
}

const user = (overrides: Partial<UserRow>): UserRow =>
  ({
    id: 'u1', email: 'a@example.com', created_at: 0, last_login_at: null, plan: 'pro', status: 'active',
    dodo_customer_id: 'cus_1', subscription_id: 'sub_1', plan_status: 'active', current_period_end: Date.parse(future),
    password_hash: null, google_sub: null, billing_event_at: null, billing_synced_at: null, dodo_payment_id: null,
    ...overrides,
  }) as UserRow;

/** Answers by URL: the first matching path wins, anything else is a 404. */
const dodo = (routes: Record<string, unknown>, status = 200) =>
  (async (url: string) => {
    const key = Object.keys(routes).find((path) => url.includes(path));
    return key
      ? { ok: status === 200, status, json: async () => routes[key] }
      : { ok: false, status: 404, json: async () => ({}) };
  }) as unknown as typeof fetch;

const subscription = (status: string, extra: Record<string, unknown> = {}) => ({
  status, product_id: 'pdt_pro', next_billing_date: future, subscription_id: 'sub_1', customer: { customer_id: 'cus_1' }, metadata: { user_id: 'u1' }, ...extra,
});

describe('reconcileUser', () => {
  it('repairs an account whose copy disagrees with Dodo, such as a missed renewal or cancellation', async () => {
    const { db, writes } = fakeDb();
    const outcome = await reconcileUser(env, db, user({ plan_status: 'active' }), now, dodo({ '/subscriptions/sub_1': subscription('on_hold') }));
    expect(outcome).toBe('corrected');
    expect(writes[0]?.sql).toContain('UPDATE users SET plan');
    expect(writes[0]?.args.slice(0, 3)).toEqual(['free', 'expired', null]);
  });

  it('only records the check when Dodo agrees with the copy', async () => {
    const { db, writes } = fakeDb();
    const outcome = await reconcileUser(env, db, user({}), now, dodo({ '/subscriptions/sub_1': subscription('active') }));
    expect(outcome).toBe('unchanged');
    expect(writes).toHaveLength(1);
    expect(writes[0]?.sql).toContain('billing_synced_at');
  });

  it('changes nothing when Dodo cannot be read, so an outage never removes a plan', async () => {
    const { db, writes } = fakeDb();
    expect(await reconcileUser(env, db, user({}), now, dodo({ '/subscriptions/sub_1': {} }, 500))).toBe('error');
    expect(await reconcileUser(env, db, user({}), now, dodo({}))).toBe('error');
    expect(writes).toHaveLength(0);
  });

  it('never throws, even when Dodo answers with a product it does not know', async () => {
    const { db, writes } = fakeDb();
    const outcome = await reconcileUser(env, db, user({}), now, dodo({ '/subscriptions/sub_1': subscription('active', { product_id: 'pdt_new' }) }));
    expect(outcome).toBe('error');
    expect(writes).toHaveLength(0);
  });

  it('takes the ten-year plan back when its payment was refunded', async () => {
    const { db, writes } = fakeDb();
    const holder = user({ plan: 'lifetime', subscription_id: null, dodo_payment_id: 'pay_1', current_period_end: null });
    const outcome = await reconcileUser(env, db, holder, now, dodo({ '/payments/pay_1': { payment_id: 'pay_1', status: 'succeeded', refund_status: 'full' } }));
    expect(outcome).toBe('corrected');
    expect(writes[0]?.args.slice(0, 2)).toEqual(['free', 'expired']);
  });

  it('keeps the ten-year plan when the payment object does not name a product', async () => {
    const { db } = fakeDb();
    const holder = user({ plan: 'lifetime', subscription_id: null, dodo_payment_id: 'pay_1', current_period_end: null });
    expect(await reconcileUser(env, db, holder, now, dodo({ '/payments/pay_1': { payment_id: 'pay_1', status: 'succeeded' } }))).toBe('unchanged');
  });

  it('skips accounts with no Dodo billing, and everything when no key is configured', async () => {
    const { db } = fakeDb();
    expect(await reconcileUser(env, db, user({ subscription_id: null }), now, dodo({}))).toBe('skipped');
    expect(await reconcileUser({ ...env, DODO_API_KEY: undefined } as unknown as Env, db, user({}), now, dodo({}))).toBe('skipped');
  });
});

describe('dueForResync', () => {
  it('is due when never read or last read more than the window ago, and never for an account without Dodo billing', () => {
    expect(dueForResync(user({ billing_synced_at: null }), now)).toBe(true);
    expect(dueForResync(user({ billing_synced_at: now - RESYNC_AFTER_MS }), now)).toBe(true);
    expect(dueForResync(user({ billing_synced_at: now - 1000 }), now)).toBe(false);
    expect(dueForResync(user({ subscription_id: null, dodo_payment_id: null }), now)).toBe(false);
  });
});

describe('claimRecentPurchase', () => {
  const free = user({ plan: 'free', subscription_id: null, plan_status: 'none', current_period_end: null });

  it('grants a purchase made with this account whose webhook never arrived', async () => {
    const { db, writes } = fakeDb();
    const outcome = await claimRecentPurchase(env, db, free, now, dodo({ '/subscriptions?': { items: [subscription('active')] } }));
    expect(outcome).toBe('corrected');
    expect(writes[0]?.args.slice(0, 2)).toEqual(['pro', 'active']);
  });

  it("ignores another account's purchase", async () => {
    const { db, writes } = fakeDb();
    const other = subscription('active', { metadata: { user_id: 'someone-else' } });
    const outcome = await claimRecentPurchase(env, db, free, now, dodo({ '/subscriptions?': { items: [other] }, '/payments?': { items: [] } }));
    expect(outcome).toBe('unchanged');
    expect(writes.every((w) => !w.sql.includes('SET plan'))).toBe(true);
  });

  it('finds the one-off ten-year payment and stores its id', async () => {
    const { db, writes } = fakeDb();
    const routes = {
      '/subscriptions?': { items: [] },
      '/payments?': { items: [{ payment_id: 'pay_1', metadata: { user_id: 'u1' }, subscription_ids: [] }] },
      '/payments/pay_1': { payment_id: 'pay_1', status: 'succeeded', product_cart: [{ product_id: 'pdt_ten' }] },
    };
    expect(await claimRecentPurchase(env, db, free, now, dodo(routes))).toBe('corrected');
    expect(writes[0]?.args.slice(0, 2)).toEqual(['lifetime', 'active']);
    expect(writes[0]?.args).toContain('pay_1');
  });

  it('is throttled when the account was checked in the last minute', async () => {
    const { db, writes } = fakeDb();
    expect(await claimRecentPurchase(env, db, { ...free, billing_synced_at: now - 5000 }, now, dodo({}))).toBe('throttled');
    expect(writes).toHaveLength(0);
  });

  it('reports an error and changes nothing when Dodo cannot be read', async () => {
    const { db, writes } = fakeDb();
    expect(await claimRecentPurchase(env, db, free, now, dodo({}))).toBe('error');
    expect(writes).toHaveLength(0);
  });
});

describe('reading what Dodo sends', () => {
  it('takes the product from the cart when the payment has no product of its own', () => {
    expect(parsePayment({ payment_id: 'p', product_cart: [{ product_id: 'pdt_ten' }] }).productId).toBe('pdt_ten');
  });

  it('copes with missing fields', () => {
    expect(parseSubscription({})).toEqual({ status: undefined, productId: null, nextBillingDate: null, customerId: null, subscriptionId: null });
  });
});

describe('a database that has not had migration 0008 yet', () => {
  /** Rejects any statement naming a billing sync column, the way SQLite does for a column that does not exist. */
  function legacyDb() {
    const writes: string[] = [];
    const db = {
      prepare: (sql: string) => ({
        bind: () => ({
          run: async () => {
            if (/billing_event_at|billing_synced_at|dodo_payment_id/.test(sql)) throw new Error('D1_ERROR: no such column: billing_event_at');
            writes.push(sql);
            return {};
          },
          first: async () => {
            if (/dodo_payment_id/.test(sql)) throw new Error('D1_ERROR: no such column: dodo_payment_id');
            return null;
          },
          all: async () => {
            if (/billing_synced_at/.test(sql)) throw new Error('D1_ERROR: no such column: billing_synced_at');
            return { results: [] };
          },
        }),
      }),
    } as unknown as D1Database;
    return { db, writes };
  }

  it('still records a plan, so a deploy that lands before the migration cannot cost a customer their plan', async () => {
    const { db, writes } = legacyDb();
    await setUserPlan(db, 'u1', { plan: 'pro', planStatus: 'active', currentPeriodEnd: 1, dodoCustomerId: null, subscriptionId: 'sub_1', eventAt: 5 });
    expect(writes).toHaveLength(1);
    expect(writes[0]).not.toContain('billing_event_at');
  });

  it('treats the missing columns as nothing recorded, rather than failing', async () => {
    const { db } = legacyDb();
    expect(await getUserByPayment(db, 'pay_1')).toBeNull();
    await expect(markBillingSynced(db, 'u1', 1)).resolves.toBeUndefined();
    expect(await listStaleBillingUsers(db, 1, 5)).toEqual([]);
  });

  it('still applies events, since there is no recorded time to compare with', () => {
    expect(isNewerThan(undefined, 1000)).toBe(true);
  });
});
