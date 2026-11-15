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
 * **Rehearsing launch day: `ENTITLEMENT_GATE_ALWAYS_ON`.** Every 402, every offline paid-tool check and every
 * tamper/expiry probe is date-gated to 1 January 2027, so none of it can be exercised on production before then. A
 * staging deployment turns the gate on early with two settings that must agree:
 *
 * - server: the `ENTITLEMENT_GATE_ALWAYS_ON=on` variable on the Pages *preview* environment (wrangler.toml
 *   `[env.preview.vars]`, or the dashboard). The claim ignores it on leaflockpdf.com and www.leaflockpdf.com even
 *   if it is set there by mistake (src/lib/server/claim.ts `gateForcedOn`).
 * - client: `PUBLIC_ENTITLEMENT_GATE_ALWAYS_ON=on` in the preview environment's *build* variables, so the offline
 *   checks (`proToolsGated`, src/lib/pricing.ts) gate too.
 *
 * **Production must never enable it before 2027-01-01.** Neither value belongs in a production variable, in
 * wrangler.toml outside `[env.preview]`, or in a committed .env; tests/unit/server/freeToken.test.ts fails the
 * build if the first two are set. After 2027-01-01 it changes nothing, since the date gates anyway.
 */

/**
 * Whether this visitor has to upgrade before using a tool.
 *
 * **This is user experience, not authorization.** It decides which screen to show (the tool, or the upgrade
 * prompt) from a plan the page learned from the server. It authorizes nothing: the server decides every run.
 *
 * - **Online:** before any tool does work, the page waits for `POST /api/usage/claim` (src/lib/usage.ts). The server
 *   applies the account's real plan, counts a free run, and answers 402 for a tool above the plan. A run does
 *   not start without its yes, and a failed or missing answer stops it. The page never looks at the plan or a
 *   cookie to decide whether to ask.
 * - **Offline:** there is no server, so a paid tool needs a signed token the server issued with a recent claim
 *   (src/lib/entitlement.ts, Ed25519, 48 hours). The page can check a signature but cannot make one. Free and
 *   anonymous visitors get a token too, good for the rest of the current UTC day and carrying the server's remaining
 *   allowance: offline runs spend it on the device, stop at zero, and are reported on the next online claim, which
 *   charges them (never more than the token allowed). With no usable token (first visit, a day-old token, or a paid
 *   token that has expired) a small allowance (OFFLINE_GRACE_RUNS a day, counted on the device) keeps free tools
 *   working. That is the one defined behaviour for "no token", and it is the bound, not a lock.
 *
 * **Residual risk, accepted on purpose.** Every tool runs on the visitor's own device, and the paid tools are not
 * separate downloads: their operations are in the one shared worker bundle (`pdf.worker`), which is also what the
 * installed offline app caches. So a determined person with developer tools can call those operations directly,
 * skipping the page, the claim and the token, and nothing on a server can prevent it, because there is no
 * server-side work to withhold. They can also claim one tool's id and run another (the client refuses that, and the server
 * logs the tier it authorized for each run, so it is visible, but a devtools user can skip the client check), or
 * clear the device's offline counters. What the checks achieve is that the supported way to use a paid tool is to pay,
 * that an honest free account cannot exceed its daily allowance, and that editing the cached plan or a cookie
 * changes nothing the server relies on. They are not a lock, and nothing here claims to be one.
 *
 * The self-hosted build (`PUBLIC_USAGE_LIMITS=off`) makes no claim at all and is an honor system by design: see
 * docs/self-hosting.md.
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
