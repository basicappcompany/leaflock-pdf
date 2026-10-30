import { expect, test, type Page } from '@playwright/test';
import { watchPage } from './helpers';

// `astro preview` has no Cloudflare Functions, so the API routes are mocked here the
// same way tests/e2e/errors.spec.ts mocks /api/errors. The routes' own logic (magic
// links, sessions, rate limiting) is covered by tests/unit/server/*.test.ts instead.

/** Sets the non-HttpOnly hint cookie (see src/lib/server/session.ts) that tells
 * useSession() a session might exist, so it's worth calling /api/auth/me at all. */
async function signIn(page: Page, baseURL: string, session: { email: string; plan: string }) {
  await page.context().addCookies([{ name: 'leaflock_signed_in', value: '1', url: baseURL }]);
  await page.route('**/api/auth/me', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(session) });
  });
}

test('login form sends a magic-link request and shows the check-your-email state', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);
  let requestedEmail: string | undefined;
  await page.route('**/api/auth/request-link', async (route) => {
    requestedEmail = (JSON.parse(route.request().postData() ?? 'null') as { email?: string } | null)?.email;
    await route.fulfill({ status: 204 });
  });

  // No sign-in hint cookie: the header's AuthNavLink won't call /api/auth/me at all.
  await page.goto('/login');
  await page.getByLabel('Email address').fill('person@example.com');
  await page.getByRole('button', { name: /email me a sign-in link/i }).click();

  await expect(page.getByRole('status')).toHaveText(/Check your email/i);
  expect(requestedEmail).toBe('person@example.com');
  watcher.assertClean();
});

test('a rate-limited request shows an error instead of the sent state', async ({ page, baseURL }) => {
  // Not watchPage(): triggering a 429 on purpose makes the browser itself log a
  // "Failed to load resource" console entry, which isn't a bug to catch here.
  const offsite: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith('blob:')) offsite.push(request.url());
  });
  await page.route('**/api/auth/request-link', (route) => route.fulfill({ status: 429 }));

  await page.goto('/login');
  await page.getByLabel('Email address').fill('person@example.com');
  await page.getByRole('button', { name: /email me a sign-in link/i }).click();

  await expect(page.getByRole('alert')).toHaveText(/Too many attempts/i);
  expect(offsite).toEqual([]);
});

test('logging in with a password signs you in', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);
  let sent: { email?: string; password?: string } | null = null;
  await page.route('**/api/auth/password', async (route) => {
    sent = JSON.parse(route.request().postData() ?? 'null') as { email?: string; password?: string };
    await route.fulfill({ status: 204 });
  });
  // So the /account page it lands on resolves as signed in rather than bouncing back.
  await signIn(page, baseURL!, { email: 'person@example.com', plan: 'free' });

  await page.goto('/login');
  await page.getByLabel('Email address').fill('person@example.com');
  await page.getByLabel('Password').fill('super secret 123');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  await expect(page).toHaveURL(/\/account\/?$/);
  expect(sent).toMatchObject({ email: 'person@example.com', password: 'super secret 123' });
  watcher.assertClean();
});

test('a wrong password says so, without saying whether the account exists', async ({ page, baseURL }) => {
  // Not watchPage(): a deliberate 401 makes the browser log a resource error of its own.
  const offsite: string[] = [];
  page.on('request', (request) => {
    if (!request.url().startsWith(baseURL!) && !request.url().startsWith('blob:')) offsite.push(request.url());
  });
  await page.route('**/api/auth/password', (route) => route.fulfill({ status: 401 }));

  await page.goto('/login');
  await page.getByLabel('Email address').fill('person@example.com');
  await page.getByLabel('Password').fill('wrong password here');
  await page.getByRole('button', { name: 'Log in', exact: true }).click();

  await expect(page.getByRole('alert')).toHaveText(/don’t match/i);
  expect(offsite).toEqual([]);
});

test('Google is offered only when the server has credentials for it', async ({ page }) => {
  await page.route('**/api/auth/methods', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ google: true }) }),
  );

  await page.goto('/login');
  await expect(page.getByRole('link', { name: /sign in with google/i })).toHaveAttribute(
    'href',
    '/api/auth/google/start',
  );
});

test('Google is hidden when the server has no credentials', async ({ page }) => {
  await page.route('**/api/auth/methods', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ google: false }) }),
  );

  await page.goto('/login');
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in with google/i })).toHaveCount(0);
});

test('the header nav links to login when there is no sign-in hint', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);

  await page.goto('/pricing');
  const navLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Log in' });
  await expect(navLink).toBeVisible();
  await expect(navLink).toHaveAttribute('href', /^\/login\/?$/);
  watcher.assertClean();
});

test('the header nav shows the dashboard once a session is confirmed', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);
  await signIn(page, baseURL!, { email: 'person@example.com', plan: 'pro' });

  await page.goto('/pricing');
  const navLink = page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Dashboard' });
  await expect(navLink).toBeVisible();
  await expect(navLink).toHaveAttribute('href', /^\/dashboard\/?$/);
  watcher.assertClean();
});

test('the account page shows the signed-in user and logs out', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);
  await signIn(page, baseURL!, { email: 'person@example.com', plan: 'free' });
  let loggedOut = false;
  await page.route('**/api/auth/logout', async (route) => {
    loggedOut = true;
    await route.fulfill({ status: 204 });
  });

  await page.goto('/account');
  await expect(page.getByText('person@example.com')).toBeVisible();
  await expect(page.getByText('Free')).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(loggedOut).toBe(true);
  watcher.assertClean();
});
