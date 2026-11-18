import { expect, test } from './fixtures';
import { en } from '../../src/i18n/en';
import { categories, tools } from '../../src/tools/registry';
import { watchPage } from './helpers';

/**
 * The category hub pages at /tools/<category> — the "category-hub" half of the Phase 1
 * item in docs/roadmap.md (the other half, related-tools on every tool page, already
 * existed and needed nothing further).
 */

for (const category of categories) {
  const inCategory = tools.filter((tool) => tool.category === category);

  test(`/tools/${category} lists every tool in that category, cleanly`, async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    const response = await page.goto(`/tools/${category}`);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toContainText(en.common.categories[category]);
    for (const tool of inCategory) {
      await expect(page.getByRole('link', { name: new RegExp(en.tools[tool.id].title) }).first()).toBeVisible();
    }

    const json = await page.locator('script[type="application/ld+json"]').first().textContent();
    const graph = JSON.parse(json!)['@graph'] as Record<string, unknown>[];
    const list = graph.find((item) => item['@type'] === 'ItemList');
    expect(list?.numberOfItems).toBe(inCategory.length);

    watch.assertClean();
  });
}

test('a tool page links back into its category hub, from both the breadcrumb and its schema', async ({ page }) => {
  await page.goto('/merge-pdf');

  const crumb = page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: en.common.categories.organize });
  await expect(crumb).toHaveAttribute('href', /\/tools\/organize\/?$/);

  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const graph = JSON.parse(json!)['@graph'] as { '@type': string; itemListElement?: { name: string; item: string }[] }[];
  const trail = graph.find((item) => item['@type'] === 'BreadcrumbList')?.itemListElement ?? [];
  expect(trail.map((step) => step.name)).toEqual([en.common.site.name, en.common.categories.organize, en.tools.merge.title]);
});

test('the home page links each category into its hub', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');
  for (const category of categories) {
    // The hub link is the "See all" line in each category's tab panel; pick the tab to reveal it.
    await page.locator(`label[for="home-tab-${category}"]`).click();
    await expect(page.locator(`.home-tabs__links a[data-category="${category}"]`)).toHaveAttribute('href', new RegExp(`/tools/${category}/?$`));
  }
  watch.assertClean();
});
