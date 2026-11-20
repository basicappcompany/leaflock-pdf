import { expect, test } from './fixtures';
import { watchPage } from './helpers';

// The launch-offer banner exists only while early access lasts (it is not rendered once paid plans are on sale), so
// these skip rather than fail after that date; earlyAccessCopy.test.ts is the one that fails by design then.

test('the launch-offer banner can be closed, and stays closed on the next visit', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');
  const banner = page.locator('.top-banner');
  test.skip((await banner.count()) === 0, 'early access has ended, so there is no banner');

  await expect(banner).toBeVisible();
  const close = banner.getByRole('button', { name: 'Close' });
  await expect(close).toBeVisible();
  // The tap target is a real one, not the 16px icon.
  const box = (await close.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(36);
  expect(box.height).toBeGreaterThanOrEqual(34);

  await close.click();
  await expect(banner).toBeHidden();

  // Next visit: still closed, and closed before first paint (the attribute is set by Base's inline script).
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-banner-closed', '1');
  await expect(banner).toBeHidden();
  watch.assertClean();
});

test('a different offer shows the banner again, and its link still goes to pricing', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('leaflock_banner_closed', 'an-older-offer'));
  await page.goto('/');
  const banner = page.locator('.top-banner');
  test.skip((await banner.count()) === 0, 'early access has ended, so there is no banner');

  await expect(banner).toBeVisible();
  await expect(banner.locator('a')).toHaveAttribute('href', /\/pricing\/?$/);
});

test('with the banner closed the header and privacy strip are what is left at the top, on a phone too', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const banner = page.locator('.top-banner');
  test.skip((await banner.count()) === 0, 'early access has ended, so there is no banner');
  await banner.getByRole('button', { name: 'Close' }).click();
  const header = (await page.locator('.site-header').boundingBox())!;
  expect(header.y).toBe(0);
});
