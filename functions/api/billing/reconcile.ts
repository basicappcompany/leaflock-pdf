/**
 * Cloudflare Pages Function: the scheduled sweep that re-reads paid accounts from Dodo.
 *
 * Called every few hours by the leaflock-billing-reconcile Worker (workers/billing-reconcile) with a bearer token. It takes the
 * accounts whose billing was read longest ago and repairs any that disagree with Dodo, so a webhook that
 * was lost or reordered is corrected even for someone who never visits again.
 *
 *   POST /api/billing/reconcile   Authorization: Bearer <RECONCILE_TOKEN>
 *     200 { checked, corrected, errors }
 *     401 wrong or missing token, 404 when no token is configured (the feature is off)
 */

import { timingSafeEqual } from '../../../src/lib/server/billing';
import { listStaleBillingUsers } from '../../../src/lib/server/db';
import { reconcileUser, RESYNC_AFTER_MS } from '../../../src/lib/server/dodoSync';

/** Accounts per call: each costs one request to Dodo, and a Pages Function has a small request budget. */
const BATCH = 20;
/** Slightly under the visit trigger's window, so an account read just before a sweep is not skipped for a whole interval. */
const SWEEP_STALE_MS = RESYNC_AFTER_MS - 60 * 60 * 1000;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.RECONCILE_TOKEN) return new Response(null, { status: 404 });

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token || !timingSafeEqual(token, env.RECONCILE_TOKEN)) return new Response(null, { status: 401 });

  const now = Date.now();
  const users = await listStaleBillingUsers(env.DB, now - SWEEP_STALE_MS, BATCH);
  let corrected = 0;
  let errors = 0;
  for (const user of users) {
    const outcome = await reconcileUser(env, env.DB, user, now);
    if (outcome === 'corrected') corrected += 1;
    if (outcome === 'error') errors += 1;
  }

  return new Response(JSON.stringify({ checked: users.length, corrected, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
