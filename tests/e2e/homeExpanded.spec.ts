import { expect, test } from './fixtures';
import { categories } from '../../src/tools/registry';

/**
 * The front page shows everything on offer: every one of its own category sections starts open.
 * (The sidebar is a separate thing and is unchanged: a page opens only its own category there.)
 */
test.use({ viewport: { width: 1280, height: 900 } });

test('the front page opens every category section', async ({ page }) => {
  await page.goto('/');
  const sections = page.locator('details.category');
  await expect(sections).toHaveCount(categories.length);
  for (let i = 0; i < categories.length; i++) {
    await expect(sections.nth(i), `category ${i + 1} is open`).toHaveJSProperty('open', true);
  }
  // Their tools are on screen to be found, not behind a click.
  for (const category of categories) {
    await expect(page.locator(`.category--${category} .tool-grid li`).first()).toBeVisible();
  }
});

test('a visitor can still fold a section away', async ({ page }) => {
  await page.goto('/');
  const last = page.locator('details.category').last();
  await last.locator('summary').click();
  await expect(last).toHaveJSProperty('open', false);
});

test('on a phone every section is open too', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('/');
  const sections = page.locator('details.category');
  for (let i = 0; i < categories.length; i++) {
    await expect(sections.nth(i)).toHaveJSProperty('open', true);
  }
});

test("the sidebar is unchanged: a tool page opens only that tool's own category in it", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('toolsSidebarVisible', 'visible'));
  await page.goto('/split-pdf');
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveCount(1);
  await expect(page.locator('.tools-sidebar__group[open]')).toHaveAttribute('data-category', 'organize');
});

test('the tools come first and "What is LeafLock PDF?" sits below the last category', async ({ page }) => {
  await page.goto('/');
  const firstTool = (await page.locator('details.category').first().boundingBox())!;
  const lastCategory = (await page.locator('details.category').last().boundingBox())!;
  const answer = (await page.locator('.answer').boundingBox())!;
  const hero = (await page.locator('.hero').first().boundingBox())!;
  expect(firstTool.y, 'tools follow the hero').toBeGreaterThanOrEqual(hero.y + hero.height - 1);
  expect(answer.y, 'the definition is below every category').toBeGreaterThanOrEqual(lastCategory.y + lastCategory.height - 1);
  await expect(page.locator('.answer h2')).toHaveText('What is LeafLock PDF?');
});
