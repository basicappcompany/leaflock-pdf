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
  if (productId === env.DODO_PRODUCT_PRACTICE_YEARLY) return 'practice';
  if (productId === env.DODO_PRODUCT_PRO_MONTHLY || productId === env.DODO_PRODUCT_PRO_YEARLY) return 'pro';
  return null;
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
