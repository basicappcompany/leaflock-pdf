/**
 * Cloudflare Pages Function: finishes Google sign-in and opens a session.
 *
 * An account is identified by its email address, so signing in with Google lands on the
 * same account as a magic link sent to that address — but only when Google says it has
 * verified the address, otherwise an unverified Google account could claim someone else's.
 */

import { browserFamily } from '../../../../src/lib/errorReporting';
import {
  createUser,
  getUserByEmail,
  getUserByGoogleSub,
  linkGoogleAccount,
  recordLogin,
} from '../../../../src/lib/server/db';
import { GOOGLE_STATE_COOKIE, exchangeCode, googleConfigured } from '../../../../src/lib/server/google';
import { createSession, sessionSetCookieHeader, signedInHintCookieHeader } from '../../../../src/lib/server/session';

function readCookie(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === name) return part.slice(separator + 1).trim();
  }
  return undefined;
}

function failed(origin: string, reason: string): Response {
  const response = new Response(null, { status: 302, headers: { Location: `${origin}/login?error=${reason}` } });
  response.headers.append('Set-Cookie', `${GOOGLE_STATE_COOKIE}=; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return response;
}

/** The person pressed Cancel on Google's screen: back to the form with no error, since nothing went wrong. */
function cancelled(origin: string): Response {
  const response = new Response(null, { status: 302, headers: { Location: `${origin}/login` } });
  response.headers.append('Set-Cookie', `${GOOGLE_STATE_COOKIE}=; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return response;
}

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(request.url);
  const origin = url.origin;
  if (!googleConfigured(env)) return failed(origin, 'google_unavailable');

  if (url.searchParams.get('error') === 'access_denied') return cancelled(origin);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = readCookie(request.headers.get('cookie'), GOOGLE_STATE_COOKIE);
  if (!code || !state || !expectedState || state !== expectedState) return failed(origin, 'google_failed');

  const identity = await exchangeCode(env, origin, code);
  if (!identity) return failed(origin, 'google_failed');
  if (!identity.emailVerified) return failed(origin, 'google_unverified');

  const now = Date.now();
  let user = await getUserByGoogleSub(env.DB, identity.sub);
  if (!user) {
    // First time with Google: attach it to the account for that address, or make one.
    user = (await getUserByEmail(env.DB, identity.email)) ?? (await createUser(env.DB, identity.email, now));
    await linkGoogleAccount(env.DB, user.id, identity.sub);
  }
  if (user.status !== 'active') return failed(origin, 'google_failed');

  const browser = browserFamily(request.headers.get('user-agent') ?? '');
  await recordLogin(env.DB, { userId: user.id, method: 'google', browser, now });
  const cookieValue = await createSession(env.DB, user.id, browser, now);

  const response = new Response(null, { status: 302, headers: { Location: `${origin}/account` } });
  response.headers.append('Set-Cookie', sessionSetCookieHeader(cookieValue));
  response.headers.append('Set-Cookie', signedInHintCookieHeader(user.plan));
  response.headers.append('Set-Cookie', `${GOOGLE_STATE_COOKIE}=; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
  return response;
}
