import { expect, test, type Page } from './fixtures';

/**
 * The tools sidebar as a phone drawer. Reported 6 November 2026: the hide/show handle
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
  await expect(page.locator('#sidebarToggle')).toBeVisible();
});

test('the drawer starts closed on a phone', async ({ page }) => {
  expect(await state(page)).toBe('hidden');
});

test('tapping the middle of the hide/show handle, where the icon is, opens the drawer and it stays open', async ({ page }) => {
  await tapCentre(page, '#sidebarToggle');
  // Give a same-gesture re-close, the old failure, time to happen before asserting.
  await page.waitForTimeout(300);
  expect(await state(page)).toBe('visible');
  await expect(page.locator('#toolsSidebar')).toBeVisible();
});

test('tapping outside the drawer closes it, and so does Escape', async ({ page }) => {
  await tapCentre(page, '#sidebarToggle');
  await expect.poll(() => state(page)).toBe('visible');
  await page.touchscreen.tap(340, 400); // right of the 17rem drawer
  await expect.poll(() => state(page)).toBe('hidden');

  await tapCentre(page, '#sidebarToggle');
  await expect.poll(() => state(page)).toBe('visible');
  await page.keyboard.press('Escape');
  await expect.poll(() => state(page)).toBe('hidden');
});

test('opening the drawer is not remembered, so it does not cover the next page', async ({ page }) => {
  await tapCentre(page, '#sidebarToggle');
  await expect.poll(() => state(page)).toBe('visible');
  await page.goto('/split-pdf');
  expect(await state(page)).toBe('hidden');
});

test('the handles are big enough for a thumb, and only the main one shows while hidden', async ({ page }) => {
  const toggle = (await page.locator('#sidebarToggle').boundingBox())!;
  // Hidden, the visible tab is slim so it stays in the page margin; an invisible extension makes the
  // tappable width up to 44px, so what is checked is where a thumb can land, not the painted edge.
  expect(toggle.height).toBeGreaterThanOrEqual(48);
  const reach = await page.evaluate(() => {
    const el = document.querySelector('#sidebarToggle')!;
    const box = el.getBoundingClientRect();
    const y = box.top + box.height / 2;
    const left = box.left < 8;
    let width = 0;
    for (let step = 1; step <= 60; step++) {
      const x = left ? box.left + step : box.right - step;
      if (document.elementFromPoint(x, y) === el) width = step; else if (step > 16) break;
    }
    return width;
  });
  expect(reach, 'tappable width in px').toBeGreaterThanOrEqual(40);
  // Hidden: the stack would cover the page edge, so only the hide/show handle stays.
  await expect(page.locator('#sidebarMove')).toBeHidden();
  await expect(page.locator('#sidebarReset')).toBeHidden();
  await tapCentre(page, '#sidebarToggle');
  await expect.poll(() => state(page)).toBe('visible');
  for (const id of ['#sidebarMove', '#sidebarReset']) {
    const box = (await page.locator(id).boundingBox())!;
    expect(Math.min(box.width, box.height), id).toBeGreaterThanOrEqual(40);
  }
});
