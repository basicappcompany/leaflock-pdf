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

/**
 * The one stylesheet this page uses, inline because the page's own policy allows no outside styles. It is allowed by
 * its hash (computed below), not by 'unsafe-inline', so nothing else can inject CSS. Colours mirror the site's Leaf
 * skin in light and dark; this page sits outside the site's layout, so it cannot read the site's variables.
 */
const PAGE_STYLE =
  ':root{color-scheme:light dark;--bg:#f8f8f6;--card:#fff;--text:#171a17;--muted:#5b625b;--line:#e3e5df;--accent:#15803d;--accent-hover:#166534;--on-accent:#fff}' +
  '@media(prefers-color-scheme:dark){:root{--bg:#0c0e0c;--card:#141714;--text:#eceeeb;--muted:#98a198;--line:#252a25;--accent:#34d27b;--accent-hover:#5be39a;--on-accent:#0c0e0c}}' +
  "*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}" +
  'main{width:100%;max-width:26rem;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:32px 24px;text-align:center}' +
  '.logo{display:block;margin:0 auto 16px}h1{margin:0 0 8px;font-size:1.5rem;line-height:1.25}p{margin:0 0 24px;color:var(--muted)}' +
  'button{width:100%;padding:12px 16px;border:0;border-radius:12px;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:600;cursor:pointer}' +
  'button:hover{background:var(--accent-hover)}button:focus-visible{outline:3px solid var(--accent);outline-offset:3px}.fine{margin:16px 0 0;font-size:.875rem}';

async function styleHash(): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(PAGE_STYLE));
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return `'sha256-${btoa(binary)}'`;
}

const LOGO =
  '<svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="48" height="48" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="#15803d"/><path fill="#fff" d="M9 8h3a11 11 0 0 1 11 11v4h-3A11 11 0 0 1 9 12z"/></svg>';

/**
 * Step one: a single button, no side effects. Nothing here loads from another site, and the token goes nowhere but our
 * POST. It is styled and worded as the last step of signing in, since it is the page people see right after the
 * email; a bare unstyled form read as a second, unrelated sign-in.
 */
export async function onRequestGet({ request }: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token || token.length > 128) {
    return new Response(null, { status: 302, headers: { Location: `${url.origin}/login?error=invalid` } });
  }
  const next = safeNext(url.searchParams.get('next'));
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><title>Finish signing in | LeafLock PDF</title><style>${PAGE_STYLE}</style></head><body><main>${LOGO}<h1>You&rsquo;re almost in</h1><p>Your email link worked. One tap to finish signing in to LeafLock PDF.</p><form method="post" action="/api/auth/verify"><input type="hidden" name="token" value="${escapeHtml(token)}">${next ? `<input type="hidden" name="next" value="${escapeHtml(next)}">` : ''}<button type="submit">Finish signing in</button></form><p class="fine">This link works once. Your files never leave your device.</p></main></body></html>`;
  return new Response(page, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': `default-src 'none'; style-src ${await styleHash()}; form-action 'self'; frame-ancestors 'none'`,
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
