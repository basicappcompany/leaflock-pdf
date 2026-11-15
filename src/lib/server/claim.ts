/**
 * What `/api/usage/claim` decides for one tool run. This is the one enforcement point per run, for both
 * metering and entitlement: the server alone says whether a run may start, and the client never decides
 * for itself whether to ask.
 *
 * - A tool above the account's plan gets 402, with no counting and no token.
 * - Otherwise a free or anonymous run is counted against the daily allowance.
 * - A paid plan is not counted, and gets a fresh signed entitlement token for offline use.
 *
 * Nothing here trusts the client for a plan, a count or an "already claimed" flag. The tool id is the one
 * thing the client says, and it can say a different tool than the one it then runs; that is the residual
 * risk of computing on the visitor's own device (see src/lib/proAccess.ts).
 */

import { plansStartAt } from '../pricing';
import { requiresUpgrade, type ToolTier } from '../proAccess';
import { tools } from '../../tools/registry';
import type { UserRow } from './db';
import { signEntitlement } from './entitlement';
import { checkAndIncrement } from './rateLimit';
import { ANONYMOUS_DAILY_JOBS, FREE_ACCOUNT_DAILY_JOBS, claimDailyJob } from './usage';

const DAY_SECONDS = 24 * 60 * 60;

export interface ClaimSession {
  userId: string;
  plan: UserRow['plan'];
}

export interface ClaimOutcome {
  status: 200 | 400 | 402;
  body: Record<string, unknown>;
}

/** The tier a tool belongs to, or undefined for an id that is not a tool. */
export function tierOfTool(tool: unknown): ToolTier | undefined {
  return tools.find((candidate) => candidate.id === tool)?.tier;
}

export async function decideClaim(args: {
  env: Env;
  session: ClaimSession | null;
  /** The tool id the client says it is about to run; absent means a free tool. */
  tool: unknown;
  /** Hashed requester address for anonymous counting, or null when unknown. */
  anonymousKey: string | null;
  now?: number;
}): Promise<ClaimOutcome> {
  const { env, session, tool, anonymousKey } = args;
  const now = args.now ?? Date.now();

  const tier = tool === undefined || tool === null ? 'free' : tierOfTool(tool);
  if (!tier) return { status: 400, body: { error: 'unknown_tool' } };

  const plan = session?.plan ?? 'anonymous';
  // Computed from the date now, not the build-time constant: a long-lived isolate must not keep serving the
  // answer it had before 1 January.
  if (requiresUpgrade(tier, plan, now >= plansStartAt)) {
    return { status: 402, body: { error: 'upgrade', required: tier } };
  }

  if (session && session.plan !== 'free') {
    const token = await signEntitlement(env, session.userId, session.plan, now);
    return { status: 200, body: { allowed: true, remaining: null, ...(token ? { token } : {}) } };
  }

  if (session) {
    const { allowed, count } = await claimDailyJob(env.DB, session.userId, FREE_ACCOUNT_DAILY_JOBS);
    return { status: 200, body: { allowed, remaining: Math.max(0, FREE_ACCOUNT_DAILY_JOBS - count), reason: 'free-account' } };
  }

  // No account: counted per hashed IP, which everyone behind one shared address shares. Creating a free
  // account is the way past that, and the larger allowance.
  const { allowed, count } = await checkAndIncrement(env.DB, `jobs-anon:${anonymousKey ?? 'unknown'}`, ANONYMOUS_DAILY_JOBS, DAY_SECONDS);
  return { status: 200, body: { allowed, remaining: Math.max(0, ANONYMOUS_DAILY_JOBS - count), reason: 'anonymous' } };
}
