/**
 * Cloudflare Pages Function: returns the signed-in user's email and plan, or null.
 *
 * Always 200, even when signed out: being signed out is the default state for nearly
 * every visitor (the header's AuthNavLink calls this on every page), and a 401 here
 * would make the browser log a console error on every single page load for them.
 *
 * The site is a static build with no SSR, so a client island can't read the session
 * cookie itself — this is what it calls on mount instead (see src/components/ui/useSession.ts).
 */

import {
  clearSignedInHintCookieHeader,
  readSessionFromRequest,
  signedInHintCookieHeader,
} from '../../../src/lib/server/session';

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  const body = session ? { email: session.email, plan: session.plan } : null;
  const response = new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  // Keeps the page-level hint in step with the plan (see signedInHintCookieHeader): a plan change shows
  // from the next page on, with no flash. A stale hint for a signed-out browser is cleared here too.
  response.headers.append('Set-Cookie', session ? signedInHintCookieHeader(session.plan) : clearSignedInHintCookieHeader());
  return response;
}
