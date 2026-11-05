import { expect, test, type Page } from '@playwright/test';

/**
 * The tools sidebar as a phone drawer. Reported 6 November 2026: the reopen button
 * "doesn't work really good and sometimes does not even work".
 *
 * The cause was a document-level "tap outside closes it" handler that skipped the reopen
 * button only when `event.target === button`. A finger landing on the arrow icon targets
 * the <svg> inside the button, so the tap that opened the drawer shut it again in the same
 * gesture — which is why it worked when the tap hit the button's padding and failed when it
 * hit the icon. These tests tap the icon's exact centre on purpose.
 */
test.use({ viewport: { width: 360, height: 740 }, hasTouch: true });

const state = (page: Page) => page.evaluate(() => document.documentElement.dataset.sidebarState);

async function tapCentre(page: Page, selector: string) {
  const box = (await page.locator(selector).boundingBox())!;
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

test.beforeEach(async ({ page }) => {
  await page.goto('/merge-pdf');
  await expect(page.locator('#sidebarReopen')).toBeVisible();
});

test('the drawer starts closed on a phone', async ({ page }) => {
  expect(await state(page)).toBe('hidden');
});

test('tapping the middle of the reopen button, where the icon is, opens the drawer and it stays open', async ({ page }) => {
  await tapCentre(page, '#sidebarReopen');
  // Give a same-gesture re-close, the old failure, time to happen before asserting.
  await page.waitForTimeout(300);
  expect(await state(page)).toBe('visible');
  await expect(page.locator('#toolsSidebar')).toBeVisible();
});

test('tapping outside the drawer closes it, and so does Escape', async ({ page }) => {
  await tapCentre(page, '#sidebarReopen');
  await expect.poll(() => state(page)).toBe('visible');
  await page.touchscreen.tap(340, 400); // right of the 17rem drawer
  await expect.poll(() => state(page)).toBe('hidden');

  await tapCentre(page, '#sidebarReopen');
  await expect.poll(() => state(page)).toBe('visible');
  await page.keyboard.press('Escape');
  await expect.poll(() => state(page)).toBe('hidden');
});

test('opening the drawer is not remembered, so it does not cover the next page', async ({ page }) => {
  await tapCentre(page, '#sidebarReopen');
  await expect.poll(() => state(page)).toBe('visible');
  await page.goto('/split-pdf');
  expect(await state(page)).toBe('hidden');
});

test('the reopen and hide buttons are big enough for a thumb', async ({ page }) => {
  const reopen = (await page.locator('#sidebarReopen').boundingBox())!;
  expect(Math.min(reopen.width, reopen.height)).toBeGreaterThanOrEqual(44);
  await tapCentre(page, '#sidebarReopen');
  await expect.poll(() => state(page)).toBe('visible');
  const hide = (await page.locator('#sidebarHide').boundingBox())!;
  expect(Math.min(hide.width, hide.height)).toBeGreaterThanOrEqual(40);
});
