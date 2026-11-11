/**
 * Cloudflare Pages Function: signs in with an email address and password.
 *
 * Accounts are still created by the magic link, which proves the address belongs to
 * whoever used it; a password is added later from the account page. That means there's
 * no sign-up form to abuse here, and "forgot my password" is simply a sign-in link.
 */

import { browserFamily } from '../../../src/lib/errorReporting';
import { getUserByEmail, recordLogin } from '../../../src/lib/server/db';
import { hashIp } from '../../../src/lib/server/ipHash';
import { verifyPassword } from '../../../src/lib/server/password';
import { checkAndIncrement } from '../../../src/lib/server/rateLimit';
import { createSession, sessionSetCookieHeader, signedInHintCookieHeader } from '../../../src/lib/server/session';

const MAX_BODY = 512;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const body = parsed as Record<string, unknown> | null;
  const email = typeof body?.['email'] === 'string' ? body['email'].trim().toLowerCase().slice(0, 254) : null;
  const password = typeof body?.['password'] === 'string' ? body['password'] : null;
  if (!email || !password) return new Response(null, { status: 400 });

  // Guessing passwords must be expensive for the attacker, not just for us: hashing is
  // deliberately slow, so rate limit before doing any of it.
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const ipHash = ip ? await hashIp(ip, env.SESSION_IP_SALT) : null;
  const perEmail = await checkAndIncrement(env.DB, `pw-email:${email}`, 10, 15 * 60);
  const perIp = ipHash ? await checkAndIncrement(env.DB, `pw-ip:${ipHash}`, 30, 15 * 60) : { allowed: true };
  if (!perEmail.allowed || !perIp.allowed) return new Response(null, { status: 429 });

  const user = await getUserByEmail(env.DB, email);
  const ok = await verifyPassword(password, user?.password_hash ?? null);
  // One answer for "no such account", "no password set" and "wrong password", so this
  // can't be used to find out who has an account.
  if (!ok || !user || user.status !== 'active') return new Response(null, { status: 401 });

  const now = Date.now();
  const browser = browserFamily(request.headers.get('user-agent') ?? '');
  await recordLogin(env.DB, { userId: user.id, method: 'password', browser, now });
  const cookieValue = await createSession(env.DB, user.id, browser, now);

  const response = new Response(null, { status: 204 });
  response.headers.append('Set-Cookie', sessionSetCookieHeader(cookieValue));
  response.headers.append('Set-Cookie', signedInHintCookieHeader(user.plan));
  return response;
}
