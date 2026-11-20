import { expect, test } from './fixtures';
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

test('the header is one row: brand, language, theme and the Menu button, with the skin picker inside the menu', async ({ page }) => {
  // 320 is the narrowest reflow width; 360 is the tightest real phone; 390 is a current iPhone.
  for (const width of [320, 360, 390, 412]) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    const rowTop = async (selector: string) => {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, `${selector} at ${width}px`).not.toBeNull();
      return box!.y + box!.height / 2;
    };
    const brand = await rowTop('.site-header .brand');
    for (const selector of ['.lang-switcher summary', '.theme-toggle', '.nav-toggle']) {
      expect(Math.abs((await rowTop(selector)) - brand), `${selector} shares the brand's row at ${width}px`).toBeLessThan(20);
    }
    // One slim row, not two or three.
    const header = await page.locator('.site-header').boundingBox();
    expect(header!.height, `the header is a single row at ${width}px`).toBeLessThan(70);
    // The skin picker is not in the bar; it appears inside the open menu.
    await expect(page.locator('.skin-picker')).toBeHidden();
    await page.locator('.nav-toggle').click();
    await expect(page.locator('.skin-picker summary')).toBeVisible();
    await page.locator('.nav-toggle').click();
  }
});

for (const path of ['/', '/merge-pdf']) {
  test(`scrolling ${path} on a phone never resizes the header or moves the content`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => {
      const spacer = document.createElement('div');
      spacer.style.height = '3000px';
      document.body.appendChild(spacer);
    });
    const measure = () =>
      page.evaluate(() => ({
        chrome: Math.round(document.querySelector('.site-chrome')!.getBoundingClientRect().height),
        header: Math.round(document.querySelector('.site-header')!.getBoundingClientRect().height),
        content: Math.round(document.querySelector('main')!.getBoundingClientRect().top + window.scrollY),
      }));
    const before = await measure();
    // Several stops, in both directions, as a thumb would: any layout change on the way shows up as a difference.
    for (const y of [20, 70, 200, 600, 1200, 300, 0]) {
      await page.evaluate((top) => window.scrollTo(0, top), y);
      await page.waitForTimeout(120);
      expect(await measure(), `at scrollY ${y}`).toEqual(before);
    }
    // And the header stays pinned to the top of the screen once the page has scrolled (the promo banner, where there is
    // one, has slid away with the page).
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(120);
    const headerTop = await page.evaluate(() => Math.round(document.querySelector('.site-header')!.getBoundingClientRect().top));
    expect(headerTop).toBe(0);
  });
}

test('every header control is a comfortable size to tap', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');

  const menuButtonBox = await page.locator('.nav-toggle').boundingBox();
  expect(menuButtonBox?.height, 'the Menu button').toBeGreaterThanOrEqual(COMFORTABLE);
  // The links are inside the Menu panel on a phone, so it has to be open to measure them.
  await page.locator('.nav-toggle').click();

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

test('on a phone the header links sit behind a Menu button, closed until it is pressed', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.nav-toggle');
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  // Closed: none of the links take up room in the header.
  for (const name of ['Guides', 'Security', 'Pricing', 'Business']) {
    await expect(page.locator('.site-nav').getByRole('link', { name, exact: true })).toBeHidden();
  }

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  for (const name of ['Guides', 'Security', 'Pricing', 'Business']) {
    await expect(page.locator('.site-nav').getByRole('link', { name, exact: true })).toBeVisible();
  }
  await expect(page.locator('.site-nav .tools-menu summary')).toBeVisible();

  // Escape closes it and returns focus to the button.
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.site-nav').getByRole('link', { name: 'Pricing', exact: true })).toBeHidden();
  await expect(toggle).toBeFocused();
});

for (const width of [320, 360, 390]) {
  test(`the language list opens from the right edge of the screen at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    await page.locator('.lang-switcher summary').click();
    const list = (await page.locator('.lang-switcher ul').boundingBox())!;
    expect(list.x, 'not off the left edge').toBeGreaterThanOrEqual(0);
    expect(width - (list.x + list.width), 'sits against the right edge, like the bar above it').toBeLessThanOrEqual(24);
    expect(width - (list.x + list.width), 'not off the right edge').toBeGreaterThanOrEqual(0);
  });
}

test('the skin picker, opened inside the Menu, stays on the screen', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-toggle').click();
  await page.locator('.skin-picker summary').click();
  const panel = (await page.locator('.skin-picker__panel').boundingBox())!;
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(360);
});

test('a tap anywhere outside the open Menu closes it, and a tap inside it does not', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('.nav-toggle');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  // Inside the panel, on its own padding rather than a link: it stays open.
  const panel = (await page.locator('.site-nav').boundingBox())!;
  // Mid-width, a few pixels down: inside the panel's own padding and clear of its rounded corners.
  await page.mouse.click(panel.x + panel.width / 2, panel.y + 4);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');

  // Out on the page: it closes.
  await page.mouse.click(180, 650);
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.site-nav').getByRole('link', { name: 'Pricing', exact: true })).toBeHidden();
});

test('the open Menu, with All tools expanded inside it, still fits the screen width', async ({ page }) => {
  for (const width of [320, 360, 412]) {
    await page.setViewportSize({ width, height: 740 });
    await page.goto('/');
    await page.locator('.nav-toggle').click();
    await page.locator('.site-nav .tools-menu summary').click();
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(scrollWidth, `open menu at ${width}px is wider than the viewport`).toBeLessThanOrEqual(clientWidth);
  }
});

test('on a wide screen there is no Menu button and the links show inline', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.locator('.nav-toggle')).toBeHidden();
  for (const name of ['Guides', 'Security', 'Pricing', 'Business']) {
    await expect(page.locator('.site-nav').getByRole('link', { name, exact: true })).toBeVisible();
  }
});

test('the tools menu panel lists every tool at a comfortable size once opened', async ({ page }) => {
  await page.goto('/');
  await page.locator('.nav-toggle').click();
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

test.describe('zoomed out (a very wide viewport)', () => {
  // A browser at 50% zoom on a 1280x720 window is a 2560x1440 CSS viewport.
  test.use({ viewport: { width: 2560, height: 1440 } });

  test('the header stays inside the page frame instead of spreading to the screen edges', async ({ page }) => {
    await page.goto('/');
    const brand = (await page.locator('.site-header .brand').boundingBox())!;
    const theme = (await page.locator('.theme-toggle').boundingBox())!;
    const frame = (2560 - 84 * 16) / 2; // the 84rem frame, centred
    expect(brand.x, 'brand starts inside the frame').toBeGreaterThanOrEqual(frame);
    expect(2560 - (theme.x + theme.width), 'theme button ends inside the frame').toBeGreaterThanOrEqual(frame);
  });

  test('the home hero does not stretch to the height of the window', async ({ page }) => {
    await page.goto('/');
    const hero = (await page.locator('.home-hero').boundingBox())!;
    // 46rem minimum cap plus its own padding; a screen-high hero would be about 1300px here.
    expect(hero.height).toBeLessThan(46 * 16 + 120);
  });
});
