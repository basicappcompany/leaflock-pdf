import { expect, test, type Page } from '@playwright/test';
import { pdfUpload } from './helpers';
import { makePdf } from '../fixtures/pdfs';

// `astro preview` has no Cloudflare Functions, so /api/usage/claim is mocked here the
// same way tests/e2e/errors.spec.ts mocks /api/errors. The counting itself is covered
// by tests/unit/server/usage.test.ts and tests/unit/usage.test.ts.

async function mockClaim(page: Page, body: { allowed: boolean; remaining: number | null; reason?: string }) {
  await page.route('**/api/usage/claim', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

/** Picks two PDFs in Merge PDF and starts the job. */
async function runMerge(page: Page) {
  const first = await makePdf([[200, 300]]);
  const second = await makePdf([[400, 500]]);
  await page.goto('/merge-pdf');
  await page
    .locator('input[type="file"]')
    .setInputFiles([pdfUpload('first.pdf', first), pdfUpload('second.pdf', second)]);
  await page.getByRole('button', { name: 'Merge PDFs' }).click();
}

const downloadLink = (page: Page) => page.getByRole('link', { name: 'Download', exact: true });

test('a job runs as usual while the daily allowance has room', async ({ page }) => {
  await mockClaim(page, { allowed: true, remaining: 4, reason: 'anonymous' });

  await runMerge(page);

  await expect(downloadLink(page)).toBeVisible();
});

test('without an account, using up the allowance offers a free account instead of running', async ({ page }) => {
  await mockClaim(page, { allowed: false, remaining: 0, reason: 'anonymous' });

  await runMerge(page);

  const notice = page.getByRole('alert');
  await expect(notice).toContainText(/used today’s free tools/i);
  await expect(notice.getByRole('link', { name: 'Create a free account' })).toHaveAttribute('href', '/login/');
  await expect(downloadLink(page)).toHaveCount(0);
});

test('on a free account, using up the allowance points at Pro', async ({ page }) => {
  await mockClaim(page, { allowed: false, remaining: 0, reason: 'free-account' });

  await runMerge(page);

  const notice = page.getByRole('alert');
  await expect(notice).toContainText(/Pro removes the daily limit/i);
  await expect(notice.getByRole('link', { name: 'See Pro' })).toHaveAttribute('href', '/pricing/');
  await expect(downloadLink(page)).toHaveCount(0);
});

test('a job still runs when the usage check itself fails', async ({ page }) => {
  // Fails open: a backend hiccup must never stop a tool that runs on the device.
  await page.route('**/api/usage/claim', (route) => route.abort('failed'));

  await runMerge(page);

  await expect(downloadLink(page)).toBeVisible();
});
