/**
 * The launch schedule, decided 12 November 2026:
 *
 * - Early access runs until the end of 31 December 2026. Pro and Practice tools are free
 *   until then.
 * - Until then the plans can be bought at a launch discount (`launchPercentOff`), and the
 *   buyer is charged at checkout. The paid term does not start at purchase: it runs from
 *   1 January 2027, so the buyer loses nothing by buying early.
 * - Paid plans start, and Pro and Practice tools are gated, on 1 January 2027.
 *
 * One instant drives all of it, so the dates cannot drift apart. Midnight UTC at the start
 * of 1 January 2027, i.e. the end of 31 December 2026.
 */
export const plansStartAt = Date.UTC(2027, 0, 1);

/** The same dates as English words, for prose pages (terms.md, help.md); the tests compare them to `plansStartAt`. */
export const earlyAccessEndsOn = '31 December 2026';
export const plansStartOn = '1 January 2027';

/** A date for a page, in the reader's language. Takes the instant the plans start and gives the day before. */
export function formatEarlyAccessEnd(locale: string): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { dateStyle: 'long', timeZone: 'UTC' }).format(plansStartAt - 1);
}

export function formatPlansStart(locale: string): string {
  return new Intl.DateTimeFormat(dateLocale(locale), { dateStyle: 'long', timeZone: 'UTC' }).format(plansStartAt);
}

/** English dates are written day first ("31 December 2026"), as the terms and the owner write them. */
const dateLocale = (locale: string): string => (locale === 'en' ? 'en-GB' : locale);

/** Whether the launch offer can still be taken: checkout is open and the discount applies. */
export function offerOpen(now: number = Date.now()): boolean {
  return now < plansStartAt;
}

/**
 * Whether the paid plans have started, so the Pro and Practice tools need a plan.
 *
 * Derived from the date, not typed, so the gate opens on 1 January 2027 with no one
 * remembering to flip it. A static page reads it when it is built, so a deploy on or after
 * that date is what changes the pages (docs/TODO.md). Everything the site says about the
 * tools being free "during early access" stops being true on that day; the guard is
 * tests/unit/earlyAccessCopy.test.ts, which starts failing the first build after it.
 */
export const paidPlansAvailable = Date.now() >= plansStartAt;

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
   * Ten years of Pro for one payment, decided 30 October 2026 at $120, raised to $240 on
   * 12 November 2026 ($2/month equivalent: $120 was too little for ten years of service).
   * Deliberately a defined term rather than a "lifetime" plan: an unbounded promise is one
   * we would still owe after the product's economics change. The stored plan value is still
   * `lifetime` (src/lib/planCache.ts), because renaming a value the database already CHECKs
   * is a migration of its own and only the term and the number were decided here.
   */
  proTenYear: 240,
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

/**
 * The launch discount on each plan, in whole percent, for purchases made before
 * `plansStartAt`. Decided 12 November 2026: half off anything that runs for a year or more
 * on a yearly plan, a quarter off the ten-year term (already the cheapest per year), and
 * nothing off monthly. It applies to the first term only; renewals are at the standard price.
 */
export const launchPercentOff = {
  proMonthly: 0,
  proYearly: 50,
  proTenYear: 25,
  practiceYearly: 50,
} as const;

export type SoldPlan = keyof typeof launchPercentOff;

/** What the launch offer charges for a plan, in dollars (cents when the discount leaves any). */
export function launchPrice(plan: SoldPlan): number {
  return Math.round(prices[plan] * (100 - launchPercentOff[plan])) / 100;
}

/** Formats a price for display, e.g. 24 → "$24" and 124.5 → "$124.50". */
export function formatPrice(amount: number, locale: string): string {
  const fractional = !Number.isInteger(amount);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: fractional ? 2 : 0,
  }).format(amount);
}

/** How much cheaper a year of Pro is than twelve months, in whole percent. */
export function yearlySavingPercent(): number {
  return Math.round((1 - prices.proYearly / (prices.proMonthly * 12)) * 100);
}
