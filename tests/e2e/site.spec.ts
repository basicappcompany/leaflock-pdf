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
  const { label, light: lightWord, dark: darkWord } = en.common.theme;
  await expect(button).toHaveAttribute('aria-label', `${lightWord}. ${label}: ${darkWord}`);

  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await background()).not.toBe(light);
  await expect(button).toHaveAttribute('aria-label', `${darkWord}. ${label}: ${lightWord}`);

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await button.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await background()).toBe(light);
});

test('language button: a flag that loads from our own origin, the globe for Bengali, names in the list', async ({
  page,
  baseURL,
}) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');
  const summary = page.locator('.lang-switcher summary');
  const flag = summary.locator('img.lang-switcher__flag');
  await expect(flag).toHaveAttribute('src', '/vendor/flags/us.svg');
  expect(await flag.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  // Icon only: the visible text is gone, but the accessible name still says which language.
  expect((await summary.boundingBox())!.width, 'no visible language name on the button').toBeLessThan(60);
  await expect(summary.locator('.visually-hidden')).toHaveText(`${en.common.language.label}: English`);

  // The opened list shows the flag and the full name together; Bengali gets the globe.
  await summary.click();
  const german = page.locator('.lang-switcher a[lang="de"]');
  await expect(german).toHaveText('Deutsch');
  await expect(german.locator('img')).toHaveAttribute('src', '/vendor/flags/de.svg');
  await expect.poll(() => german.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page.locator('.lang-switcher a[lang="bn"]')).toContainText('বাংলা');
  await expect(page.locator('.lang-switcher a[lang="bn"] .lang-switcher__globe')).toHaveText('🌐');

  await page.goto('/bn/');
  await expect(page.locator('.lang-switcher summary img')).toHaveCount(0);
  await expect(page.locator('.lang-switcher summary')).toContainText('🌐');
  watch.assertClean();
});

test('theme: a dark device still gets Light until the button is pressed', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.theme-toggle')).toHaveAttribute(
    'aria-label',
    `${en.common.theme.light}. ${en.common.theme.label}: ${en.common.theme.dark}`,
  );
});
