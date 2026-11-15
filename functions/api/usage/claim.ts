/**
 * Cloudflare Pages Function: the one check made before every tool run.
 *
 * The server alone decides whether a run may start. It applies the account's plan, counts a free run against the
 * daily allowance, refuses a tool above the plan with 402, and hands a paid account a short-lived signed token so
 * paid tools keep working offline. The client waits for this answer and does not start the tool without it
 * (src/lib/usage.ts). The decision itself is in src/lib/server/claim.ts.
 *
 * Privacy: the request carries nothing about the file: no name, no size, no page text. All this endpoint ever
 * learns is that some job ran, and which tool's id the page says it is about to run.
 */

import { decideClaim } from '../../../src/lib/server/claim';
import { hashIp } from '../../../src/lib/server/ipHash';
import { readSessionFromRequest } from '../../../src/lib/server/session';

const MAX_BODY = 256;

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const raw = await request.text();
  if (raw.length > MAX_BODY) return new Response(null, { status: 413 });

  // An empty body is a free tool (older pages did not send one). Anything else must be a JSON object.
  let tool: unknown;
  if (raw) {
    try {
      tool = (JSON.parse(raw) as { tool?: unknown } | null)?.tool;
    } catch {
      return new Response(null, { status: 400 });
    }
  }

  const session = await readSessionFromRequest(request, env.DB);
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const { status, body } = await decideClaim({
    env,
    session: session ? { userId: session.userId, plan: session.plan } : null,
    tool,
    anonymousKey: ip ? await hashIp(ip, env.SESSION_IP_SALT) : null,
  });

  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
