/**
 * Cloudflare Pages Function: today's allowance for the signed-in user, read only.
 *
 * The dashboard's meter needs the count without spending one to get it, so this never
 * increments — that stays the job of /api/usage/claim, which is also the authoritative
 * check. Nothing here is a security boundary: the numbers are a nudge, and the work
 * runs on the visitor's device regardless.
 *
 * Always 200 with a null body when signed out, matching /api/auth/me: the dashboard
 * only ever renders for a signed-in user, and a 401 would log a console error on a
 * page where being signed out is perfectly normal.
 *
 * Privacy: a count and a plan name. Nothing about any file, ever.
 */

import { readSessionFromRequest } from '../../../src/lib/server/session';
import { FREE_ACCOUNT_DAILY_JOBS, readDailyJobs } from '../../../src/lib/server/usage';

export async function onRequestGet({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const session = await readSessionFromRequest(request, env.DB);

  // `limit: null` means "not metered", which is how paid plans are reported. The
  // dashboard shows a reassurance instead of a meter for those.
  const body = session
    ? {
        plan: session.plan,
        used: session.plan === 'free' ? await readDailyJobs(env.DB, session.userId) : 0,
        limit: session.plan === 'free' ? FREE_ACCOUNT_DAILY_JOBS : null,
      }
    : null;

  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
