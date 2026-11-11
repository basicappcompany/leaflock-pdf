/**
 * Paid plans, sold through Dodo Payments as merchant of record.
 *
 * Dodo is the seller: it takes the payment, holds the card details and issues the
 * invoice (see terms.md §5). All we keep is which plan an account is on and when the
 * paid period ends, so nothing here ever touches payment details.
 *
 * Checkout is a plain redirect to Dodo's own hosted page, so the strict CSP needs no
 * exception: the browser never loads anything of theirs on our origin.
 */

import { launchPercentOff, offerOpen } from '../pricing';
import type { UserRow } from './db';

export type PlanKey = 'proMonthly' | 'proYearly' | 'proTenYear' | 'practiceYearly';

export const PLAN_KEYS: readonly PlanKey[] = ['proMonthly', 'proYearly', 'proTenYear', 'practiceYearly'];

export function isPlanKey(value: unknown): value is PlanKey {
  return typeof value === 'string' && (PLAN_KEYS as readonly string[]).includes(value);
}

/** Dodo's API host. Test mode is a separate host, not a flag on the request. */
export function apiBase(env: Env): string {
  return env.DODO_MODE === 'live' ? 'https://live.dodopayments.com' : 'https://test.dodopayments.com';
}

/** The Dodo product behind each plan we sell. */
export function productIdFor(env: Env, plan: PlanKey): string | undefined {
  const ids: Record<PlanKey, string | undefined> = {
    proMonthly: env.DODO_PRODUCT_PRO_MONTHLY,
    proYearly: env.DODO_PRODUCT_PRO_YEARLY,
    proTenYear: env.DODO_PRODUCT_LIFETIME,
    practiceYearly: env.DODO_PRODUCT_PRACTICE_YEARLY,
  };
  return ids[plan];
}

/** Which plan a paid-for Dodo product grants. */
export function planForProduct(env: Env, productId: string | null): UserRow['plan'] | null {
  if (!productId) return null;
  if (productId === env.DODO_PRODUCT_LIFETIME) return 'lifetime';
  if (productId === env.DODO_PRODUCT_PRACTICE_YEARLY || productId === env.DODO_PRODUCT_PRACTICE_YEARLY_LAUNCH) {
    return 'practice';
  }
  if (
    productId === env.DODO_PRODUCT_PRO_MONTHLY ||
    productId === env.DODO_PRODUCT_PRO_YEARLY ||
    productId === env.DODO_PRODUCT_PRO_YEARLY_LAUNCH
  ) {
    return 'pro';
  }
  return null;
}

/** How the plans rank against each other. A ten-year Pro term is Pro; Business is not sold here. */
const PLAN_RANK: Record<UserRow['plan'], number> = { free: 0, pro: 1, lifetime: 1, practice: 2, business: 3 };

/**
 * What a signed-in account may do when it asks to buy `plan`:
 *
 * - `ok`: start a new checkout.
 * - `owned`: it already has this plan or a higher one, so a second purchase would be a duplicate
 *   charge for nothing. Also the answer while a payment is failing: that is fixed in Dodo, not
 *   by buying again.
 * - `upgrade`: it has a live Pro subscription and wants Practice, which is a change of plan on
 *   that subscription (`upgradePractice` in functions/api/billing/upgrade.ts), not a second one.
 *
 * A ten-year Pro holder has no subscription to change, so Practice is a fresh checkout for them
 * (no credit for the Pro term; decided 12 November 2026). A cancelled plan may be bought again.
 */
export function purchaseDecision(
  user: Pick<UserRow, 'plan' | 'plan_status' | 'current_period_end' | 'subscription_id'>,
  plan: PlanKey,
  now: number = Date.now(),
): 'ok' | 'owned' | 'upgrade' {
  const current = effectivePlan(user, now);
  if (current === 'free') return 'ok';

  const wanted = plan === 'practiceYearly' ? 2 : 1;
  const have = PLAN_RANK[current];
  if (wanted < have) return 'owned';
  if (user.plan_status === 'past_due') return 'owned';
  if (user.plan_status === 'cancelled') return 'ok';
  if (wanted === have) return 'owned';
  if (current === 'pro' && user.subscription_id && user.plan_status === 'active') return 'upgrade';
  return 'ok';
}

/**
 * What to ask Dodo for when a Pro subscriber upgrades to Practice. During the launch offer the
 * first year carries the upgrade code (50% off, one billing cycle); afterwards it is the
 * standard price. Undefined when something needed is missing, so the route answers 503 rather
 * than charging the full price under an advertised discount.
 */
export function upgradeFor(env: Env, now: number = Date.now()): { productId: string; discountCodes?: string[] } | undefined {
  const productId = env.DODO_PRODUCT_PRACTICE_YEARLY;
  if (!productId) return undefined;
  if (!offerOpen(now)) return { productId };
  const code = env.DODO_DISCOUNT_PRACTICE_UPGRADE;
  return code ? { productId, discountCodes: [code] } : undefined;
}

/** When the first paid year of a launch-offer yearly plan ends and the standard price takes over. */
const FIRST_TERM_ENDS_AT = Date.UTC(2028, 0, 1);
const DAY_MS = 24 * 60 * 60 * 1000;

/** What to ask Dodo for when someone buys a plan. */
export interface CheckoutRequest {
  productId: string;
  /** Pre-applied discount codes. */
  discountCodes?: string[];
  /** Overrides the product's trial length for this one purchase. */
  trialPeriodDays?: number;
}

/**
 * How a plan is sold right now.
 *
 * After the launch offer closes every plan is its standard product at its standard price.
 * Before that, the buyer pays the launch price at checkout and the paid term runs from
 * 1 January 2027 (src/lib/pricing.ts):
 *
 * - The yearly plans use a launch product whose *trial amount* is the discounted price: Dodo
 *   charges that at checkout and bills the standard price at the first renewal. The trial
 *   length is set per purchase so that renewal lands on 1 January 2028, whatever day they buy.
 * - The ten-year term is a one-off payment, so it is the standard product with a percentage
 *   discount code pre-applied.
 *
 * Returns undefined when a piece of that configuration is missing. Answering 503 is the
 * point: falling back to the standard price would charge more than the page advertised.
 */
export function checkoutFor(env: Env, plan: PlanKey, now: number = Date.now()): CheckoutRequest | undefined {
  const standard = productIdFor(env, plan);
  if (!offerOpen(now) || launchPercentOff[plan] === 0) return standard ? { productId: standard } : undefined;

  if (plan === 'proTenYear') {
    const code = env.DODO_DISCOUNT_TEN_YEAR;
    return standard && code ? { productId: standard, discountCodes: [code] } : undefined;
  }

  const launch = plan === 'proYearly' ? env.DODO_PRODUCT_PRO_YEARLY_LAUNCH : env.DODO_PRODUCT_PRACTICE_YEARLY_LAUNCH;
  if (!launch) return undefined;
  return { productId: launch, trialPeriodDays: Math.max(1, Math.ceil((FIRST_TERM_ENDS_AT - now) / DAY_MS)) };
}

/**
 * The plan an account actually has right now.
 *
 * A cancelled subscription keeps its plan until the period already paid for runs out,
 * which is what terms.md §5 promises. The lifetime plan has no period end at all.
 */
export function effectivePlan(user: Pick<UserRow, 'plan' | 'plan_status' | 'current_period_end'>, now = Date.now()): UserRow['plan'] {
  // Practice is a yearly subscription, so it falls through to the expiry checks below
  // with Pro. Only free (nothing to expire) and business (licensed, not metered) skip them.
  if (user.plan === 'free' || user.plan === 'business') return user.plan;
  if (user.plan_status === 'expired') return 'free';
  if (user.current_period_end !== null && user.current_period_end <= now) return 'free';
  return user.plan;
}

function base64ToBytes(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** How far out of date a delivery may be before it's treated as a replay. */
const MAX_WEBHOOK_AGE_MS = 5 * 60 * 1000;

/**
 * Checks a webhook really came from Dodo, following the Standard Webhooks spec:
 * HMAC-SHA256 over `id.timestamp.body`, keyed by the secret after its `whsec_` prefix
 * is removed and the rest base64-decoded.
 */
export async function verifyWebhook(args: {
  secret: string;
  id: string | null;
  timestamp: string | null;
  signatureHeader: string | null;
  body: string;
  now?: number;
}): Promise<boolean> {
  const { secret, id, timestamp, signatureHeader, body } = args;
  if (!id || !timestamp || !signatureHeader) return false;

  const sentAtSeconds = Number(timestamp);
  if (!Number.isFinite(sentAtSeconds)) return false;
  const now = args.now ?? Date.now();
  if (Math.abs(now - sentAtSeconds * 1000) > MAX_WEBHOOK_AGE_MS) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    base64ToBytes(secret.replace(/^whsec_/, '')),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signed = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${id}.${timestamp}.${body}`));
  const expected = bytesToBase64(new Uint8Array(signed));

  // The header holds one or more space-separated `v1,<signature>` entries.
  return signatureHeader
    .split(' ')
    .some((entry) => entry.startsWith('v1,') && timingSafeEqual(entry.slice(3), expected));
}
