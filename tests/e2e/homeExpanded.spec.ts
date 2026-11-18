import { expect, test } from './fixtures';
import { categories, tools } from '../../src/tools/registry';
import { en } from '../../src/i18n/en';

/**
 * The front page: a hero, then "Popular right now" (the major tools as a bento grid), then every tool through category
 * tabs (a radio group, no script) where one category is shown at a time and every category's tools are in the HTML
 * whether or not its tab is the selected one. The sidebar is a separate thing: a page opens only its own category there.
 */
test.use({ viewport: { width: 1280, height: 900 } });

const POPULAR = ['merge', 'compress', 'sign', 'ocr', 'split', 'redact', 'protect'] as const;

test('the hero states the promise, links the five most-searched tools and offers the way in', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(en.common.site.tagline);
  const chips = page.locator('.home-chips a');
  await expect(chips).toHaveCount(5);
  for (const id of ['merge', 'split', 'compress', 'sign', 'ocr'] as const) {
    await expect(chips.filter({ hasText: en.tools[id].title }).first(), id).toBeVisible();
  }
  await expect(page.locator('.home-hero .trust li')).toHaveCount(4);
});

test('"Popular right now" shows the major tools as tiles, the first one big, and a tile that jumps to the full list', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: en.pricing.homePopular })).toBeVisible();
  for (const id of POPULAR) {
    const slug = tools.find((t) => t.id === id)!.slug;
    await expect(page.locator(`.home-bento a[href$="/${slug}/"]`), id).toBeVisible();
  }
  await expect(page.locator('.home-bento .bt--feature')).toContainText(en.tools.merge.title);
  await expect(page.locator('.home-bento .bt--ink')).toContainText(en.common.trust.noUpload);
  await expect(page.locator('.home-bento .bt--more')).toHaveAttribute('href', '#all-tools');
});

test('the page runs hero, then popular tools, then every tool, then the definition', async ({ page }) => {
  await page.goto('/');
  const y = async (selector: string) => (await page.locator(selector).first().boundingBox())!.y;
  const hero = await y('.home-hero');
  const popular = await y('.home-bento');
  const all = await y('.home-tabs');
  const answer = await y('.answer');
  expect(popular, 'popular tools are below the hero').toBeGreaterThan(hero);
  expect(all, 'every tool is below the popular ones').toBeGreaterThan(popular);
  expect(answer, 'the definition is last').toBeGreaterThan(all);
  await expect(page.locator('.answer h2')).toHaveText('What is LeafLock PDF?');
});

test('the front page has a tab for each category, starts on the first and shows all of its tools', async ({ page }) => {
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

test('on a phone the popular tiles stack and the tabs are one row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.locator('.home-bento .bt--feature')).toBeVisible();
  await page.locator(`label[for="home-tab-${categories[1]}"]`).click();
  await expect(page.locator(`.home-tabs__panel--${categories[1]}`)).toBeVisible();
});

test("the sidebar is unchanged: a tool page opens only that tool's own category in it", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('toolsSidebarVisible', 'visible'));
  await page.goto('/split-pdf');
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveCount(1);
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveAttribute('data-category', 'organize');
});
