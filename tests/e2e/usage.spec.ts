import { expect, test, type Page } from './fixtures';
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
  await expect(notice.getByRole('link', { name: 'Create a free account' })).toHaveAttribute('href', /^\/login\/\?next=/);
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

test('a job does not start when the usage check fails: it fails closed, not open', async ({ page }) => {
  // The server's yes is what lets a run start. A failed check must not become a free pass, or a free user
  // could run unlimited jobs by making the call fail.
  await page.route('**/api/usage/claim', (route) => route.abort('failed'));

  await runMerge(page);

  await expect(page.getByRole('alert')).toContainText(/Something went wrong/i);
  await expect(downloadLink(page)).toHaveCount(0);
});

for (const status of [400, 401, 429, 500, 503]) {
  test(`a job does not start when the usage check answers ${status}`, async ({ page }) => {
    await page.route('**/api/usage/claim', (route) => route.fulfill({ status, contentType: 'application/json', body: '{}' }));

    await runMerge(page);

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(downloadLink(page)).toHaveCount(0);
  });
}

test('a tool above the plan is refused by the server with a 402, and does not run', async ({ page }) => {
  await page.route('**/api/usage/claim', (route) =>
    route.fulfill({ status: 402, contentType: 'application/json', body: JSON.stringify({ error: 'upgrade', required: 'practice' }) }),
  );

  await runMerge(page);

  await expect(page.getByRole('alert')).toBeVisible();
  await expect(downloadLink(page)).toHaveCount(0);
});

test('every run asks the server first, naming the tool, and sends nothing about the file', async ({ page }) => {
  const claims: { method: string; body: string }[] = [];
  await page.route('**/api/usage/claim', async (route) => {
    claims.push({ method: route.request().method(), body: route.request().postData() ?? '' });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ allowed: true, remaining: 4, reason: 'anonymous' }) });
  });

  await runMerge(page);
  await expect(downloadLink(page)).toBeVisible();

  expect(claims).toHaveLength(1);
  expect(claims[0]?.method).toBe('POST');
  expect(JSON.parse(claims[0]!.body)).toEqual({ tool: 'merge' });
});

test('tampering with the stored plan, the sign-in hint or a stored token changes nothing the server relies on', async ({ page, baseURL }) => {
  // Everything a visitor can edit in their own browser, set to say "I am on the highest plan".
  await page.context().addCookies([{ name: 'leaflock_signed_in', value: 'practice', url: baseURL! }]);
  await page.addInitScript(() => {
    window.localStorage.setItem('leaflock-entitlement', 'eyJ2IjoxLCJ0aWVyIjoicHJhY3RpY2UifQ.forged');
  });
  const claims: string[] = [];
  await page.route('**/api/usage/claim', async (route) => {
    claims.push(route.request().postData() ?? '');
    // The server knows the account is free and its allowance is used up.
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ allowed: false, remaining: 0, reason: 'free-account' }) });
  });
  await page.route('**/api/auth/me', (route) => route.fulfill({ json: { email: 'a@example.com', plan: 'free' } }));

  await runMerge(page);

  expect(claims.length).toBeGreaterThan(0);
  await expect(page.getByRole('alert')).toContainText(/Pro removes the daily limit/i);
  await expect(downloadLink(page)).toHaveCount(0);
});
