/**
 * Cloudflare Pages Function: receives Dodo Payments webhooks and keeps each account's
 * plan in step with what was actually paid for.
 *
 * This endpoint is the only authority on who has a paid plan; the client is never
 * trusted for it. Deliveries are verified (Standard Webhooks) and de-duplicated,
 * because Dodo retries until it gets a 2xx.
 */

import { effectivePlan, planForProduct, verifyWebhook } from '../../../src/lib/server/billing';
import { getUserByEmail, getUserById, getUserBySubscription, recordWebhookOnce, setUserPlan, type UserRow } from '../../../src/lib/server/db';

const MAX_BODY = 64 * 1024;

interface WebhookPayload {
  type: string;
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

/** Finds the account a delivery is about: by the id we sent at checkout, then by subscription, then by email. */
async function findUser(db: D1Database, data: NonNullable<WebhookPayload['data']>): Promise<UserRow | null> {
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

function periodEnd(data: NonNullable<WebhookPayload['data']>): number | null {
  const parsed = data.next_billing_date ? Date.parse(data.next_billing_date) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
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

  const user = await findUser(env.DB, data);
  if (!user) {
    // Nothing to attach this to. 204 so Dodo stops retrying a delivery we can never use.
    console.error('dodo webhook for unknown account', payload.type);
    return new Response(null, { status: 204 });
  }

  const customerId = data.customer?.customer_id ?? null;
  const subscriptionId = data.subscription_id ?? null;

  switch (payload.type) {
    case 'subscription.active':
    case 'subscription.renewed':
    case 'subscription.unpaused':
    case 'subscription.plan_changed': {
      const plan = planForProduct(env, data.product_id ?? null) ?? 'pro';
      await setUserPlan(env.DB, user.id, {
        plan,
        planStatus: 'active',
        currentPeriodEnd: periodEnd(data),
        dodoCustomerId: customerId,
        subscriptionId,
      });
      break;
    }

    // Renewal failed but the grace period is open: access continues to the paid-for date.
    case 'subscription.past_due':
      await setUserPlan(env.DB, user.id, {
        plan: user.plan,
        planStatus: 'past_due',
        currentPeriodEnd: periodEnd(data) ?? user.current_period_end,
        dodoCustomerId: customerId,
        subscriptionId,
      });
      break;

    // Cancelled keeps the plan until the period already paid for runs out (terms.md §5).
    case 'subscription.cancelled':
    case 'subscription.paused':
      await setUserPlan(env.DB, user.id, {
        plan: user.plan,
        planStatus: 'cancelled',
        currentPeriodEnd: periodEnd(data) ?? user.current_period_end,
        dodoCustomerId: customerId,
        subscriptionId,
      });
      break;

    case 'subscription.expired':
    case 'subscription.on_hold':
    case 'subscription.failed':
      await setUserPlan(env.DB, user.id, {
        plan: 'free',
        planStatus: 'expired',
        currentPeriodEnd: null,
        dodoCustomerId: customerId,
        subscriptionId,
      });
      break;

    // One-off purchase: the founding lifetime plan. Subscriptions are handled above,
    // so only grant here when the product bought really is a one-time plan.
    case 'payment.succeeded': {
      const productId = data.product_id ?? data.product_cart?.[0]?.product_id ?? null;
      const plan = planForProduct(env, productId);
      if (plan === 'lifetime') {
        await setUserPlan(env.DB, user.id, {
          plan: 'lifetime',
          planStatus: 'active',
          currentPeriodEnd: null,
          dodoCustomerId: customerId,
          subscriptionId: null,
        });
      }
      break;
    }

    default:
      // Everything else is recorded but changes nothing.
      break;
  }

  const updated = await getUserById(env.DB, user.id);
  console.log(
    JSON.stringify({
      type: 'billing',
      event: payload.type,
      plan: updated ? effectivePlan(updated, now) : null,
      status: updated?.plan_status ?? null,
    }),
  );
  return new Response(null, { status: 204 });
}
