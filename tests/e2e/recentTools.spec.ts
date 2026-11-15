import { expect, test } from './fixtures';
import { en } from '../../src/i18n/en';
import { watchPage } from './helpers';

/**
 * The "Recent tools" group at the top of the sidebar, the icon-only theme button, and the
 * scrolled header. All three read device-local state only; none of them sends anything.
 */

const KEY = 'leaflock-recent';

async function seed(page: import('@playwright/test').Page, entries: { tool: string; at: number }[]) {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key!, value!),
    [KEY, JSON.stringify(entries)],
  );
}

test('sidebar: no Recent group while nothing has been used', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/split-pdf');
  await expect(page.locator('#toolsSidebar')).toBeVisible();
  await expect(page.locator('#sidebarRecent')).toBeHidden();
  await expect(page.locator('#sidebarRecent')).toHaveCount(0);
  watch.assertClean();
});

test('sidebar: recently used tools sit at the top, newest first, and link to the tool', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const now = Date.now();
  await seed(page, [
    { tool: 'rotate', at: now - 3_600_000 },
    { tool: 'merge', at: now - 60_000 },
    { tool: 'not-a-tool', at: now },
  ]);
  await page.goto('/split-pdf');

  const group = page.locator('#sidebarRecent');
  await expect(group).toBeVisible();
  await expect(group.locator('summary')).toContainText(en.common.sidebar.recent);
  const rows = group.locator('li');
  // The unknown id is skipped; the other two are ordered newest first.
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText(en.tools.merge.title);
  await expect(rows.nth(1)).toContainText(en.tools.rotate.title);

  // The group comes before the first category.
  const groupTop = (await group.boundingBox())!.y;
  const firstCategoryTop = (await page.locator('.tools-sidebar__group').first().boundingBox())!.y;
  expect(groupTop).toBeLessThan(firstCategoryTop);

  await rows.nth(1).getByRole('link').click();
  await expect(page).toHaveURL(/rotate/);
  watch.assertClean();
});

test('sidebar: searching hides the Recent group, clearing the search brings it back', async ({ page }) => {
  await seed(page, [{ tool: 'merge', at: Date.now() }]);
  await page.goto('/split-pdf');
  const group = page.locator('#sidebarRecent');
  await expect(group).toBeVisible();

  await page.locator('#sidebarSearch').fill('rotate');
  await expect(group).toBeHidden();
  await page.locator('#sidebarSearch').fill('');
  await expect(group).toBeVisible();
});

test('theme button: an icon only, still named for assistive technology', async ({ page }) => {
  await page.goto('/');
  const button = page.locator('.theme-toggle');
  await expect(button).toHaveText('');
  await expect(button).toHaveAttribute('aria-label', /.+/);
  await expect(button.locator('svg:visible')).toHaveCount(1);
  const box = (await button.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(36);
});

test('scrolled header: language and theme buttons stay, in the right-most corner', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  // Make the page long enough to scroll whatever its content, through the CSSOM.
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '3000px';
    document.body.appendChild(spacer);
  });
  await page.evaluate(() => window.scrollTo(0, 600));
  await expect(page.locator('.site-chrome')).toHaveClass(/site-chrome--condensed/);

  const lang = page.locator('.lang-switcher summary');
  const theme = page.locator('.theme-toggle');
  await expect(lang).toBeVisible();
  await expect(theme).toBeVisible();

  const langBox = (await lang.boundingBox())!;
  const themeBox = (await theme.boundingBox())!;
  // In order, with the theme button at the far right edge of the window.
  expect(themeBox.x).toBeGreaterThan(langBox.x);
  expect(1280 - (themeBox.x + themeBox.width)).toBeLessThan(40);
  watch.assertClean();
});

test('sidebar: the Recent group collapses, and stays collapsed on the next page', async ({ page }) => {
  await seed(page, [{ tool: 'merge', at: Date.now() }]);
  await page.goto('/split-pdf');
  const group = page.locator('#sidebarRecent');
  await expect(group).toHaveJSProperty('open', true);

  await group.locator('summary').click();
  await expect(group).toHaveJSProperty('open', false);
  await expect(group.locator('li')).toBeHidden();

  await page.goto('/rotate-pdf');
  await expect(page.locator('#sidebarRecent')).toHaveJSProperty('open', false);
  await page.locator('#sidebarRecent summary').click();
  await expect(page.locator('#sidebarRecent')).toHaveJSProperty('open', true);
});

test('sidebar: no "All tools" title in it', async ({ page }) => {
  await page.goto('/split-pdf');
  await expect(page.locator('#toolsSidebar')).not.toContainText(en.common.sidebar.allTools);
});

test('sidebar sits flush under the header after scrolling, with no gap', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/split-pdf');
  await page.evaluate(() => {
    const spacer = document.createElement('div');
    spacer.style.height = '4000px';
    document.body.appendChild(spacer);
  });
  for (const y of [100, 600, 1500]) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    // The header shrinks over 0.2s; the sidebar must follow it to the pixel once it settles.
    await expect
      .poll(async () =>
        page.evaluate(() => {
          const chrome = document.querySelector('.site-chrome')!.getBoundingClientRect();
          const sidebar = document.querySelector('#toolsSidebar')!.getBoundingClientRect();
          return Math.round(sidebar.top - chrome.bottom);
        }),
      )
      .toBe(0);
  }
});
