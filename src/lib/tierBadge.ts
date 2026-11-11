import { paidPlansAvailable } from './pricing';

/**
 * The text of a Pro or Practice badge. While paid plans are not on sale it carries
 * "· Free now", so a badge never reads as a paywall on a tool that costs nothing.
 * Derived from `paidPlansAvailable`, like the tool page's early-access note, so the two
 * cannot disagree and flipping the constant removes the wording everywhere at once.
 */
export function tierBadgeText(label: string, freeNow: string): string {
  return paidPlansAvailable ? label : `${label} · ${freeNow}`;
}
