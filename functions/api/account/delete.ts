/**
 * Cloudflare Pages Function: permanently erases the signed-in account.
 *
 * Two guards. The visitor has to type their own address back, because this cannot
 * be undone; and an account with a live recurring subscription is refused, since
 * deleting here would not stop Dodo charging them — they have to cancel first.
 */

import { deleteAccount, getUserById } from '../../../src/lib/server/db';
import {
  clearSessionCookieHeader,
  clearSignedInHintCookieHeader,
  readSessionFromRequest,
} from '../../../src/lib/server/session';

const MAX_BODY = 512;

function problem(reason: string, status: number): Response {
  return new Response(JSON.stringify({ error: reason }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return problem('bad_request', 400);
  }

  const confirm = (parsed as Record<string, unknown> | null)?.['confirm'];
  if (typeof confirm !== 'string' || confirm.trim().toLowerCase() !== session.email) {
    return problem('confirm_mismatch', 400);
  }

  const user = await getUserById(env.DB, session.userId);
  if (!user) return new Response(null, { status: 404 });

  // A live subscription keeps billing at Dodo whatever we do here.
  if (user.subscription_id && (user.plan_status === 'active' || user.plan_status === 'past_due')) {
    return problem('subscription_active', 409);
  }

  await deleteAccount(env.DB, user.id, user.email);

  const response = new Response(null, { status: 204 });
  response.headers.append('Set-Cookie', clearSessionCookieHeader());
  response.headers.append('Set-Cookie', clearSignedInHintCookieHeader());
  return response;
}
