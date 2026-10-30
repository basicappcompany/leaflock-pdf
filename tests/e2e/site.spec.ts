import { expect, test } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { tools } from '../../src/tools/registry';
import { watchPage } from './helpers';

test('home page lists every tool', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');
  for (const tool of tools) {
    await expect(page.getByRole('link', { name: new RegExp(en.tools[tool.id].title) }).first()).toBeVisible();
  }
  watch.assertClean();
});

test('home page hero offers a way straight into a tool', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText(en.common.site.tagline);
  await expect(page.getByRole('link', { name: en.common.cta.merge })).toBeVisible();
  await expect(page.getByRole('link', { name: en.common.cta.howItWorks })).toBeVisible();

  watch.assertClean();
});

for (const tool of tools) {
  test(`${tool.slug} loads cleanly`, async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    await page.goto(`/${tool.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(en.tools[tool.id].title);
    // The tool UI is client-rendered; wait until it replaces the loading text.
    await expect(page.getByText(en.common.toolPage.loading)).toHaveCount(0);
    await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveAttribute('content', /connect-src 'self'/);
    watch.assertClean();
  });
}

test('theme choice applies and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const background = () => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const light = await background();

  await page.getByText(en.common.theme.dark, { exact: true }).click({ force: true });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await background()).not.toBe(light);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('input[name="theme"][value="dark"]')).toBeChecked();

  await page.getByText(en.common.theme.system, { exact: true }).click({ force: true });
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await background()).toBe(light);
});
