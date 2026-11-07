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

test('theme: Light by default, and one button switches and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  const background = () => page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
  const button = page.locator('.theme-toggle');
  const light = await background();

  // Nothing saved: Light, and the button offers the other mode.
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.theme-toggle')).toHaveCount(1);
  await expect(button).toHaveAttribute('aria-label', `${en.common.theme.label}: ${en.common.theme.dark}`);

  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await background()).not.toBe(light);
  await expect(button).toHaveAttribute('aria-label', `${en.common.theme.label}: ${en.common.theme.light}`);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await background()).toBe(light);
});

test('theme: a dark device still gets Light until the button is pressed', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.theme-toggle')).toHaveAttribute(
    'aria-label',
    `${en.common.theme.label}: ${en.common.theme.dark}`,
  );
});
