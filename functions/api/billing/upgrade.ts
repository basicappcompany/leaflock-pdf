/**
 * Cloudflare Pages Function: upgrades a Pro subscriber to Practice by changing the plan on the
 * subscription they already have, rather than starting a second one.
 *
 *   POST /api/billing/upgrade
 *     200  Dodo accepted the change; the account's plan follows when the webhook arrives
 *     401  not signed in
 *     409  nothing to upgrade (no live Pro subscription, or already on Practice)
 *     503  paid plans are not configured, or the launch upgrade code is missing
 *     502  Dodo refused or could not be reached
 *
 * The charge is the difference for what was already paid (`difference_immediately`), taken from
 * the card on the subscription, and `prevent_change` leaves the plan alone if that payment fails.
 * Probed against Dodo's change-plan preview on 12 November 2026: a Pro launch subscription
 * (paid $12) upgrading with the 50% code is charged $112.50 before tax. The billing cycle
 * restarts from the day of the change.
 */

import { apiBase, purchaseDecision, upgradeFor } from '../../../src/lib/server/billing';
import { getUserById } from '../../../src/lib/server/db';
import { readSessionFromRequest } from '../../../src/lib/server/session';

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const user = await getUserById(env.DB, session.userId);
  if (!user || !user.subscription_id || purchaseDecision(user, 'practiceYearly') !== 'upgrade') {
    return json(409, { error: 'nothing_to_upgrade' });
  }

  const change = upgradeFor(env);
  if (!change || !env.DODO_API_KEY) return json(503, { error: 'unavailable' });

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
    console.error('dodo change-plan failed', response.status);
    return json(502, { error: 'upgrade_failed' });
  }
  return json(200, { ok: true });
}
