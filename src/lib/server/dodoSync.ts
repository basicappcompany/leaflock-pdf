/**
 * Re-reads an account's billing from Dodo and repairs our copy of it.
 *
 * Webhooks are the fast path, but Dodo gives up on a delivery after eight attempts (about 27 hours) and
 * may deliver events out of order, so on their own they cannot be the whole truth. Here Dodo is asked
 * directly and its answer overwrites ours. A Dodo outage changes nothing: every failure leaves the
 * account as it was and reports `error`, so a network problem can never take a plan away.
 */

import { apiBase } from './billing';
import { markBillingSynced, setUserPlan, type PlanUpdate, type UserRow } from './db';
import {
  updateFromPayment,
  updateFromSubscription,
  type DodoPaymentState,
  type DodoSubscriptionState,
} from './planState';

type Fetcher = typeof fetch;

/** An account read from Dodo this recently is not read again by the visit and sweep triggers. */
export const RESYNC_AFTER_MS = 6 * 60 * 60 * 1000;
/** How far back "I just paid" looks for a purchase whose webhook never arrived. */
const RECENT_PURCHASE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** The purchase check can be asked for at most this often per account. */
const CLAIM_THROTTLE_MS = 60 * 1000;

export type SyncOutcome = 'unchanged' | 'corrected' | 'skipped' | 'error';

const headers = (env: Env) => ({ Authorization: `Bearer ${env.DODO_API_KEY}`, 'Content-Type': 'application/json' });

type Raw = Record<string, unknown>;
const text = (value: unknown): string | null => (typeof value === 'string' && value ? value : null);
const customerIdOf = (raw: Raw): string | null => text((raw['customer'] as Raw | undefined)?.['customer_id']);

export function parseSubscription(raw: Raw): DodoSubscriptionState {
  return {
    status: text(raw['status']) ?? undefined,
    productId: text(raw['product_id']),
    nextBillingDate: text(raw['next_billing_date']),
    customerId: customerIdOf(raw),
    subscriptionId: text(raw['subscription_id']),
  };
}

export function parsePayment(raw: Raw): DodoPaymentState {
  const cart = raw['product_cart'] as { product_id?: unknown }[] | undefined;
  return {
    paymentId: text(raw['payment_id']),
    status: text(raw['status']) ?? undefined,
    productId: text(raw['product_id']) ?? text(cart?.[0]?.product_id),
    customerId: customerIdOf(raw),
    refundStatus: text(raw['refund_status']),
    disputeStatus: text(raw['dispute_status']),
  };
}

async function getJson(env: Env, path: string, fetcher: Fetcher): Promise<Raw> {
  const response = await fetcher(`${apiBase(env)}${path}`, { headers: headers(env) });
  if (!response.ok) throw new Error(`dodo ${response.status}`);
  return (await response.json()) as Raw;
}

const differs = (user: UserRow, update: PlanUpdate): boolean =>
  user.plan !== update.plan ||
  user.plan_status !== update.planStatus ||
  (user.current_period_end ?? null) !== (update.currentPeriodEnd ?? null);

/**
 * Reads this account's subscription (or its ten-year payment) from Dodo and makes our row agree.
 * Never throws.
 */
export async function reconcileUser(
  env: Env,
  db: D1Database,
  user: UserRow,
  now: number = Date.now(),
  fetcher: Fetcher = fetch,
): Promise<SyncOutcome> {
  if (!env.DODO_API_KEY || (!user.subscription_id && !user.dodo_payment_id)) return 'skipped';
  try {
    let update: PlanUpdate | null = null;
    if (user.subscription_id) {
      const sub = parseSubscription(await getJson(env, `/subscriptions/${encodeURIComponent(user.subscription_id)}`, fetcher));
      update = updateFromSubscription(env, { ...sub, subscriptionId: sub.subscriptionId ?? user.subscription_id }, user, now);
    } else if (user.dodo_payment_id) {
      const payment = parsePayment(await getJson(env, `/payments/${encodeURIComponent(user.dodo_payment_id)}`, fetcher));
      // We already know this payment bought the ten-year plan, so a payment object that omits its product still counts.
      update = updateFromPayment(env, { ...payment, productId: payment.productId ?? env.DODO_PRODUCT_LIFETIME ?? null });
    }
    if (!update || !differs(user, update)) {
      await markBillingSynced(db, user.id, now);
      return 'unchanged';
    }
    await setUserPlan(db, user.id, update, now);
    console.log(JSON.stringify({ type: 'billing-reconcile', from: user.plan, to: update.plan, status: update.planStatus }));
    return 'corrected';
  } catch (error) {
    console.error('billing reconcile failed', error instanceof Error ? error.message : error);
    return 'error';
  }
}

/** Whether a paid-with-Dodo account is due another read, for the visit trigger. */
export function dueForResync(user: Pick<UserRow, 'subscription_id' | 'dodo_payment_id' | 'billing_synced_at'>, now: number = Date.now()): boolean {
  if (!user.subscription_id && !user.dodo_payment_id) return false;
  return user.billing_synced_at == null || now - user.billing_synced_at >= RESYNC_AFTER_MS;
}

/**
 * For an account that says it just paid but has no plan: looks for its purchase in Dodo, by the
 * `user_id` we attached at checkout, and grants what it finds. This is what covers a webhook that never
 * came. Throttled per account, and never throws.
 */
export async function claimRecentPurchase(
  env: Env,
  db: D1Database,
  user: UserRow,
  now: number = Date.now(),
  fetcher: Fetcher = fetch,
): Promise<SyncOutcome | 'throttled'> {
  if (!env.DODO_API_KEY) return 'skipped';
  if (user.billing_synced_at != null && now - user.billing_synced_at < CLAIM_THROTTLE_MS) return 'throttled';
  try {
    const since = encodeURIComponent(new Date(now - RECENT_PURCHASE_WINDOW_MS).toISOString());
    const mine = (item: Raw) => (item['metadata'] as Raw | undefined)?.['user_id'] === user.id;

    const subs = ((await getJson(env, `/subscriptions?created_at_gte=${since}&page_size=100`, fetcher))['items'] ?? []) as Raw[];
    for (const item of subs.filter(mine)) {
      const update = updateFromSubscription(env, parseSubscription(item), user, now);
      if (update && update.plan !== 'free') {
        await setUserPlan(db, user.id, update, now);
        return 'corrected';
      }
    }

    const payments = ((await getJson(env, `/payments?created_at_gte=${since}&status=succeeded&page_size=100`, fetcher))['items'] ?? []) as Raw[];
    for (const item of payments.filter(mine)) {
      const paymentId = text(item['payment_id']);
      if (!paymentId || ((item['subscription_ids'] as unknown[] | undefined)?.length ?? 0) > 0) continue;
      const payment = parsePayment(await getJson(env, `/payments/${encodeURIComponent(paymentId)}`, fetcher));
      const update = updateFromPayment(env, payment);
      if (update && update.plan !== 'free') {
        await setUserPlan(db, user.id, { ...update, paymentId }, now);
        return 'corrected';
      }
    }
    await markBillingSynced(db, user.id, now);
    return 'unchanged';
  } catch (error) {
    console.error('billing claim failed', error instanceof Error ? error.message : error);
    return 'error';
  }
}
