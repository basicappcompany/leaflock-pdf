/** Cloudflare Pages Function: ends the current session. */

import {
  clearSessionCookieHeader,
  clearSignedInHintCookieHeader,
  deleteSession,
  readSessionFromRequest,
} from '../../../src/lib/server/session';

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (session) await deleteSession(env.DB, session.sessionId);
  const response = new Response(null, { status: 204 });
  response.headers.append('Set-Cookie', clearSessionCookieHeader());
  response.headers.append('Set-Cookie', clearSignedInHintCookieHeader());
  return response;
}
