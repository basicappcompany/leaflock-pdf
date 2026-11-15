/**
 * Cloudflare Pages Function: receives Dodo Payments webhooks and keeps each account's
 * plan in step with what was actually paid for.
 *
 * Dodo is the source of truth for who has paid, and this endpoint is the fast path that mirrors it into
 * our database; `src/lib/server/dodoSync.ts` repairs the mirror from Dodo's API when a delivery is missed
 * or reordered. The client is never trusted for any of it. Deliveries are verified (Standard Webhooks)
 * and de-duplicated, because Dodo retries until it gets a 2xx.
 */

import { effectivePlan, verifyWebhook } from '../../../src/lib/server/billing';
import {
  forgetWebhook,
  getUserByEmail,
  getUserById,
  getUserByPayment,
  getUserBySubscription,
  recordWebhookOnce,
  setUserPlan,
  type UserRow,
} from '../../../src/lib/server/db';
import { parsePayment, reconcileUser } from '../../../src/lib/server/dodoSync';
import { isNewerThan, resolveStatus, updateFromPayment, updateFromSubscription } from '../../../src/lib/server/planState';

const MAX_BODY = 64 * 1024;

interface WebhookPayload {
  type: string;
  /** When the event happened, per Dodo (ISO 8601). */
  timestamp?: string;
  data?: {
    subscription_id?: string;
    payment_id?: string;
    product_id?: string;
    status?: string;
    next_billing_date?: string;
    customer?: { email?: string; customer_id?: string };
    metadata?: Record<string, unknown>;
    product_cart?: { product_id?: string }[];
  };
}

type Data = NonNullable<WebhookPayload['data']>;

/** Finds the account a delivery is about: by the id we sent at checkout, then by subscription, then by email. */
async function findUser(db: D1Database, data: Data): Promise<UserRow | null> {
  const userId = data.metadata?.['user_id'];
  if (typeof userId === 'string') {
    const byId = await getUserById(db, userId);
    if (byId) return byId;
  }
  if (data.subscription_id) {
    const bySubscription = await getUserBySubscription(db, data.subscription_id);
    if (bySubscription) return bySubscription;
  }
  const email = data.customer?.email;
  return email ? getUserByEmail(db, email.toLowerCase()) : null;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  if (!env.DODO_WEBHOOK_SECRET) return new Response(null, { status: 503 });

  const body = await request.text();
  if (body.length > MAX_BODY) return new Response(null, { status: 413 });

  const id = request.headers.get('webhook-id');
  const verified = await verifyWebhook({
    secret: env.DODO_WEBHOOK_SECRET,
    id,
    timestamp: request.headers.get('webhook-timestamp'),
    signatureHeader: request.headers.get('webhook-signature'),
    body,
  });
  if (!verified || !id) return new Response(null, { status: 401 });

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(body) as WebhookPayload;
  } catch {
    return new Response(null, { status: 400 });
  }
  const data = payload.data;
  if (!data) return new Response(null, { status: 400 });

  const now = Date.now();
  // Retried deliveries are acknowledged, not applied twice.
  if (!(await recordWebhookOnce(env.DB, id, payload.type, now))) return new Response(null, { status: 204 });

  try {
    await applyDelivery(env, payload, data, now);
  } catch (error) {
    // The delivery is un-recorded and answered 5xx so Dodo retries it. Leaving it recorded
    // would make the retry look like a duplicate and a paid upgrade would be lost for good.
    console.error('dodo webhook failed', payload.type, error instanceof Error ? error.message : error);
    try {
      await forgetWebhook(env.DB, id);
    } catch (forgetError) {
      console.error('dodo webhook could not be released for retry', forgetError);
    }
    return new Response(null, { status: 500 });
  }
  return new Response(null, { status: 204 });
}

async function applyDelivery(env: Env, payload: WebhookPayload, data: Data, now: number): Promise<void> {
  const user = (data.payment_id ? await getUserByPayment(env.DB, data.payment_id) : null) ?? (await findUser(env.DB, data));
  if (!user) {
    // Nothing to attach this to. 204 so Dodo stops retrying a delivery we can never use.
    console.error('dodo webhook for unknown account', payload.type);
    return;
  }

  const eventAt = payload.timestamp ? Date.parse(payload.timestamp) : Number.NaN;
  const at = Number.isFinite(eventAt) ? eventAt : null;
  const customerId = data.customer?.customer_id ?? null;
  const subscriptionId = data.subscription_id ?? null;

  if (payload.type.startsWith('subscription.')) {
    // Dodo may deliver events out of order; one older than what is already applied is acknowledged and dropped.
    if (!isNewerThan(user.billing_event_at, at)) {
      console.log(JSON.stringify({ type: 'billing', event: payload.type, ignored: 'older than the last applied event' }));
      return;
    }
    const update = updateFromSubscription(
      env,
      {
        status: resolveStatus(payload.type, data.status),
        productId: data.product_id ?? null,
        nextBillingDate: data.next_billing_date,
        customerId,
        subscriptionId,
      },
      user,
      now,
    );
    // A subscription event that changes nothing (a payment-method update, a pending sale) is recorded only.
    if (update) await setUserPlan(env.DB, user.id, { ...update, eventAt: at }, now);
  } else if (payload.type === 'payment.succeeded') {
    // One-off purchase: the ten-year plan. A subscription's own payments are handled by its subscription events.
    const update = updateFromPayment(env, parsePayment(data as unknown as Record<string, unknown>));
    if (update && isNewerThan(user.billing_event_at, at)) {
      await setUserPlan(env.DB, user.id, { ...update, paymentId: data.payment_id ?? null, eventAt: at }, now);
    }
  } else if ((payload.type === 'refund.succeeded' || payload.type === 'dispute.lost') && (user.subscription_id || user.dodo_payment_id)) {
    // The payload's shape is not what decides this: Dodo is asked what the payment's state is now. A
    // failure to ask is thrown so the delivery is retried, rather than a reversed purchase keeping its plan.
    const outcome = await reconcileUser(env, env.DB, user, now);
    if (outcome === 'error' || outcome === 'skipped') throw new Error(`could not re-check billing after ${payload.type} (${outcome})`);
  }
  // Everything else is recorded but changes nothing.

  const updated = await getUserById(env.DB, user.id);
  console.log(
    JSON.stringify({
      type: 'billing',
      event: payload.type,
      plan: updated ? effectivePlan(updated, now) : null,
      status: updated?.plan_status ?? null,
    }),
  );
}
