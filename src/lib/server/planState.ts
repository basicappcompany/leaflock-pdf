/**
 * What Dodo says about a subscription or a payment, turned into the plan we store.
 *
 * Dodo is the source of truth for who has paid; our `users` row is a copy kept in step by webhooks
 * (functions/api/billing/webhook.ts) and repaired by re-reading Dodo (src/lib/server/dodoSync.ts).
 * Both paths go through the functions here, so they cannot disagree about what a status means.
 * Pure: no network, no database.
 */

import { planForProduct } from './billing';
import type { PlanUpdate, UserRow } from './db';

/** The Dodo subscription statuses (GET /subscriptions/{id}). */
export type DodoStatus = 'pending' | 'active' | 'on_hold' | 'paused' | 'cancelled' | 'failed' | 'expired' | 'past_due';

export interface DodoSubscriptionState {
  status: string | undefined;
  productId: string | null;
  /** End of the paid period, as Dodo reports it. */
  nextBillingDate: string | null | undefined;
  customerId: string | null;
  subscriptionId: string | null;
}

const KNOWN_STATUSES = new Set<string>(['pending', 'active', 'on_hold', 'paused', 'cancelled', 'failed', 'expired', 'past_due']);

/**
 * The subscription status a webhook is reporting. Dodo sends the latest state with every delivery, so a
 * retried old event carries today's status: the payload's own status is used when it is one we know, and
 * the event name only when it is absent. Otherwise an old `subscription.active` retried after a
 * cancellation would grant the plan back.
 */
export function resolveStatus(type: string, payloadStatus: string | undefined): string | undefined {
  if (type.startsWith('subscription.') && payloadStatus && KNOWN_STATUSES.has(payloadStatus)) return payloadStatus;
  return statusForEvent(type, payloadStatus);
}

/** What a subscription event name means for the status, when its payload does not say. */
export function statusForEvent(type: string, payloadStatus: string | undefined): string | undefined {
  switch (type) {
    case 'subscription.active':
    case 'subscription.renewed':
    case 'subscription.unpaused':
    case 'subscription.plan_changed':
      return 'active';
    case 'subscription.past_due':
      return 'past_due';
    case 'subscription.cancelled':
      return 'cancelled';
    case 'subscription.paused':
      return 'paused';
    case 'subscription.expired':
      return 'expired';
    case 'subscription.on_hold':
      return 'on_hold';
    case 'subscription.failed':
      return 'failed';
    case 'subscription.updated':
      return payloadStatus;
    default:
      return undefined;
  }
}

function periodEnd(nextBillingDate: string | null | undefined): number | null {
  const parsed = nextBillingDate ? Date.parse(nextBillingDate) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * The plan update a subscription's state calls for, or null when it should change nothing.
 *
 * - `active`: the plan the product grants, paid through the next billing date.
 * - `past_due`: a renewal failed and Dodo's grace period is open, so access continues.
 * - `cancelled`: ends at the period already paid for (terms.md §5). Without a future end date there is
 *   nothing paid left, so no plan is granted: an old cancelled subscription must not grant access.
 * - `paused`, `on_hold`, `expired`, `failed`: no access. A paused plan comes back on `active`.
 * - `pending` and anything unrecognised: the sale has not completed; leave the account as it is.
 *
 * An unrecognised product on a state that grants access throws: granting a tier by default would hand
 * Pro to a Practice buyer, and a thrown delivery is retried once the configuration is fixed.
 */
export function updateFromSubscription(
  env: Env,
  sub: DodoSubscriptionState,
  user: Pick<UserRow, 'plan' | 'current_period_end'>,
  now: number = Date.now(),
): PlanUpdate | null {
  const base = { dodoCustomerId: sub.customerId, subscriptionId: sub.subscriptionId };
  const end = periodEnd(sub.nextBillingDate);

  switch (sub.status) {
    case 'active': {
      const plan = planForProduct(env, sub.productId);
      if (!plan) throw new Error(`unrecognised product ${sub.productId ?? '(none)'} on an active subscription`);
      return { plan, planStatus: 'active', currentPeriodEnd: end, ...base };
    }
    case 'past_due': {
      const plan = planForProduct(env, sub.productId) ?? (user.plan === 'free' ? null : user.plan);
      if (!plan) throw new Error(`unrecognised product ${sub.productId ?? '(none)'} on a past-due subscription`);
      return { plan, planStatus: 'past_due', currentPeriodEnd: end ?? user.current_period_end, ...base };
    }
    case 'cancelled': {
      const until = end ?? user.current_period_end;
      if (until === null || until <= now) return { plan: 'free', planStatus: 'expired', currentPeriodEnd: null, ...base };
      const plan = planForProduct(env, sub.productId) ?? (user.plan === 'free' ? null : user.plan);
      if (!plan) throw new Error(`unrecognised product ${sub.productId ?? '(none)'} on a cancelled subscription`);
      return { plan, planStatus: 'cancelled', currentPeriodEnd: until, ...base };
    }
    case 'paused':
    case 'on_hold':
    case 'expired':
    case 'failed':
      return { plan: 'free', planStatus: 'expired', currentPeriodEnd: null, ...base };
    default:
      return null;
  }
}

export interface DodoPaymentState {
  paymentId: string | null;
  status: string | undefined;
  productId: string | null;
  customerId: string | null;
  refundStatus: string | null | undefined;
  disputeStatus: string | null | undefined;
}

/** A refund of the whole payment, or a dispute decided against us, takes the plan back. A partial refund does not. */
export function paymentIsReversed(payment: Pick<DodoPaymentState, 'refundStatus' | 'disputeStatus'>): boolean {
  return payment.refundStatus === 'full' || payment.disputeStatus === 'dispute_lost';
}

/**
 * The plan update the one-off ten-year purchase calls for. Null for a payment that is not that product,
 * or one that has not succeeded (a subscription's own payments are handled by the subscription).
 */
export function updateFromPayment(env: Env, payment: DodoPaymentState): PlanUpdate | null {
  if (planForProduct(env, payment.productId) !== 'lifetime') return null;
  if (paymentIsReversed(payment)) {
    return { plan: 'free', planStatus: 'expired', currentPeriodEnd: null, dodoCustomerId: payment.customerId, subscriptionId: null };
  }
  if (payment.status !== 'succeeded') return null;
  return { plan: 'lifetime', planStatus: 'active', currentPeriodEnd: null, dodoCustomerId: payment.customerId, subscriptionId: null };
}

/**
 * Whether an event is newer than the last thing applied to the account. Dodo says events can arrive out
 * of order and to order them by their timestamp; an event with no usable time is applied, since refusing it
 * could lose a real change.
 */
export function isNewerThan(lastAppliedAt: number | null | undefined, eventAt: number | null): boolean {
  // `undefined` is a database that has not had migration 0008 yet: nothing recorded, so nothing to compare.
  if (eventAt === null || lastAppliedAt == null) return true;
  return eventAt >= lastAppliedAt;
}
