import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { plansStartAt } from '../../src/lib/pricing';
import { purchaseDecision, upgradeFor } from '../../src/lib/server/billing';

/**
 * Members who already pay (12 November 2026): a second purchase on top of a plan they have is a
 * duplicate charge, Pro subscribers upgrade to Practice by changing plan, and ten-year Pro holders
 * (no subscription to change) buy Practice afresh.
 */

const before = Date.UTC(2026, 10, 15);
const user = (plan: string, status = 'active', subscription: string | null = 'sub_1', periodEnd: number | null = null) =>
  ({ plan, plan_status: status, subscription_id: subscription, current_period_end: periodEnd }) as never;

describe('purchaseDecision', () => {
  it('lets a free account buy anything', () => {
    for (const plan of ['proMonthly', 'proYearly', 'proTenYear', 'practiceYearly'] as const) {
      expect(purchaseDecision(user('free', 'none', null), plan, before)).toBe('ok');
    }
  });

  it('refuses a duplicate Pro purchase and routes Pro to Practice through an upgrade', () => {
    for (const plan of ['proMonthly', 'proYearly', 'proTenYear'] as const) {
      expect(purchaseDecision(user('pro'), plan, before)).toBe('owned');
    }
    expect(purchaseDecision(user('pro'), 'practiceYearly', before)).toBe('upgrade');
  });

  it('sells Practice to a ten-year Pro holder as a new purchase, since there is no subscription to change', () => {
    expect(purchaseDecision(user('lifetime', 'active', null), 'practiceYearly', before)).toBe('ok');
    expect(purchaseDecision(user('lifetime', 'active', null), 'proYearly', before)).toBe('owned');
  });

  it('offers nothing below or equal to what a Practice or Business account has', () => {
    for (const plan of ['proMonthly', 'proYearly', 'proTenYear', 'practiceYearly'] as const) {
      expect(purchaseDecision(user('practice'), plan, before)).toBe('owned');
      expect(purchaseDecision(user('business', 'active', null), plan, before)).toBe('owned');
    }
  });

  it('does not stack a purchase or an upgrade on a failing payment', () => {
    expect(purchaseDecision(user('pro', 'past_due'), 'practiceYearly', before)).toBe('owned');
    expect(purchaseDecision(user('pro', 'past_due'), 'proYearly', before)).toBe('owned');
  });

  it('lets a cancelled plan be bought again, and an expired one count as free', () => {
    expect(purchaseDecision(user('pro', 'cancelled', 'sub_1', plansStartAt + 1e9), 'proYearly', before)).toBe('ok');
    expect(purchaseDecision(user('pro', 'active', 'sub_1', before - 1000), 'proYearly', before)).toBe('ok');
  });

  it('does not upgrade a Pro account that has no live subscription to change', () => {
    expect(purchaseDecision(user('pro', 'active', null), 'practiceYearly', before)).toBe('ok');
  });
});

describe('upgradeFor', () => {
  const env = { DODO_PRODUCT_PRACTICE_YEARLY: 'pdt_practice', DODO_DISCOUNT_PRACTICE_UPGRADE: 'UPGRADE50' } as unknown as Env;

  it('applies the upgrade code during the launch offer and the standard price afterwards', () => {
    expect(upgradeFor(env, before)).toEqual({ productId: 'pdt_practice', discountCodes: ['UPGRADE50'] });
    expect(upgradeFor(env, plansStartAt)).toEqual({ productId: 'pdt_practice' });
  });

  it('refuses rather than charging the full price under an advertised discount', () => {
    const without = { DODO_PRODUCT_PRACTICE_YEARLY: 'pdt_practice' } as unknown as Env;
    expect(upgradeFor(without, before)).toBeUndefined();
    expect(upgradeFor({} as unknown as Env, plansStartAt)).toBeUndefined();
  });
});

describe('what a paying member sees', () => {
  const read = (file: string) => readFileSync(file, 'utf8');

  it('hides the launch offer and the plan cards they already have, but not the Business card', () => {
    const page = read('src/pages/pricing.astro');
    expect(page).toContain('early-notice for-new');
    expect(page).toContain("id === 'business' ? '' : ' for-new'");
    expect(read('src/pages/index.astro')).toContain('top-banner for-new');
    const css = read('src/styles/early-notice.css');
    expect(css).toContain("html[data-plan]:not([data-plan='free']) .for-new");
  });

  it('puts the plan on <html> once the session resolves', () => {
    expect(read('src/components/ui/useSession.ts')).toContain('document.documentElement.dataset.plan');
  });
});
