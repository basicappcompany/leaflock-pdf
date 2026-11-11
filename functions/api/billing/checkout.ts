/**
 * Cloudflare Pages Function: starts a purchase by creating a Dodo Payments checkout
 * session and handing back its hosted URL for the browser to go to.
 *
 * Nothing about the payment happens on our origin: no card field, no third-party
 * script, so the strict CSP is untouched. Dodo is the merchant of record (terms.md §5).
 */

import { apiBase, checkoutFor, isPlanKey } from '../../../src/lib/server/billing';
import { readSessionFromRequest } from '../../../src/lib/server/session';

const MAX_BODY = 256;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  // Checkout needs an account, so the webhook has something to attach the plan to.
  if (!session) return new Response(null, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const plan = (parsed as Record<string, unknown> | null)?.['plan'];
  if (!isPlanKey(plan)) return new Response(null, { status: 400 });

  const sale = checkoutFor(env, plan);
  if (!sale || !env.DODO_API_KEY) {
    // Paid plans aren't switched on yet: the products or key aren't configured.
    return new Response(JSON.stringify({ error: 'unavailable' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const origin = new URL(request.url).origin;
  const response = await fetch(`${apiBase(env)}/checkouts`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.DODO_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_cart: [{ product_id: sale.productId, quantity: 1 }],
      ...(sale.discountCodes ? { discount_codes: sale.discountCodes } : {}),
      ...(sale.trialPeriodDays ? { subscription_data: { trial_period_days: sale.trialPeriodDays } } : {}),
      customer: { email: session.email },
      return_url: `${origin}/account`,
      // How the webhook finds the account again; email alone isn't reliable.
      metadata: { user_id: session.userId },
    }),
  });

  if (!response.ok) {
    console.error('dodo checkout failed', response.status);
    return new Response(JSON.stringify({ error: 'checkout_failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const created = (await response.json()) as { checkout_url?: string | null };
  if (!created.checkout_url) {
    console.error('dodo checkout returned no url');
    return new Response(JSON.stringify({ error: 'checkout_failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ url: created.checkout_url }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
