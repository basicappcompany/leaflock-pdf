/** Cloudflare Pages Function: sends the browser to Google to sign in. */

import { GOOGLE_STATE_COOKIE, authorizeUrl, googleConfigured } from '../../../../src/lib/server/google';

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const origin = new URL(request.url).origin;
  if (!googleConfigured(env)) {
    return new Response(null, { status: 302, headers: { Location: `${origin}/login?error=google_unavailable` } });
  }

  // Random value echoed back by Google, so a callback we didn't start is rejected.
  const bytes = new Uint8Array(new ArrayBuffer(16));
  crypto.getRandomValues(bytes);
  const state = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');

  const response = new Response(null, { status: 302, headers: { Location: authorizeUrl(env, origin, state) } });
  // Lax, not Strict: the browser arrives back from Google as a top-level navigation and
  // must still send this. Short-lived, since it only has to survive one sign-in.
  response.headers.append(
    'Set-Cookie',
    `${GOOGLE_STATE_COOKIE}=${state}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`,
  );
  return response;
}
