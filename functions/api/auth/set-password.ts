/** Cloudflare Pages Function: sets or replaces the password on the signed-in account. */

import { setPasswordHash } from '../../../src/lib/server/db';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH, hashPassword } from '../../../src/lib/server/password';
import { readSessionFromRequest } from '../../../src/lib/server/session';

const MAX_BODY = 512;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);
  if (!session) return new Response(null, { status: 401 });

  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return new Response(null, { status: 400 });
  }
  const password = (parsed as Record<string, unknown> | null)?.['password'];
  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return new Response(JSON.stringify({ error: 'too_short', min: MIN_PASSWORD_LENGTH }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await setPasswordHash(env.DB, session.userId, await hashPassword(password));
  return new Response(null, { status: 204 });
}
