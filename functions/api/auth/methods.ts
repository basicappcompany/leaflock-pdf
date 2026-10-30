/**
 * Cloudflare Pages Function: which ways of signing in are actually available.
 *
 * The login page asks before offering Google, so the button can't appear unless the
 * credentials behind it exist. One source of truth — the server's own configuration —
 * rather than a build flag that can quietly disagree with it.
 */

import { googleConfigured } from '../../../src/lib/server/google';

export async function onRequestGet({ env }: { env: Env }): Promise<Response> {
  return new Response(JSON.stringify({ google: googleConfigured(env) }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
