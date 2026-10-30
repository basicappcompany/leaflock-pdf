/**
 * Last known plan for this visitor, set by useSession() when it resolves.
 *
 * Purely a latency optimisation: it lets a job skip the /api/usage/claim round trip
 * on paid plans, which aren't metered anyway, so a paying customer's work never waits
 * on the network. Never a security boundary — functions/api/usage/claim.ts re-checks
 * the real session, and nothing is withheld from a visitor who edits this in their
 * own browser: the work runs on their device either way.
 */

/**
 * `lifetime` is the ten-year Pro term (src/lib/pricing.ts `proTenYear`): the stored value
 * kept its original name because the database CHECKs it, and renaming it is a migration of
 * its own rather than part of the 4.9 pricing change.
 */
export type Plan = 'free' | 'pro' | 'lifetime' | 'practice' | 'business';
export type CachedPlan = Plan | 'anonymous';

let cachedPlan: CachedPlan = 'anonymous';

export function setCachedPlan(plan: CachedPlan): void {
  cachedPlan = plan;
}

export function getCachedPlan(): CachedPlan {
  return cachedPlan;
}

/**
 * Whether this plan is paid at all — used for metering and the retention picker, both of
 * which treat every paying customer alike. It deliberately does not say *which* tools the
 * plan unlocks: that is a ranking question, and it lives in src/lib/proAccess.ts.
 */
export function isPaidPlan(plan: CachedPlan): boolean {
  return plan === 'pro' || plan === 'lifetime' || plan === 'practice' || plan === 'business';
}
