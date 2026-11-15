import { type CachedPlan } from './planCache';
import { proToolsGated } from './pricing';

/** The tiers a tool can belong to, lowest first. Mirrors `tier` in src/tools/registry.ts. */
export type ToolTier = 'free' | 'pro' | 'practice';

/**
 * Tiers and plans both rank, and access is simply "does this plan reach this tier".
 *
 * Added 30 October 2026 with the Practice tier (roadmap 4.9). Before it, access was a
 * boolean — any paid plan unlocked every gated tool — and that stops being true the moment
 * two paid tiers sell different things: a $24 Pro subscriber must not get the six
 * professional tools Practice is sold on, and a Practice subscriber must get everything
 * Pro has.
 *
 * `lifetime` is the ten-year Pro term, so it ranks with Pro. `business` is the self-hosted
 * edition and ranks with Practice: it sells at $499, and withholding the professional tools
 * from it would make the more expensive plan the smaller one.
 */
const TIER_RANK: Record<ToolTier, number> = { free: 0, pro: 1, practice: 2 };

const PLAN_RANK: Record<CachedPlan, number> = {
  anonymous: 0,
  free: 0,
  pro: 1,
  lifetime: 1,
  practice: 2,
  business: 2,
};

/**
 * Whether this visitor has to upgrade before using a tool.
 *
 * Worth being clear about what this is: a paywall, not a lock. Every tool runs on the
 * visitor's own device, so the code is already in their browser and a determined person
 * can always run it — there is no server-side work to withhold. The gate exists to make
 * the paid tools paid for the people willing to pay, not to make them impossible.
 */
export function requiresUpgrade(
  tier: ToolTier,
  plan: CachedPlan,
  gated: boolean = proToolsGated,
): boolean {
  if (tier === 'free') return false;
  if (!gated) return false;
  return PLAN_RANK[plan] < TIER_RANK[tier];
}

/** Whether a tool costs money at all — for badges, notices and structured data. */
export function isPaidTier(tier: ToolTier): boolean {
  return tier !== 'free';
}
