import { readFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { businessYearlyTarget, prices } from '../../src/lib/pricing';

/**
 * Every price the site states in words must be one the code actually charges.
 *
 * The sibling of `statedLimits.test.ts`, and written for the same reason one tier later.
 * On 30 October 2026 the owner reset every price — Pro $59 → $24, monthly $8 → $4, the
 * prepaid term $599 → $120, Business $299 → $499 — and added Practice at $249. The
 * constants live in one file, but the numbers were *also* spelled out in the help page's
 * price list, the Business page's price section and the pricing page's meta description:
 * Markdown and prose, invisible to the type checker and to every test that existed.
 *
 * That is the exact shape of the failure `docs/process.md` §8 records for the daily
 * allowances, and it is worse for prices, because a published price a buyer can screenshot
 * is a claim about what we will charge them.
 */

/** Phrasings that state a price. Each capture group is a dollar figure that must match. */
const CLAIM_PATTERNS = [
  /US\$(\d[\d,]*)/g,
  /\$(\d[\d,]*)\s*(?:a|per|\/)\s*(?:month|year|company)/gi,
  /\$(\d[\d,]*)\s+(?:once|one time)/gi,
];

/**
 * Figures a stated price is allowed to be: what we charge, plus the published future
 * Business price, which `business.md` states deliberately and `pricing.ts` holds as
 * `businessYearlyTarget`. A competitor's price quoted in this phrasing has to be added
 * here with its source, so that it becomes a visible decision rather than a number
 * nobody can check — the same rule the allowances test uses.
 */
const ALLOWED = new Set<number>([...Object.values(prices), businessYearlyTarget]);

const ROOTS = ['src/content', 'src/i18n'];
const EXTENSIONS = ['.md', '.ts'];

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return walk(path);
      return EXTENSIONS.some((ext) => entry.name.endsWith(ext)) ? [path] : [];
    }),
  );
  return files.flat();
}

describe('stated prices', () => {
  it('match the constants in src/lib/pricing.ts, everywhere they are written out', async () => {
    const repoRoot = new URL('../../', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
    const files = (await Promise.all(ROOTS.map((root) => walk(join(repoRoot, root))))).flat();
    expect(files.length, 'found no content or i18n files to check').toBeGreaterThan(0);

    const wrong: string[] = [];
    for (const file of files) {
      // Legal placeholders are not product prices: terms.md carries an unsettled
      // liability cap written as "[TO CONFIRM: minimum amount, e.g. US$50]", which is
      // owned by docs/legal-checklist.md and roadmap 6.3, not by src/lib/pricing.ts.
      const text = (await readFile(file, 'utf8')).replace(/\[TO CONFIRM:[^\]]*\]/g, '');
      for (const pattern of CLAIM_PATTERNS) {
        for (const match of text.matchAll(pattern)) {
          for (const captured of match.slice(1).filter(Boolean)) {
            if (ALLOWED.has(Number(captured.replace(/,/g, '')))) continue;
            const line = text.slice(0, match.index).split('\n').length;
            wrong.push(
              `${relative(repoRoot, file).split(sep).join('/')}:${line} says "${match[0].trim()}"`,
            );
          }
        }
      }
    }

    expect(
      wrong,
      'These state a price that src/lib/pricing.ts does not hold ' +
        `(allowed: ${[...ALLOWED].sort((a, b) => a - b).join(', ')}):\n  ${wrong.join('\n  ')}\n`,
    ).toEqual([]);
  });

  it('keeps a year of Pro cheaper than twelve months of it', () => {
    // The reason both numbers exist, and what the "save N%" string on the pricing page
    // claims. If a future change inverts them, that string becomes a false saving.
    expect(prices.proYearly).toBeLessThan(prices.proMonthly * 12);
  });

  it('keeps the tiers in the order the plans describe', () => {
    // Practice is sold as "everything in Pro, plus the six professional tools", and
    // Business as more again. A price list that contradicts that ordering would make the
    // more expensive plan the smaller one — which is the mistake the Business price was
    // raised to $499 on 30 October 2026 to avoid.
    expect(prices.proYearly).toBeLessThan(prices.practiceYearly);
    expect(prices.practiceYearly).toBeLessThan(prices.businessYearly);
    expect(prices.businessYearly).toBeLessThanOrEqual(businessYearlyTarget);
  });

  it('prices ten years of Pro below ten years of the yearly plan', () => {
    // What makes the prepaid term worth buying, and the check that stops it being
    // repriced into a worse deal than simply renewing.
    expect(prices.proTenYear).toBeLessThan(prices.proYearly * 10);
  });
});
