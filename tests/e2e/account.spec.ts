import { expect, test, type Page } from '@playwright/test';
import { watchPage } from './helpers';

// `astro preview` serves no Functions, so the account endpoints are mocked here.
// Their real behaviour is covered by tests/unit/server/account.test.ts.

async function signedIn(page: Page, baseURL: string) {
  await page.context().addCookies([{ name: 'leaflock_signed_in', value: '1', url: baseURL }]);
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ email: 'person@example.com', plan: 'free' }),
    }),
  );
}

test('you can download everything held about you', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);
  await signedIn(page, baseURL!);
  await page.route('**/api/account/export', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ account: { email: 'person@example.com' }, sessions: [], usage: [] }),
    }),
  );

  await page.goto('/account');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download my data' }).click();
  expect((await download).suggestedFilename()).toBe('leaflock-account.json');
  watcher.assertClean();
});

test('deleting asks you to type your address, and says when it does not match', async ({ page, baseURL }) => {
  await signedIn(page, baseURL!);
  await page.route('**/api/account/delete', (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'confirm_mismatch' }) }),
  );

  await page.goto('/account');
  // The confirmation field only appears once you ask to delete.
  await expect(page.getByLabel('Type your email address to confirm')).toHaveCount(0);
  await page.getByRole('button', { name: 'Delete my account' }).click();

  await page.getByLabel('Type your email address to confirm').fill('wrong@example.com');
  await page.getByRole('button', { name: 'Permanently delete' }).click();
  await expect(page.getByRole('alert')).toHaveText(/doesn’t match/);
});

test('a running subscription blocks deletion and explains why', async ({ page, baseURL }) => {
  await signedIn(page, baseURL!);
  await page.route('**/api/account/delete', (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'subscription_active' }),
    }),
  );

  await page.goto('/account');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  await page.getByLabel('Type your email address to confirm').fill('person@example.com');
  await page.getByRole('button', { name: 'Permanently delete' }).click();

  await expect(page.getByRole('alert')).toHaveText(/Cancel it first/);
});

test('backing out leaves the account alone', async ({ page, baseURL }) => {
  await signedIn(page, baseURL!);
  let called = false;
  await page.route('**/api/account/delete', (route) => {
    called = true;
    return route.fulfill({ status: 204 });
  });

  await page.goto('/account');
  await page.getByRole('button', { name: 'Delete my account' }).click();
  await page.getByRole('button', { name: 'Keep my account' }).click();

  await expect(page.getByLabel('Type your email address to confirm')).toHaveCount(0);
  expect(called).toBe(false);
});
