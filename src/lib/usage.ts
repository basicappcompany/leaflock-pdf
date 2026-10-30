import { getCachedPlan, isPaidPlan } from './planCache';

export type UsageLimitReason = 'anonymous' | 'free-account';

interface ClaimResponse {
  allowed: boolean;
  remaining: number | null;
  reason?: UsageLimitReason;
}

/** Thrown by runPdfJob when the free tier's daily allowance is already used up. Not a
 * bug, so it is never sent to /api/errors: it's handled in useTask.ts before that. */
export class UsageLimitError extends Error {
  readonly reason: UsageLimitReason;

  constructor(reason: UsageLimitReason) {
    super(`daily job allowance reached: ${reason}`);
    this.name = 'UsageLimitError';
    this.reason = reason;
  }
}

function enabled(): boolean {
  // Off in builds made with PUBLIC_USAGE_LIMITS=off, which is how the self-hosted
  // Business edition is built: it runs on networks with no internet access at all,
  // where even a failing request would make every job wait for a connection timeout.
  return import.meta.env.PUBLIC_USAGE_LIMITS !== 'off';
}

/**
 * Counts one job against the free tier's daily allowance, and throws UsageLimitError
 * if it's used up.
 *
 * Skipped entirely on paid plans, which aren't metered — the whole point of the
 * product is that the work happens locally, so a paying customer's job must never
 * wait on a server. For the same reason this fails open: if the request fails, the
 * job runs. The cap is a nudge towards an account or Pro, not a lock.
 */
export async function claimJob(): Promise<void> {
  if (!enabled()) return;
  if (isPaidPlan(getCachedPlan())) return;

  let claim: ClaimResponse;
  try {
    const response = await fetch('/api/usage/claim', { method: 'POST' });
    if (!response.ok) return;
    claim = (await response.json()) as ClaimResponse;
  } catch {
    return;
  }

  if (!claim.allowed) throw new UsageLimitError(claim.reason ?? 'anonymous');
}
