/**
 * Cloudflare Pages Function: consumes a magic-link token, creates the account on
 * first login, opens a session, and redirects into /account.
 */

import { browserFamily } from '../../../src/lib/errorReporting';
import { createUser, getUserByEmail, recordLogin } from '../../../src/lib/server/db';
import { verifyMagicLink } from '../../../src/lib/server/magicLink';
import { createSession, sessionSetCookieHeader, signedInHintCookieHeader } from '../../../src/lib/server/session';

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token || token.length > 128) {
    return new Response(null, { status: 302, headers: { Location: `${url.origin}/login?error=invalid` } });
  }

  const email = await verifyMagicLink(env.DB, token);
  if (!email) {
    return new Response(null, { status: 302, headers: { Location: `${url.origin}/login?error=expired` } });
  }

  const now = Date.now();
  const user = (await getUserByEmail(env.DB, email)) ?? (await createUser(env.DB, email, now));
  const browser = browserFamily(request.headers.get('user-agent') ?? '');
  await recordLogin(env.DB, { userId: user.id, method: 'link', browser, now });

  const cookieValue = await createSession(env.DB, user.id, browser, now);

  const response = new Response(null, { status: 302, headers: { Location: `${url.origin}/account` } });
  response.headers.append('Set-Cookie', sessionSetCookieHeader(cookieValue));
  response.headers.append('Set-Cookie', signedInHintCookieHeader());
  return response;
}
