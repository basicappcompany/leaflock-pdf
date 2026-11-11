/**
 * The two questions a Pro subscriber's upgrade needs answered by Dodo before and after it is
 * requested. Both are read from Dodo on demand rather than mirrored in our database, so there is no
 * second copy to drift or to clear: Dodo is the one place that knows whether a charge has settled.
 *
 * Why these exist (found 12 November 2026, testing the first real upgrade): the plan change charges
 * the card already on the subscription, with no checkout page, and on an Indian card that charge
 * can sit in `processing` for up to about two days. The plan only changes when it settles. Until
 * then a second request fails at Dodo, so the page must know "a charge is in flight" and say so
 * instead of offering the same button again. And because nothing asks the customer for payment, they
 * are shown the exact amount and confirm it first.
 */

import { apiBase } from './billing';

type Fetcher = typeof fetch;

/** A charge still processing after this long is not an upgrade in flight any more. */
const PENDING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export interface UpgradeQuote {
  /** The charge in the smallest unit of `currency` (cents, paise), tax included. */
  amount: number;
  currency: string;
  /** When the plan next renews after the change, as an ISO timestamp. */
  renewsOn: string | null;
}

const headers = (env: Env) => ({ Authorization: `Bearer ${env.DODO_API_KEY}`, 'Content-Type': 'application/json' });

/** Whether this subscription has a recent charge that has not settled. */
export async function hasProcessingPayment(
  env: Env,
  subscriptionId: string,
  now: number = Date.now(),
  fetcher: Fetcher = fetch,
): Promise<boolean> {
  const response = await fetcher(
    `${apiBase(env)}/payments?subscription_id=${encodeURIComponent(subscriptionId)}&page_size=10`,
    { headers: headers(env) },
  );
  if (!response.ok) throw new Error(`payments ${response.status}`);
  const body = (await response.json()) as { items?: { status?: string; created_at?: string }[] };
  return (body.items ?? []).some(
    (payment) => payment.status === 'processing' && now - Date.parse(payment.created_at ?? '') < PENDING_WINDOW_MS,
  );
}

/** What changing plan would charge today, from Dodo's own preview. Null when Dodo cannot say. */
export async function quoteUpgrade(
  env: Env,
  subscriptionId: string,
  change: { productId: string; discountCodes?: string[] },
  fetcher: Fetcher = fetch,
): Promise<UpgradeQuote | null> {
  const response = await fetcher(`${apiBase(env)}/subscriptions/${encodeURIComponent(subscriptionId)}/change-plan/preview`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify({
      product_id: change.productId,
      quantity: 1,
      proration_billing_mode: 'difference_immediately',
      ...(change.discountCodes ? { discount_codes: change.discountCodes } : {}),
    }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    immediate_charge?: { summary?: { total_amount?: number; currency?: string } };
    new_plan?: { next_billing_date?: string };
  };
  const summary = body.immediate_charge?.summary;
  if (typeof summary?.total_amount !== 'number' || !summary.currency) return null;
  return { amount: summary.total_amount, currency: summary.currency, renewsOn: body.new_plan?.next_billing_date ?? null };
}
