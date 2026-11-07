import { expect, test, type Page } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { watchPage } from './helpers';

/**
 * The /dashboard page.
 *
 * These tests run against `astro preview`, which serves the static build and none of
 * our Cloudflare Functions, so there is no way to hold a real session here. The two
 * endpoints the dashboard depends on are stubbed instead — which is the right boundary
 * anyway: what matters is that the page gates on the session, reads its recent list
 * from this device, and shows the correct panel for the plan.
 */

const t = en.common.dashboard;

/** Must match SIGNED_IN_HINT_COOKIE in src/components/ui/useSession.ts. */
const HINT_COOKIE = 'leaflock_signed_in';

async function signIn(page: Page, baseURL: string, plan: string, usage: unknown = { plan, used: 0, limit: 30 }) {
  await page.context().addCookies([{ name: HINT_COOKIE, value: '1', url: baseURL }]);
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { email: 'someone@example.com', plan } }),
  );
  await page.route('**/api/usage/today', (route) => route.fulfill({ json: usage }));
}

/** Seeds the device-local recent list, in the shape src/lib/recentActivity.ts writes. */
async function seedRecent(page: Page, entries: { tool: string; at: number }[]) {
  await page.addInitScript((value) => {
    window.localStorage.setItem('leaflock-recent', value);
  }, JSON.stringify(entries));
}

test('greets a signed-in visitor and offers tools to start', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await signIn(page, baseURL!, 'free');
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { level: 1, name: t.welcome })).toBeVisible();
  // The page must not be a dead end: the quick panel links into the tools themselves.
  const quick = page.locator('.dashboard__quick');
  await expect(quick.getByRole('link', { name: new RegExp(en.tools.merge.title) })).toBeVisible();
  await expect(quick.getByRole('link', { name: t.allTools })).toBeVisible();

  watch.assertClean();
});

test('sends a signed-out visitor to the login page', async ({ page }) => {
  await page.goto('/dashboard');

  await expect(page).toHaveURL(/\/login\/?$/);
});

test('the header points a signed-in visitor at the dashboard', async ({ page, baseURL }) => {
  await signIn(page, baseURL!, 'free');
  await page.goto('/');

  await page.getByRole('link', { name: en.common.nav.dashboard }).click();
  await expect(page).toHaveURL(/\/dashboard\/?$/);
});

test('lists recent tools from this device and links back to them', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await signIn(page, baseURL!, 'free');
  await seedRecent(page, [{ tool: 'split', at: Date.now() - 9 * 60_000 }]);
  await page.goto('/dashboard');

  const row = page.locator('.dashboard__recent li');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText(en.tools.split.title);

  await row.getByRole('link', { name: t.open }).click();
  await expect(page).toHaveURL(/\/split-pdf\/?$/);

  watch.assertClean();
});

test('clears the recent list on request', async ({ page, baseURL }) => {
  await signIn(page, baseURL!, 'free');
  await seedRecent(page, [{ tool: 'rotate', at: Date.now() }]);
  await page.goto('/dashboard');

  await page.getByRole('button', { name: t.clear }).click();
  // Cleared means the whole card goes, not an empty one in its place.
  await expect(page.getByRole('heading', { name: t.recentHeading })).toHaveCount(0);
  expect(await page.evaluate(() => window.localStorage.getItem('leaflock-recent'))).toBeNull();
});

test('shows no recent-tools card at all while nothing has been used', async ({ page, baseURL }) => {
  await signIn(page, baseURL!, 'free');
  await page.goto('/dashboard');

  await expect(page.getByRole('heading', { level: 1, name: t.welcome })).toBeVisible();
  await expect(page.getByRole('heading', { name: t.recentHeading })).toHaveCount(0);
  await expect(page.getByText(t.recentEmpty)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: t.quickHeading })).toBeVisible();
});

test('shows the daily meter and an upgrade prompt on a free account', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await signIn(page, baseURL!, 'free', { plan: 'free', used: 12, limit: 30 });
  await page.goto('/dashboard');

  await expect(page.getByText('12 of 30 runs used')).toBeVisible();
  const meter = page.getByRole('progressbar');
  await expect(meter).toHaveAttribute('aria-valuenow', '12');
  await expect(meter).toHaveAttribute('aria-valuemax', '30');
  await expect(page.getByRole('link', { name: t.upgrade })).toBeVisible();

  watch.assertClean();
});

test('shows no meter and no upgrade prompt on a paid plan', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await signIn(page, baseURL!, 'pro', { plan: 'pro', used: 0, limit: null });
  await page.goto('/dashboard');

  await expect(page.getByText(t.unlimited)).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await expect(page.getByRole('link', { name: t.upgrade })).toHaveCount(0);
  await expect(page.getByRole('link', { name: t.proAction })).toBeVisible();

  watch.assertClean();
});

test('keeps the dashboard out of the way when the usage call fails', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.context().addCookies([{ name: HINT_COOKIE, value: '1', url: baseURL! }]);
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { email: 'someone@example.com', plan: 'free' } }));
  await page.route('**/api/usage/today', (route) => route.abort());
  await page.goto('/dashboard');

  // Fails open: the dashboard still renders, simply without the meter.
  await expect(page.getByRole('heading', { level: 1, name: t.welcome })).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(0);

  watch.assertClean();
});
