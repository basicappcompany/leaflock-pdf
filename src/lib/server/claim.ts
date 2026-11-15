/**
 * What `/api/usage/claim` decides for one tool run. This is the one enforcement point per run, for both
 * metering and entitlement: the server alone says whether a run may start, and the client never decides
 * for itself whether to ask.
 *
 * - A tool above the account's plan gets 402, with no counting and no token.
 * - Otherwise a free or anonymous run is counted against the daily allowance.
 * - A paid plan is not counted.
 * - Every 2xx answer carries a signed token for offline use: a paid plan's lasts 48 hours and says the plan; a free
 *   or anonymous one is for today only and says how many runs are left of today's allowance, so offline runs can be
 *   metered on the device (src/lib/usage.ts) and reported back on the next online claim.
 *
 * The tier a run needs comes from the server's own registry, by the tool id the client sends; the client never
 * supplies a tier. The answer says which tier it authorized (`authorizedTier`), and that is logged per run.
 * The tool id is the one thing the client says, and it can say a different tool than the one it then runs; the
 * client refuses that case, and it is logged, but a person with developer tools can still call the bundled
 * operations directly. That is the residual risk of computing on the visitor's own device (src/lib/proAccess.ts).
 */

import { plansStartAt } from '../pricing';
import { requiresUpgrade, type ToolTier } from '../proAccess';
import { tools } from '../../tools/registry';
import { verifyEntitlement } from '../entitlement';
import type { UserRow } from './db';
import { ANONYMOUS_SUB, signEntitlement, tierForPlan } from './entitlement';
import { checkAndIncrement } from './rateLimit';
import { ANONYMOUS_DAILY_JOBS, FREE_ACCOUNT_DAILY_JOBS, claimDailyJob, dayKey } from './usage';

const DAY_SECONDS = 24 * 60 * 60;

/** Hosts that must never run with the gate forced on, whatever the environment says. */
const PRODUCTION_HOSTS = ['leaflockpdf.com', 'www.leaflockpdf.com'];

export interface ClaimSession {
  userId: string;
  plan: UserRow['plan'];
}

export interface ClaimOutcome {
  status: 200 | 400 | 402;
  body: Record<string, unknown>;
}

/** What the browser reports from its offline runs: the free token it was holding and how many runs it spent. */
export interface OfflineReport {
  token: string;
  used: number;
}

/** The tier a tool belongs to, or undefined for an id that is not a tool. */
export function tierOfTool(tool: unknown): ToolTier | undefined {
  return tools.find((candidate) => candidate.id === tool)?.tier;
}

/**
 * Whether the per-run tier gate is forced on regardless of the date, for a staging build that rehearses launch
 * day (`ENTITLEMENT_GATE_ALWAYS_ON=on`, see src/lib/proAccess.ts). Refused on the production hostnames even if the
 * variable is set there by mistake.
 */
export function gateForcedOn(env: Pick<Env, 'ENTITLEMENT_GATE_ALWAYS_ON'>, host: string | undefined): boolean {
  if (env.ENTITLEMENT_GATE_ALWAYS_ON !== 'on') return false;
  return !host || !PRODUCTION_HOSTS.includes(host.toLowerCase());
}

/**
 * How many offline runs to charge: only from a token the server signed for this very account and today, never
 * more than that token allowed. Anything else counts as zero, so a forged or stale report can only cost nothing.
 */
async function offlineRunsToCharge(report: OfflineReport | undefined, subject: string, now: number): Promise<number> {
  if (!report || typeof report.token !== 'string' || !Number.isInteger(report.used) || report.used <= 0) return 0;
  const claims = await verifyEntitlement(report.token, undefined, now);
  if (!claims || claims.tier !== 'free' || claims.sub !== subject || claims.runs === undefined) return 0;
  if (claims.day !== dayKey(now)) return 0;
  return Math.min(report.used, claims.runs);
}

export async function decideClaim(args: {
  env: Env;
  session: ClaimSession | null;
  /** The tool id the client says it is about to run; absent means a free tool. */
  tool: unknown;
  /** Hashed requester address for anonymous counting, or null when unknown. */
  anonymousKey: string | null;
  now?: number;
  /** The request's hostname, used only to refuse the forced gate on production. */
  host?: string;
  /** Offline runs to settle, from a previous free token. */
  offline?: OfflineReport;
}): Promise<ClaimOutcome> {
  const { env, session, tool, anonymousKey } = args;
  const now = args.now ?? Date.now();

  const required = tool === undefined || tool === null ? 'free' : tierOfTool(tool);
  if (!required) return { status: 400, body: { error: 'unknown_tool' } };

  const plan = session?.plan ?? 'anonymous';
  // Computed from the date now, not the build-time constant: a long-lived isolate must not keep serving the
  // answer it had before 1 January.
  const gated = now >= plansStartAt || gateForcedOn(env, args.host);
  if (requiresUpgrade(required, plan, gated)) {
    console.log(JSON.stringify({ type: 'claim', tool: tool ?? null, required, granted: tierForPlan(plan === 'anonymous' ? 'free' : plan), outcome: 'upgrade' }));
    return { status: 402, body: { error: 'upgrade', required } };
  }

  const granted: ToolTier = plan === 'anonymous' ? 'free' : tierForPlan(plan);
  const log = (outcome: string) =>
    console.log(JSON.stringify({ type: 'claim', tool: tool ?? null, required, granted, outcome }));
  const tiers = { authorizedTier: required, grantedTier: granted };

  if (session && session.plan !== 'free') {
    const token = await signEntitlement(env, session.userId, session.plan, now);
    log('paid');
    return { status: 200, body: { allowed: true, remaining: null, ...tiers, ...(token ? { token } : {}) } };
  }

  const day = dayKey(now);
  const charge = 1 + (await offlineRunsToCharge(args.offline, session?.userId ?? ANONYMOUS_SUB, now));

  if (session) {
    const { allowed, count } = await claimDailyJob(env.DB, session.userId, FREE_ACCOUNT_DAILY_JOBS, now, charge);
    const remaining = Math.max(0, FREE_ACCOUNT_DAILY_JOBS - count);
    const token = await signEntitlement(env, session.userId, 'free', now, { day, runs: remaining });
    log(allowed ? 'free' : 'free-limit');
    return { status: 200, body: { allowed, remaining, reason: 'free-account', ...tiers, ...(token ? { token } : {}) } };
  }

  // No account: counted per hashed IP, which everyone behind one shared address shares. Creating a free
  // account is the way past that, and the larger allowance.
  const { allowed, count } = await checkAndIncrement(env.DB, `jobs-anon:${anonymousKey ?? 'unknown'}`, ANONYMOUS_DAILY_JOBS, DAY_SECONDS, now, charge);
  const remaining = Math.max(0, ANONYMOUS_DAILY_JOBS - count);
  const token = await signEntitlement(env, ANONYMOUS_SUB, 'anonymous', now, { day, runs: remaining });
  log(allowed ? 'anonymous' : 'anonymous-limit');
  return { status: 200, body: { allowed, remaining, reason: 'anonymous', ...tiers, ...(token ? { token } : {}) } };
}
