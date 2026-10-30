/**
 * Whether Pro and the founding lifetime plan can actually be bought.
 *
 * The checkout and webhook behind them are built and ready. Switching this on ends
 * early access, so before flipping it: announce it on the site first (terms.md §5
 * promises that), update the early-access wording in pricing.ts and common.ts's
 * `proNote`, and set the Dodo keys and product ids (see functions/env.d.ts) —
 * without those, checkout answers 503.
 */
export const paidPlansAvailable = false;

/**
 * Whether Pro tools actually require a paid plan.
 *
 * Deliberately derived from `paidPlansAvailable` rather than set on its own: locking a
 * tool while there is no way to buy Pro would strand everyone who uses it, with nothing
 * they could do about it. Payments can be open while Pro tools stay free, but never the
 * other way round.
 *
 * Switching this on also makes two pieces of text wrong, so change them in the same
 * breath: `toolPage.proNote` in src/i18n/en/common.ts, and the early-access paragraph
 * in terms.md §5, which promises Pro tools are free for now and that we'll announce it
 * before that changes.
 */
export const proToolsGated = paidPlansAvailable;

/** Prices in US dollars, from the business plan. One place to change them. */
export const prices = {
  proMonthly: 4,
  proYearly: 24,
  /**
   * Ten years of Pro for one payment, decided 30 October 2026 — $1/month equivalent.
   * Deliberately a defined term rather than a "lifetime" plan: an unbounded promise is one
   * we would still owe after the product's economics change. The stored plan value is still
   * `lifetime` (src/lib/planCache.ts), because renaming a value the database already CHECKs
   * is a migration of its own and only the term and the number were decided here.
   */
  proTenYear: 120,
  /**
   * Practice, decided 30 October 2026: the six professional tools, the click-through DPA and
   * the trust page, for the solo attorneys and compliance teams those six were chosen for.
   * Undercuts SealedPDF, which sells a comparable client-side set at $468.
   */
  practiceYearly: 249,
  /**
   * Early-access price, decided 28 October 2026, raised from $299 to $499 on 30 October
   * 2026 when Practice landed at $249: $50 between an individual professional and a
   * self-hosted organisation did not reflect the difference between them.
   * $750 (`businessYearlyTarget` below)
   * is the eventual price once Business actually has the procurement features a buyer
   * at that price expects — SSO, a DPA, PO/net-30 invoicing (docs/roadmap.md Phase 4).
   * Charging full price before those exist would be selling against a security
   * questionnaire we can't pass yet. Raise this constant, not the target, when they
   * ship — and announce the change first, the same way terms.md §5 promises for Pro.
   */
  businessYearly: 499,
} as const;

/**
 * The price Business moves to once SSO, a DPA and invoicing all ship. Not read by any
 * page yet — it exists here so the number lives in one place ahead of the change,
 * rather than being invented again when the day comes.
 */
export const businessYearlyTarget = 750;

/** Formats a whole-dollar price for display, e.g. 24 → "$24". */
export function formatPrice(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

/** How much cheaper a year of Pro is than twelve months, in whole percent. */
export function yearlySavingPercent(): number {
  return Math.round((1 - prices.proYearly / (prices.proMonthly * 12)) * 100);
}
