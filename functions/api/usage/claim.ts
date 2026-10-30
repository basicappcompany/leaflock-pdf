/**
 * Cloudflare Pages Function: counts one tool run against the free tier's daily
 * allowance and says whether it is allowed.
 *
 * Privacy: the request carries nothing about the file — no name, no size, no page
 * text. All this endpoint ever learns is that some job ran.
 *
 * Paid plans are never counted. The client also skips calling this at all when it
 * already knows the plan is paid (src/lib/usage.ts), so this stays the authoritative
 * check without putting a network round trip in front of a paying customer's work.
 */

import { hashIp } from '../../../src/lib/server/ipHash';
import { checkAndIncrement } from '../../../src/lib/server/rateLimit';
import { readSessionFromRequest } from '../../../src/lib/server/session';
import { ANONYMOUS_DAILY_JOBS, FREE_ACCOUNT_DAILY_JOBS, claimDailyJob } from '../../../src/lib/server/usage';

const DAY_SECONDS = 24 * 60 * 60;

function json(body: { allowed: boolean; remaining: number | null; reason?: 'anonymous' | 'free-account' }): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);

  if (session && session.plan !== 'free') {
    return json({ allowed: true, remaining: null });
  }

  if (session) {
    const { allowed, count } = await claimDailyJob(env.DB, session.userId, FREE_ACCOUNT_DAILY_JOBS);
    return json({ allowed, remaining: Math.max(0, FREE_ACCOUNT_DAILY_JOBS - count), reason: 'free-account' });
  }

  // No account: counted per hashed IP, which everyone behind one shared address
  // shares. Creating a free account is the way past that, and the larger allowance.
  const ip = request.headers.get('cf-connecting-ip') ?? '';
  const key = `jobs-anon:${ip ? await hashIp(ip, env.SESSION_IP_SALT) : 'unknown'}`;
  const { allowed, count } = await checkAndIncrement(env.DB, key, ANONYMOUS_DAILY_JOBS, DAY_SECONDS);
  return json({ allowed, remaining: Math.max(0, ANONYMOUS_DAILY_JOBS - count), reason: 'anonymous' });
}
