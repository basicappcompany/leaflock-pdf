/**
 * Cloudflare Pages Function: upgrades a Pro subscriber to Practice by changing the plan on the
 * subscription they already have, rather than starting a second one.
 *
 *   GET  /api/billing/upgrade   what the page should offer this member right now
 *     200 { state: 'none' }                      nothing to upgrade (free, ten-year, Practice, ...)
 *     200 { state: 'pending' }                   an upgrade charge is still being confirmed by the bank
 *     200 { state: 'ready', amount, currency, renewsOn }   what confirming would charge, from Dodo
 *     200 { state: 'unavailable' }               configured wrongly or Dodo could not say
 *     401 not signed in
 *
 *   POST /api/billing/upgrade   confirm and charge
 *     200 Dodo accepted the change; the plan follows when the payment settles and the webhook arrives
 *     401 not signed in, 409 { error: 'pending' | 'nothing_to_upgrade' }, 503 not configured, 502 Dodo refused
 *
 * The charge is the difference for what was already paid (`difference_immediately`), taken from the card on
 * the subscription, and `prevent_change` leaves the plan alone if that payment fails. Because no checkout
 * page asks for payment, the page shows the amount from the GET and asks the member to confirm first.
 * Probed against Dodo's preview on 12 November 2026: a Pro launch subscription (paid $12) upgrading with
 * the 50% code is charged $112.50 before tax; the billing cycle restarts from the day of the change.
 */

import { apiBase, purchaseDecision, upgradeFor } from '../../../src/lib/server/billing';
import { getUserById } from '../../../src/lib/server/db';
import { hasProcessingPayment, quoteUpgrade } from '../../../src/lib/server/dodoUpgrade';
import { readSessionFromRequest } from '../../../src/lib/server/session';

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

type Env_ = { request: Request; env: Env };

export async function onRequestGet({ request, env }: Env_): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const user = await getUserById(env.DB, session.userId);
  const change = upgradeFor(env);
  if (!user?.subscription_id) return json(200, { state: 'none' });

  try {
    // A charge in flight means the plan has not changed yet but will: the plan is still Pro, so the
    // decision below still says 'upgrade'. Check it first, so the page can say so.
    if (user.plan === 'pro' && (await hasProcessingPayment(env, user.subscription_id))) return json(200, { state: 'pending' });
    if (purchaseDecision(user, 'practiceYearly') !== 'upgrade') return json(200, { state: 'none' });
    if (!change || !env.DODO_API_KEY) return json(200, { state: 'unavailable' });
    const quote = await quoteUpgrade(env, user.subscription_id, change);
    return quote ? json(200, { state: 'ready', ...quote }) : json(200, { state: 'unavailable' });
  } catch (error) {
    console.error('upgrade state failed', error instanceof Error ? error.message : error);
    return json(200, { state: 'unavailable' });
  }
}

export async function onRequestPost({ request, env }: Env_): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const user = await getUserById(env.DB, session.userId);
  if (!user || !user.subscription_id) return json(409, { error: 'nothing_to_upgrade' });

  const change = upgradeFor(env);
  if (!change || !env.DODO_API_KEY) return json(503, { error: 'unavailable' });

  try {
    if (user.plan === 'pro' && (await hasProcessingPayment(env, user.subscription_id))) return json(409, { error: 'pending' });
  } catch {
    return json(502, { error: 'upgrade_failed' });
  }
  if (purchaseDecision(user, 'practiceYearly') !== 'upgrade') return json(409, { error: 'nothing_to_upgrade' });

  const response = await fetch(`${apiBase(env)}/subscriptions/${encodeURIComponent(user.subscription_id)}/change-plan`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.DODO_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: change.productId,
      quantity: 1,
      proration_billing_mode: 'difference_immediately',
      on_payment_failure: 'prevent_change',
      ...(change.discountCodes ? { discount_codes: change.discountCodes } : {}),
    }),
  });

  if (!response.ok) {
    const detail = (await response.text().catch(() => '')).slice(0, 200);
    console.error('dodo change-plan failed', response.status, detail);
    // Dodo refuses a second charge while one is processing; to the member that is "still pending".
    if (/not successful yet|processing|pending/i.test(detail)) return json(409, { error: 'pending' });
    return json(502, { error: 'upgrade_failed' });
  }
  return json(200, { ok: true });
}
