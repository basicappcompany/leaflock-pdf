import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { paidPlansAvailable } from '../../src/lib/pricing';
import { tierBadgeText } from '../../src/lib/tierBadge';

/**
 * While paid plans are not on sale, a Pro or Practice badge must say the tool is free, and the
 * home page must say so above the tool grid (owner instruction, 12 November 2026). Both come from
 * `paidPlansAvailable`, so flipping it removes the wording everywhere. This reads the page
 * sources because the failure it guards against is a new badge site that forgets the helper.
 */
const read = (file: string) => readFileSync(file, 'utf8');

describe('early access is visible wherever a tier badge is drawn', () => {
  it('words the badge from paidPlansAvailable', () => {
    expect(tierBadgeText('Pro', 'Free now')).toBe(paidPlansAvailable ? 'Pro' : 'Pro · Free now');
  });

  for (const file of ['src/pages/index.astro', 'src/pages/[tool].astro', 'src/pages/tools/[category].astro']) {
    it(`${file} draws its tier badge through tierBadgeText`, () => {
      const source = read(file);
      const badges = source.match(/<span class="badge-pro">.*<\/span>/g) ?? [];
      expect(badges.length, `${file} has no tier badge`).toBeGreaterThan(0);
      for (const badge of badges) expect(badge, `${file}: ${badge}`).toContain('tierBadgeText(');
    });
  }

  it('the home page states early access above the tool grid', () => {
    const source = read('src/pages/index.astro');
    expect(source).toContain('pricing.homeNotice');
    expect(source.indexOf('homeNotice')).toBeLessThan(source.indexOf('categories.map'));
  });
});
