import { expect, test } from './fixtures';
import { categories, tools } from '../../src/tools/registry';
import { en } from '../../src/i18n/en';

/**
 * The front page offers every tool through category tabs (a radio group, no script): one category is shown at a
 * time, and every category's tools are in the HTML whether or not its tab is the selected one.
 * (The sidebar is a separate thing and is unchanged: a page opens only its own category there.)
 */
test.use({ viewport: { width: 1280, height: 900 } });

test('the front page has a tab for each category and starts on the first', async ({ page }) => {
  await page.goto('/');
  const labels = page.locator('.home-tabs__bar label');
  await expect(labels).toHaveCount(categories.length);
  for (let i = 0; i < categories.length; i++) {
    await expect(labels.nth(i)).toHaveText(en.common.categories[categories[i]!]);
  }
  await expect(page.locator(`#home-tab-${categories[0]}`)).toBeChecked();
  for (const tool of tools.filter((t) => t.category === categories[0])) {
    await expect(page.locator(`.home-tabs__panel--${categories[0]} a[href$="/${tool.slug}/"]`), tool.id).toBeVisible();
  }
});

test('choosing a tab shows that category and hides the others', async ({ page }) => {
  await page.goto('/');
  for (const category of categories) {
    await page.locator(`label[for="home-tab-${category}"]`).click();
    await expect(page.locator(`#home-tab-${category}`)).toBeChecked();
    await expect(page.locator(`.home-tabs__panel--${category}`)).toBeVisible();
    for (const other of categories.filter((c) => c !== category)) {
      await expect(page.locator(`.home-tabs__panel--${other}`), `${other} is hidden while ${category} is shown`).toBeHidden();
    }
  }
});

test('every tool is in the page whichever tab is showing, so a crawler sees all of them', async ({ page }) => {
  await page.goto('/');
  for (const category of categories) {
    const expected = tools.filter((tool) => tool.category === category).length;
    await expect(page.locator(`.home-tabs__panel--${category} .tool-grid li`), category).toHaveCount(expected);
  }
});

test('the tabs work with the keyboard: arrow keys move between them', async ({ page }) => {
  await page.goto('/');
  await page.locator(`#home-tab-${categories[0]}`).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(`#home-tab-${categories[1]}`)).toBeChecked();
  await expect(page.locator(`.home-tabs__panel--${categories[1]}`)).toBeVisible();
});

test('on a phone the tabs are one row and the selected category is shown', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.locator(`.home-tabs__panel--${categories[0]}`)).toBeVisible();
  await page.locator(`label[for="home-tab-${categories[1]}"]`).click();
  await expect(page.locator(`.home-tabs__panel--${categories[1]}`)).toBeVisible();
});

test("the sidebar is unchanged: a tool page opens only that tool's own category in it", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('toolsSidebarVisible', 'visible'));
  await page.goto('/split-pdf');
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveCount(1);
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveAttribute('data-category', 'organize');
});

test('the tools come first and "What is LeafLock PDF?" sits below them', async ({ page }) => {
  await page.goto('/');
  const hero = (await page.locator('.home-hero').boundingBox())!;
  const tabs = (await page.locator('.home-tabs').boundingBox())!;
  const answer = (await page.locator('.answer').boundingBox())!;
  expect(tabs.y, 'the tabs are inside the hero, at the top').toBeLessThan(hero.y + hero.height);
  expect(answer.y, 'the definition is below the hero and its tools').toBeGreaterThanOrEqual(hero.y + hero.height - 1);
  await expect(page.locator('.answer h2')).toHaveText('What is LeafLock PDF?');
});
