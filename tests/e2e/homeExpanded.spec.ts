import { expect, test } from './fixtures';
import { categories, tools } from '../../src/tools/registry';
import { en } from '../../src/i18n/en';

/**
 * The front page: a hero, with the major tools as a bento grid beside the headline, then every tool through category
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

test('the major tools show the major tools as tiles, the first one big, and a tile that jumps to the full list', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('group', { name: en.pricing.homePopular })).toBeVisible();
  for (const id of POPULAR) {
    const slug = tools.find((t) => t.id === id)!.slug;
    await expect(page.locator(`.home-bento a[href$="/${slug}/"]`), id).toBeVisible();
  }
  await expect(page.locator('.home-bento .bt--feature')).toContainText(en.tools.merge.title);
  await expect(page.locator('.home-bento .bt--ink')).toContainText(en.common.trust.noUpload);
  await expect(page.locator('.home-bento .bt--more')).toHaveAttribute('href', '#all-tools');
});

test('the page runs hero with the popular tools beside the headline, then every tool, then the definition', async ({ page }) => {
  await page.goto('/');
  const y = async (selector: string) => (await page.locator(selector).first().boundingBox())!.y;
  const hero = await y('.home-hero');
  const popular = await y('.home-bento');
  const text = await y('.home-hero__text');
  const all = await y('.home-tabs');
  const answer = await y('.answer');
  expect(popular, 'the popular tools sit in the hero').toBeLessThan(hero + 400);
  expect(text).toBeGreaterThanOrEqual(hero);
  expect(all, 'every tool is below the popular ones').toBeGreaterThan(popular);
  expect(answer, 'the definition is last').toBeGreaterThan(all);
  await expect(page.locator('.answer h2')).toHaveText('What is LeafLock PDF?');
});

test('the front page has an All tab plus one per category, starts on All and shows every tool', async ({ page }) => {
  await page.goto('/');
  const labels = page.locator('.home-tabs__bar label');
  await expect(labels).toHaveCount(categories.length + 1);
  await expect(labels.first()).toHaveText(en.common.site.allTools);
  for (let i = 0; i < categories.length; i++) {
    await expect(labels.nth(i + 1)).toHaveText(en.common.categories[categories[i]!]);
  }
  await expect(page.locator('#home-tab-all')).toBeChecked();
  for (const tool of tools) {
    await expect(page.locator(`.home-tabs__panel a[href$="/${tool.slug}/"]`), tool.id).toBeVisible();
  }
  // Under All, every category's "See all" link is offered, then "See all tools" (to the footer directory).
  await expect(page.locator('.home-tabs__links a')).toHaveCount(categories.length + 1);
  await expect(page.locator('.home-tabs__links .home-tabs__all')).toHaveText(en.pricing.homeSeeAll);
  for (const category of categories) {
    await expect(page.locator(`.home-tabs__links a[data-category="${category}"]`)).toBeVisible();
  }
});

test('choosing a category tab shows only that category (and its See all link) and All brings everything back', async ({ page }) => {
  await page.goto('/');
  for (const category of categories) {
    await page.locator(`label[for="home-tab-${category}"]`).click();
    await expect(page.locator(`#home-tab-${category}`)).toBeChecked();
    const mine = tools.filter((t) => t.category === category).length;
    await expect(page.locator('.home-tabs__panel .tool-grid li:visible'), category).toHaveCount(mine);
    await expect(page.locator(`.home-tabs__panel li[data-category="${category}"]`).first()).toBeVisible();
    await expect(page.locator('.home-tabs__links a:visible'), category).toHaveCount(1);
    await expect(page.locator('.home-tabs__show'), category).toHaveText(en.pricing.homeSeeAll);
  }
  await page.locator('.home-tabs__bar label[for="home-tab-all"]').click();
  await expect(page.locator('.home-tabs__panel .tool-grid li:visible')).toHaveCount(tools.length);
});

test('every tool is in the page whichever tab is showing, so a crawler sees all of them', async ({ page }) => {
  await page.goto('/');
  await page.locator(`label[for="home-tab-${categories[1]}"]`).click();
  await expect(page.locator('.home-tabs__panel .tool-grid li')).toHaveCount(tools.length);
});

test('the tabs work with the keyboard: arrow keys move between them', async ({ page }) => {
  await page.goto('/');
  await page.locator('#home-tab-all').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator(`#home-tab-${categories[0]}`)).toBeChecked();
  await expect(page.locator(`.home-tabs__panel li[data-category="${categories[0]}"]`).first()).toBeVisible();
});

test('on a phone the popular tiles stack and the tabs are one row', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  await expect(page.locator('.home-bento .bt--feature')).toBeVisible();
  await page.locator(`label[for="home-tab-${categories[1]}"]`).click();
  await expect(page.locator(`.home-tabs__panel li[data-category="${categories[1]}"]`).first()).toBeVisible();
});

test("the sidebar is unchanged: a tool page opens only that tool's own category in it", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('toolsSidebarVisible', 'visible'));
  await page.goto('/split-pdf');
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveCount(1);
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveAttribute('data-category', 'organize');
});
