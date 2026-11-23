import { expect, test } from './fixtures';

/**
 * The login and dashboard controls: two layout facts that a type check cannot see.
 *
 * The header's Log in button is drawn by the browser after the session check, so its slot must be reserved or the language
 * and theme controls jump left when it appears. And the small buttons on the login form and dashboard must be a thumb's
 * height on a touch screen. Both were measured before they were fixed (23 November 2026): the shift was real and the
 * buttons were 20 to 32 px tall.
 */

test('the header does not shift when the Log in button appears', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // A slow answer keeps the button absent long enough to measure the page without it.
  await page.route('**/api/auth/me', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ status: 401, json: {} });
  });
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  const toggle = page.locator('.theme-toggle');
  await expect(toggle).toBeVisible();
  const before = await toggle.boundingBox();
  await expect(page.locator('.site-nav').getByRole('link', { name: 'Log in' })).toBeVisible();
  const after = await toggle.boundingBox();
  expect(Math.abs(after!.x - before!.x), 'theme toggle moved when Log in appeared').toBeLessThanOrEqual(1);
});

test.describe('on a touch screen', () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 412, height: 915 } });

  test('login form buttons are at least 44 px tall', async ({ page }) => {
    await page.goto('/login');
    const button = page.locator('.auth-form .link-button').first();
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });

  test('dashboard buttons are at least 44 px tall', async ({ page, baseURL }) => {
    await page.context().addCookies([{ name: 'leaflock_signed_in', value: '1', url: baseURL! }]);
    await page.route('**/api/auth/me', (route) => route.fulfill({ json: { email: 'someone@example.com', plan: 'free' } }));
    await page.route('**/api/usage/today', (route) => route.fulfill({ json: { plan: 'free', used: 1, limit: 20 } }));
    await page.addInitScript(() =>
      window.localStorage.setItem('leaflock-recent', JSON.stringify([{ tool: 'merge', at: Date.now() - 120_000 }])),
    );
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const selector of ['.dashboard .secondary-button--small', '.dashboard .link-button']) {
      const heights = await page.locator(selector).evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
      expect(heights.length, selector).toBeGreaterThan(0);
      for (const height of heights) expect(height, selector).toBeGreaterThanOrEqual(44);
    }
  });
});
