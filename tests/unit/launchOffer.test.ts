import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  earlyAccessEndsOn,
  formatPrice,
  launchPercentOff,
  launchPrice,
  offerOpen,
  plansStartAt,
  plansStartOn,
  prices,
} from '../../src/lib/pricing';
import { checkoutFor } from '../../src/lib/server/billing';

/**
 * The launch offer, decided 12 November 2026: early access to the end of 31 December 2026,
 * 50% off yearly plans and 25% off the ten-year plan until then, charged at checkout, with
 * the paid term starting on 1 January 2027.
 */

const read = (file: string) => readFileSync(file, 'utf8');
const env = {
  DODO_PRODUCT_PRO_MONTHLY: 'pdt_monthly',
  DODO_PRODUCT_PRO_YEARLY: 'pdt_yearly',
  DODO_PRODUCT_LIFETIME: 'pdt_ten',
  DODO_PRODUCT_PRACTICE_YEARLY: 'pdt_practice',
  DODO_PRODUCT_PRO_YEARLY_LAUNCH: 'pdt_yearly_launch',
  DODO_PRODUCT_PRACTICE_YEARLY_LAUNCH: 'pdt_practice_launch',
  DODO_DISCOUNT_TEN_YEAR: 'TENYEAR25',
} as unknown as Env;

const before = Date.UTC(2026, 10, 15, 12); // 15 November 2026
const lastSecond = plansStartAt - 1000;

describe('launch offer schedule', () => {
  it('ends with 31 December 2026 and starts plans on 1 January 2027', () => {
    expect(new Date(plansStartAt).toISOString()).toBe('2027-01-01T00:00:00.000Z');
    expect(earlyAccessEndsOn).toBe('31 December 2026');
    expect(plansStartOn).toBe('1 January 2027');
    expect(offerOpen(lastSecond)).toBe(true);
    expect(offerOpen(plansStartAt)).toBe(false);
  });

  it('discounts yearly plans by half, the ten-year plan by a quarter, and monthly not at all', () => {
    expect(launchPercentOff).toEqual({ proMonthly: 0, proYearly: 50, proTenYear: 25, practiceYearly: 50 });
    expect(launchPrice('proYearly')).toBe(12);
    expect(launchPrice('proTenYear')).toBe(180);
    expect(launchPrice('practiceYearly')).toBe(124.5);
    expect(launchPrice('proMonthly')).toBe(prices.proMonthly);
  });

  it('shows a price with cents only when it has some', () => {
    expect(formatPrice(124.5, 'en')).toBe('$124.50');
    expect(formatPrice(24, 'en')).toBe('$24');
  });

  it('is stated the same way in the terms and the help page', () => {
    for (const file of ['src/content/pages/en/terms.md', 'src/content/pages/en/help.md']) {
      const text = read(file);
      expect(text, file).toContain(earlyAccessEndsOn);
      expect(text, file).toContain(plansStartOn);
      expect(text, file).toContain(`${launchPercentOff.proYearly}%`);
      expect(text, file).toContain(`${launchPercentOff.proTenYear}%`);
    }
  });
});

describe('checkout during the launch offer', () => {
  it('sells a yearly plan as its launch product, renewing on 1 January 2028', () => {
    const sale = checkoutFor(env, 'proYearly', before);
    expect(sale?.productId).toBe('pdt_yearly_launch');
    expect(sale?.discountCodes).toBeUndefined();
    // 15 November 2026 12:00 UTC to 1 January 2028 00:00 UTC is 411.5 days.
    expect(sale?.trialPeriodDays).toBe(412);
    expect(checkoutFor(env, 'practiceYearly', before)?.productId).toBe('pdt_practice_launch');
  });

  it('lands the first renewal on 1 January 2028 whatever day it is bought', () => {
    for (const day of [Date.UTC(2026, 10, 12), Date.UTC(2026, 11, 31, 23, 59)]) {
      const days = checkoutFor(env, 'proYearly', day)?.trialPeriodDays ?? 0;
      const renewal = new Date(day + days * 24 * 60 * 60 * 1000);
      expect(renewal.getTime()).toBeGreaterThanOrEqual(Date.UTC(2028, 0, 1));
      expect(renewal.getTime() - Date.UTC(2028, 0, 1)).toBeLessThan(24 * 60 * 60 * 1000);
    }
  });

  it('sells the ten-year plan with its discount code, and monthly at the standard price', () => {
    expect(checkoutFor(env, 'proTenYear', before)).toEqual({ productId: 'pdt_ten', discountCodes: ['TENYEAR25'] });
    expect(checkoutFor(env, 'proMonthly', before)).toEqual({ productId: 'pdt_monthly' });
  });

  it('refuses rather than charging the standard price when offer configuration is missing', () => {
    const without = (key: string) => ({ ...env, [key]: undefined }) as unknown as Env;
    expect(checkoutFor(without('DODO_PRODUCT_PRO_YEARLY_LAUNCH'), 'proYearly', before)).toBeUndefined();
    expect(checkoutFor(without('DODO_DISCOUNT_TEN_YEAR'), 'proTenYear', before)).toBeUndefined();
  });

  it('sells everything at the standard price once plans have started', () => {
    expect(checkoutFor(env, 'proYearly', plansStartAt)).toEqual({ productId: 'pdt_yearly' });
    expect(checkoutFor(env, 'proTenYear', plansStartAt)).toEqual({ productId: 'pdt_ten' });
    expect(checkoutFor(env, 'practiceYearly', plansStartAt)).toEqual({ productId: 'pdt_practice' });
  });
});
