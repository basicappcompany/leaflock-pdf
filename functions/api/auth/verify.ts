/**
 * Cloudflare Pages Function: consumes a magic-link token, creates the account on
 * first login, opens a session, and redirects into /account.
 *
 * Two steps on purpose. The emailed link is a GET, and mail security scanners (Outlook Safe Links, Gmail and
 * corporate gateways) open every link in a message before the person does; a GET that signed in would have its
 * one-time token spent by the scanner, and the person would arrive to "expired". So the GET only shows a page with
 * a button, and the sign-in itself is a POST from that page, which no scanner submits.
 */

import { safeNext } from '../../../src/lib/safeNext';
import { browserFamily } from '../../../src/lib/errorReporting';
import { createUser, getUserByEmail, recordLogin } from '../../../src/lib/server/db';
import { verifyMagicLink } from '../../../src/lib/server/magicLink';
import { createSession, sessionSetCookieHeader, signedInHintCookieHeader } from '../../../src/lib/server/session';

const escapeHtml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Step one: a button, no side effects. Nothing here loads from another site, and the token goes nowhere but our POST. */
export async function onRequestGet({ request }: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token || token.length > 128) {
    return new Response(null, { status: 302, headers: { Location: `${url.origin}/login?error=invalid` } });
  }
  const next = safeNext(url.searchParams.get('next'));
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><title>Sign in to LeafLock PDF</title></head><body><main><h1>Sign in to LeafLock PDF</h1><p>Press the button to finish signing in. This link works once.</p><form method="post" action="/api/auth/verify"><input type="hidden" name="token" value="${escapeHtml(token)}">${next ? `<input type="hidden" name="next" value="${escapeHtml(next)}">` : ''}<button type="submit">Sign in</button></form></main></body></html>`;
  return new Response(page, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; form-action 'self'; frame-ancestors 'none'",
      // Not no-referrer: that makes browsers send "Origin: null" on this page's own form POST, and the
      // same-origin guard in _middleware.ts then refuses the sign-in with a 403. "origin" sends our origin
      // (never the token-bearing URL) and nothing at all to other sites.
      'Referrer-Policy': 'origin',
    },
  });
}

/** Step two: spends the token, creates the account on first login and opens the session. */
export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(request.url);
  const form = await request.formData().catch(() => null);
  const token = String(form?.get('token') ?? '');
  const next = safeNext(form?.get('next'));
  if (!token || token.length > 128) {
    return new Response(null, { status: 303, headers: { Location: `${url.origin}/login?error=invalid` } });
  }

  const email = await verifyMagicLink(env.DB, token);
  if (!email) {
    return new Response(null, { status: 303, headers: { Location: `${url.origin}/login?error=expired` } });
  }

  const now = Date.now();
  const user = (await getUserByEmail(env.DB, email)) ?? (await createUser(env.DB, email, now));
  const browser = browserFamily(request.headers.get('user-agent') ?? '');
  await recordLogin(env.DB, { userId: user.id, method: 'link', browser, now });

  const cookieValue = await createSession(env.DB, user.id, browser, now);

  const response = new Response(null, { status: 303, headers: { Location: `${url.origin}${next ?? '/account/'}` } });
  response.headers.append('Set-Cookie', sessionSetCookieHeader(cookieValue));
  response.headers.append('Set-Cookie', signedInHintCookieHeader(user.plan));
  return response;
}
