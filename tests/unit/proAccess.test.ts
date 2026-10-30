import { describe, expect, it } from 'vitest';
import { requiresUpgrade } from '../../src/lib/proAccess';
import { paidPlansAvailable, proToolsGated } from '../../src/lib/pricing';

describe('who has to upgrade', () => {
  it('never gets in the way of a free tool', () => {
    for (const plan of ['anonymous', 'free', 'pro', 'lifetime', 'business'] as const) {
      expect(requiresUpgrade('free', plan, true)).toBe(false);
    }
  });

  it('asks visitors without a paid plan to upgrade for a Pro tool', () => {
    expect(requiresUpgrade('pro', 'anonymous', true)).toBe(true);
    expect(requiresUpgrade('pro', 'free', true)).toBe(true);
  });

  it('lets every paid plan through, Business included', () => {
    expect(requiresUpgrade('pro', 'pro', true)).toBe(false);
    expect(requiresUpgrade('pro', 'lifetime', true)).toBe(false);
    expect(requiresUpgrade('pro', 'business', true)).toBe(false);
  });

  it('leaves Pro tools open while they are still free', () => {
    expect(requiresUpgrade('pro', 'anonymous', false)).toBe(false);
    expect(requiresUpgrade('pro', 'free', false)).toBe(false);
  });
});

describe('the early-access safety rule', () => {
  it('never locks a Pro tool while there is no way to buy Pro', () => {
    // The dangerous combination is gated-but-unbuyable: it would strand users with no
    // way out. proToolsGated is derived from paidPlansAvailable to make that impossible.
    expect(proToolsGated && !paidPlansAvailable).toBe(false);
  });

  it('is still in early access, so Pro tools stay open for now', () => {
    expect(proToolsGated).toBe(false);
    expect(requiresUpgrade('pro', 'free')).toBe(false);
  });
});
