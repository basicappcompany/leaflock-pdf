/**
 * Cloudflare Pages Function: the signed-in visitor's starred tools.
 *
 *   GET  /api/starred   -> { tools: string[], account: string }, newest first;
 *                          a null body when signed out (like /api/auth/me, so a signed-out
 *                          page view logs no console error)
 *   PUT  /api/starred   { tools: string[] } replaces the whole list
 *
 * Replace-the-set rather than add and remove one: the browser reconciles with what is stored
 * first (src/lib/starred.ts) and sends the result, so the endpoint has no ordering or
 * conflict logic of its own to get wrong.
 *
 * Privacy: tool ids and their order. Nothing about any file, ever. The cookie is SameSite=Lax,
 * which already stops another site from sending a PUT as the visitor; requiring a JSON
 * content type on top means a plain cross-site form cannot reach it either.
 *
 * A failure (including the table not existing yet on a database that has not had migration
 * 0006 applied) is a 503. The browser treats any non-200 as "keep the local list", so a broken
 * account sync never costs anyone their stars.
 */

import { listStarredTools, replaceStarredTools } from '../../src/lib/server/db';
import { readSessionFromRequest } from '../../src/lib/server/session';
import { accountKey, parseStarredBody } from '../../src/lib/server/starred';

const MAX_BODY = 4096;

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return json(null);
  try {
    return json({ tools: await listStarredTools(env.DB, session.userId), account: await accountKey(session.userId) });
  } catch {
    return json({ error: 'unavailable' }, 503);
  }
}

export async function onRequestPut({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) {
    return json({ error: 'bad_request' }, 415);
  }
  const text = await request.text();
  if (text.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ error: 'bad_request' }, 400);
  }
  const tools = parseStarredBody(parsed);
  if (!tools) return json({ error: 'bad_request' }, 400);

  try {
    await replaceStarredTools(env.DB, session.userId, tools, Date.now());
  } catch {
    return json({ error: 'unavailable' }, 503);
  }
  return json({ tools, account: await accountKey(session.userId) });
}
