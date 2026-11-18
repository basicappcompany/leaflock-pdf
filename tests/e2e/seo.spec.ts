import { expect, test } from './fixtures';
import { en } from '../../src/i18n/en';
import { contentPages } from '../../src/lib/siteLinks';
import { landings, tools } from '../../src/tools/registry';
import { watchPage } from './helpers';

const sitePages = ['', 'pricing', 'guides', 'compare', ...contentPages];

for (const path of sitePages) {
  test(`/${path} loads cleanly with SEO basics`, async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    const response = await page.goto(`/${path}`);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/leaflockpdf\.com\//);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    watch.assertClean();
  });
}

test('tool and landing pages carry structured data and a share image', async ({ page, request }) => {
  for (const slug of [...tools.map((tool) => tool.slug), ...landings.map((landing) => landing.slug)]) {
    await page.goto(`/${slug}`);
    const json = await page.locator('script[type="application/ld+json"]').textContent();
    const types = (JSON.parse(json!)['@graph'] as { '@type': string }[]).map((item) => item['@type']);
    expect(types, slug).toEqual(
      expect.arrayContaining(['Organization', 'WebSite', 'WebApplication', 'HowTo', 'BreadcrumbList', 'FAQPage']),
    );

    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    const imagePath = new URL(image!).pathname;
    expect((await request.get(imagePath)).status(), imagePath).toBe(200);
  }
});

test('sitemap lists every page, with language alternates', async ({ request }) => {
  const xml = await (await request.get('/sitemap.xml')).text();
  for (const path of [...sitePages, ...tools.map((tool) => tool.slug), ...landings.map((landing) => landing.slug)]) {
    const url = `https://leaflockpdf.com/${path}${path ? '/' : ''}`;
    expect(xml, path).toContain(`<loc>${url}</loc>`);
  }
  expect(xml).toContain('hreflang="x-default"');
  // English only until its pages are indexed (SITEMAP_LOCALES in src/lib/sitemap.ts).
  expect(xml).not.toContain('<loc>https://leaflockpdf.com/de/');

  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Sitemap: https://leaflockpdf.com/sitemap.xml');
});

test('unknown pages show the 404 page, kept out of search', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
  await expect(page.getByRole('link', { name: 'Merge PDF' }).first()).toBeVisible();
});

test('tools menu opens, lists every tool and closes with Escape', async ({ page }) => {
  await page.goto('/');
  const menu = page.locator('.tools-menu');
  await menu.locator('summary').click();
  await expect(menu.locator('.tools-menu__panel a')).toHaveCount(tools.length);
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
});

test('the home page carries the whole catalogue as one list', async ({ page }) => {
  await page.goto('/');
  const json = await page.locator('script[type="application/ld+json"]').first().textContent();
  const list = (JSON.parse(json!)['@graph'] as Record<string, unknown>[]).find((item) => item['@type'] === 'ItemList');

  // Every tool, so an assistant asked what the site does has one place to read it.
  expect(list?.numberOfItems).toBe(tools.length);
});

test('llms.txt states the claim and links every tool', async ({ request }) => {
  const response = await request.get('/llms.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  const body = await response.text();

  // The three facts that must survive being quoted out of context.
  expect(body).toContain("connect-src 'self'");
  expect(body).toContain('never uploaded');
  expect(body).toContain('no network connection');
  for (const tool of tools) {
    expect(body, tool.slug).toContain(`/${tool.slug}/`);
  }
});

test('llms-full.txt carries every tool page in one fetch', async ({ request }) => {
  const response = await request.get('/llms-full.txt');
  expect(response.status()).toBe(200);
  const body = await response.text();

  for (const tool of tools) {
    expect(body, tool.id).toContain(en.tools[tool.id].title);
    // The steps, not just the title: this file stands in for reading the page.
    expect(body, tool.id).toContain(en.tools[tool.id].howTo[0]!);
  }
  // A paid tool must name the plan it needs, or the file misrepresents what is free — and
  // since 4.9 there are two paid tiers, so a generic "paid plan" is not enough to answer
  // which. Derived from the registry, so re-tiering a tool fails here until the file follows.
  for (const tool of tools.filter((item) => item.tier !== 'free')) {
    const plan = en.common.toolPage.tiers[tool.tier].label;
    expect(body, tool.id).toContain(`Requires the ${plan} plan.`);
  }
});
