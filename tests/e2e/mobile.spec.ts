import { expect, test } from '@playwright/test';
import { contentPages } from '../../src/lib/siteLinks';
import { landings, tools } from '../../src/tools/registry';
import { makePdf } from '../fixtures/pdfs';
import { pdfUpload, watchPage } from './helpers';

/**
 * Mobile usability, as a regression gate rather than a one-off pass.
 *
 * 360×740 rather than a specific iPhone: most Android phones sit at 360-412px wide and
 * iPhones at 375-430px, so 360 is closer to the tightest real case this site has to
 * survive. Two kinds of check:
 *
 *   - **No horizontal overflow**, across every page the site has. Cheap (pure DOM
 *     measurement, no screenshot), so there is no reason to sample instead of checking
 *     all of them — the same reasoning site.spec.ts uses for its per-tool loop.
 *   - **Touch targets**, on a representative sample rather than everywhere. A target
 *     size rule applied to every link on every page would also have to encode "except
 *     a link inside a sentence," which is exactly what WCAG 2.5.8 itself exempts —
 *     body-copy links are not held to this; the header, footer and a tool's own
 *     controls are.
 *
 * Written after an actual pass over the site found the real problems these assert
 * against: a header that wrapped nav links across up to four rows with no padding
 * (~24px tall, no visible button shape), and 32px icon buttons for page-grid and
 * file-list controls that are fine with a cursor but tight for a thumb. See the
 * `.nav-link`, `.theme-toggle`, `.icon-button` and `.tool__actions` rules in
 * src/styles/global.css.
 */

test.use({ viewport: { width: 360, height: 740 } });

/** Apple HIG and Material both land near this; WCAG 2.5.8 AA's own floor is lower
 * (24px) but that minimum assumes adequate spacing, which a dense control row like
 * page-grid's four-icons-per-card does not have room for. */
const COMFORTABLE = 34;

const allPagePaths = [
  '',
  'pricing',
  'guides',
  'compare',
  // Listed explicitly, like the three above: /verify is neither a content-collection page
  // nor a tool, so nothing else in this list would reach it.
  'verify',
  ...contentPages,
  ...tools.map((tool) => tool.slug),
  ...landings.map((landing) => landing.slug),
];

for (const path of allPagePaths) {
  test(`/${path} has no horizontal overflow at 360px`, async ({ page }) => {
    await page.goto(`/${path}`, { waitUntil: 'domcontentloaded' });
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `${path || '/'}: content is wider than the viewport`).toBeLessThanOrEqual(clientWidth);
  });
}

test('the header keeps the brand, language, appearance and theme buttons on one row', async ({ page }) => {
  // 360 is the tightest real phone; 390 is a current iPhone, where the theme button was
  // seen wrapping onto a row of its own.
  for (const width of [360, 390, 412]) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    const rowTop = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, `${selector} at ${width}px`).not.toBeNull();
      return box!.y + box!.height / 2;
    };
    const brand = await rowTop('.site-header .brand');
    for (const selector of ['.lang-switcher summary', '.skin-picker summary', '.theme-toggle']) {
      expect(Math.abs((await rowTop(selector)) - brand), `${selector} shares the brand's row at ${width}px`).toBeLessThan(20);
    }
    const nav = await page.locator('.site-nav').boundingBox();
    expect(nav!.y, `nav sits below that row at ${width}px`).toBeGreaterThan(brand);
  }
});

test('every header control is a comfortable size to tap', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');

  const toolsMenuBox = await page.locator('.tools-menu summary').boundingBox();
  expect(toolsMenuBox?.height, 'the "All tools" summary').toBeGreaterThanOrEqual(COMFORTABLE);

  // Every plain nav link, visible ones only: the ToolsMenu panel's own links share no
  // class with these and are covered separately below, via the panel open.
  const navLinks = page.locator('.site-nav > a.nav-link');
  const count = await navLinks.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const box = await navLinks.nth(i).boundingBox();
    const label = await navLinks.nth(i).textContent();
    expect(box?.height, `nav link "${label}"`).toBeGreaterThanOrEqual(COMFORTABLE);
  }

  for (const option of await page.locator('.theme-toggle').all()) {
    const box = await option.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(COMFORTABLE);
    expect(box?.height).toBeGreaterThanOrEqual(COMFORTABLE);
  }

  watch.assertClean();
});

test('the tools menu panel lists every tool at a comfortable size once opened', async ({ page }) => {
  await page.goto('/');
  await page.locator('.tools-menu summary').click();

  const links = page.locator('.tools-menu__panel a');
  expect(await links.count()).toBe(tools.length);
  // One is enough to catch a regression in the shared rule; every link in the panel
  // comes from the same markup, so there is nothing tool-specific left to vary.
  const box = await links.first().boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(COMFORTABLE);
});

test('a tool page keeps its file controls and primary action reachable with a thumb', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/merge-pdf');
  await page.locator('input[type=file]').waitFor({ state: 'attached' });

  // Picking a file reveals the reorder/remove icon buttons this check is really about.
  // No merge is actually run, so the file's contents don't matter, but makePdf keeps
  // this consistent with how every other spec in this suite builds its fixtures.
  await page.setInputFiles('input[type=file]', pdfUpload('a.pdf', await makePdf([[300, 400]])));
  for (const button of await page.locator('.icon-button').all()) {
    const box = await button.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(COMFORTABLE);
  }

  // Full width, not a small target floating at the trailing edge of the row — the
  // specific change in .tool__actions .primary-button.
  const actionsBox = await page.locator('.tool__actions').boundingBox();
  const buttonBox = await page.locator('.tool__actions .primary-button').boundingBox();
  expect(buttonBox?.width, 'primary action width vs its row').toBeGreaterThanOrEqual((actionsBox?.width ?? 0) - 1);

  watch.assertClean();
});

test('footer links are easier to tap than plain text, even though they stay dense', async ({ page }) => {
  await page.goto('/');
  const link = page.locator('.site-footer li a').first();
  const box = await link.boundingBox();
  // Deliberately below COMFORTABLE: a list of every tool in the footer is expected to
  // stay compact. This only has to prove the deliberate 0.15rem→0.4rem padding change
  // is still there, not hold footer links to the primary-nav bar.
  expect(box?.height).toBeGreaterThanOrEqual(30);
});
