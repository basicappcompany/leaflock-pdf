import { describe, expect, it } from 'vitest';
import { en as messages } from '../../src/i18n/en';
import { tools } from '../../src/tools/registry';

/**
 * The pricing page has to name every tool it charges for, under the right plan.
 *
 * Written after finding the Pro feature list naming two of six Pro tools: batch, extract
 * tables, Bates numbering and PDF/A were all gated and all unmentioned, so the page
 * understated what Pro buys. That is the same failure as the free tier advertising 5/30
 * against a real 20/60 (`docs/process.md` §8) with the sign flipped — and this direction
 * costs revenue, because a buyer cannot choose a plan on features it does not list.
 *
 * Extended 30 October 2026 with the Practice tier (roadmap 4.9). A second paid tier adds a
 * failure the single-tier version could not have: copy that names a tool under the *wrong*
 * plan, which is worse than omitting it — someone pays $24 for six tools that cost $249.
 * So each paid tier is checked against the registry both ways round.
 */

const paidTiers = ['pro', 'practice'] as const;
type PaidTier = (typeof paidTiers)[number];

const featuresFor = (tier: PaidTier) => messages.pricing.plans[tier].features.join('\n');
const toolsIn = (tier: PaidTier) => tools.filter((tool) => tool.tier === tier);
const titleOf = (id: (typeof tools)[number]['id']) => messages.tools[id].title;

describe('paid pricing copy', () => {
  it('has paid tools to describe at all', () => {
    // Guards the guards: if the registry's shape changes and these filters silently return
    // nothing, the per-tier assertions below would pass by describing empty sets. Asked of
    // the paid tools as a whole rather than per tier, because Pro deliberately has none of
    // its own since 4.9 — that is pinned by its own test at the bottom instead.
    expect(tools.filter((tool) => tool.tier !== 'free').length).toBeGreaterThan(0);
  });

  it.each(paidTiers)('names every %s tool by its own title', (tier) => {
    const copy = featuresFor(tier);
    const missing = toolsIn(tier)
      .map((tool) => ({ id: tool.id, title: titleOf(tool.id) }))
      .filter((tool) => !copy.includes(tool.title));

    expect(
      missing.map((tool) => `${tool.id} ("${tool.title}")`),
      `these tools charge money but are not named in the ${tier} feature list`,
    ).toEqual([]);
  });

  it.each(paidTiers)('does not advertise a free tool as a %s feature', (tier) => {
    // The opposite drift, and the more damaging one: naming something as paid that is
    // actually free makes the free tier look smaller than it is and invites a refund
    // argument. OCR is the deliberate case — Adobe gates it, we give it away.
    const copy = featuresFor(tier);
    const freeToolsClaimed = tools
      .filter((tool) => tool.tier === 'free')
      .map((tool) => ({ id: tool.id, title: titleOf(tool.id) }))
      .filter((tool) => copy.includes(tool.title));

    expect(
      freeToolsClaimed.map((tool) => `${tool.id} ("${tool.title}")`),
      `these are free but listed as ${tier} features`,
    ).toEqual([]);
  });

  it('does not sell a Practice tool under Pro', () => {
    // The six moved up a tier on 30 October 2026. Listing any of them under Pro would
    // promise a $249 tool to a $24 subscriber, which the gate then refuses — the worst
    // of the three drifts, because the buyer finds out after paying.
    const copy = featuresFor('pro');
    const misfiled = toolsIn('practice')
      .map((tool) => ({ id: tool.id, title: titleOf(tool.id) }))
      .filter((tool) => copy.includes(tool.title));

    expect(
      misfiled.map((tool) => `${tool.id} ("${tool.title}")`),
      'these are Practice tools but are listed as Pro features',
    ).toEqual([]);
  });

  it('gates exactly the six tools the owner settled on, 30 October 2026', () => {
    // The tiering decision from roadmap 4.1, pinned so a later change is a deliberate edit
    // to this list rather than a silent re-tier. Sign PDF was the one candidate considered
    // and deliberately left free: it is the clearest demonstration of the whole product —
    // sign a contract without it leaving your machine — and gating the best demo costs more
    // than it earns. Compress levels and OCR are free by published promise in
    // src/content/compare/en/, so they are not open questions either.
    //
    // Which six is unchanged by 4.9; the tier they sit in is not. They are Practice now.
    expect(toolsIn('practice').map((tool) => tool.id).sort()).toEqual(
      ['batch', 'batesNumber', 'compare', 'extractTables', 'pdfToPdfA', 'redact'].sort(),
    );
  });

  it('leaves Pro with no gated tools of its own', () => {
    // Deliberate, and recorded here so it reads as a decision rather than an oversight:
    // at $24 Pro sells the removed daily limit and device retention, not a tool list
    // (docs/roadmap.md, the 30 October pricing table). If a tool is ever tiered to Pro,
    // this test fails and the Pro feature list above has to name it.
    expect(toolsIn('pro').map((tool) => tool.id)).toEqual([]);
  });

  it('keeps OCR free, which is a recorded conversion argument', () => {
    // docs/roadmap.md Phase 4: "Adobe also gates full OCR, which we give away — keep it
    // that way, it is a conversion argument." A silent re-tier would contradict the plan.
    expect(tools.find((tool) => tool.id === 'ocr')?.tier).toBe('free');
  });

  it('promises nothing as "coming" that already ships', () => {
    // This string previously named batch processing (a shipped Pro tool) and an
    // installable offline app (shipped in Phase 1, free to everyone).
    const coming = messages.pricing.comingToPro.toLowerCase();
    for (const tool of tools) {
      expect(coming, `${tool.id} already ships, so it cannot be "coming"`).not.toContain(
        titleOf(tool.id).toLowerCase(),
      );
    }
    expect(coming).not.toMatch(/installable|works offline/);
  });
});
