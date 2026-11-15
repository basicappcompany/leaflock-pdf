/**
 * Cloudflare Pages Function: "I just paid" — asks Dodo about this account's billing right now.
 *
 * The normal path is a webhook, which can be late or lost. When a buyer returns from checkout without a
 * plan, the account page calls this. It looks for the purchase in Dodo by the `user_id` we attached at
 * checkout and grants what it finds; for an account that already has a plan it re-reads that plan from Dodo.
 * Dodo's answer is what is applied, never anything the browser sends: the request has no body.
 *
 *   POST /api/billing/refresh
 *     200 { plan, outcome }   outcome: unchanged | corrected | skipped | throttled | error
 *     401 not signed in
 */

import { effectivePlan } from '../../../src/lib/server/billing';
import { getUserById } from '../../../src/lib/server/db';
import { claimRecentPurchase, reconcileUser } from '../../../src/lib/server/dodoSync';
import { readSessionFromRequest } from '../../../src/lib/server/session';

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const user = await getUserById(env.DB, session.userId);
  if (!user) return new Response(null, { status: 401 });

  const now = Date.now();
  const outcome =
    user.subscription_id || user.dodo_payment_id
      ? await reconcileUser(env, env.DB, user, now)
      : await claimRecentPurchase(env, env.DB, user, now);

  const fresh = (await getUserById(env.DB, user.id)) ?? user;
  return new Response(JSON.stringify({ plan: effectivePlan(fresh, now), outcome }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
