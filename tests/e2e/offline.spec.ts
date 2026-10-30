import { expect, test, type Page } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { makePdf, pageSizesOf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

/**
 * The claim this whole feature exists to make: turn the network off and the tools still
 * work, because the work was never happening on a server.
 *
 * These run against the production build (`astro preview`), which is the only place the
 * service worker is filled in — integrations/service-worker.mjs patches it at
 * `astro:build:done`, and an unfilled worker deliberately does nothing.
 */

/** Resolves once a worker controls the page, so going offline is actually covered. */
async function waitForController(page: Page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 15_000 });
}

test('registers a worker that takes control of the page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/');
  await waitForController(page);

  const scope = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration?.scope ?? null;
  });
  expect(scope).toBe(`${baseURL!.replace(/\/$/, '')}/`);

  watch.assertClean();
});

test('serves the whole site from the cache with no network', async ({ page, context }) => {
  await page.goto('/');
  await waitForController(page);

  await context.setOffline(true);
  // A page never visited in this session: it is in the precached shell, not the HTTP cache.
  await page.goto('/merge-pdf');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(en.tools.merge.title);

  await page.goto('/pricing');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await context.setOffline(false);
});

test('merges a PDF with the network off', async ({ page, context }) => {
  // The real sequence, and the reason it matters: a page's chunks are only cached when
  // the worker is already in control of the navigation that requests them. The very
  // first visit installs the worker; the visit after that is covered. So pages are
  // navigable offline immediately, and a tool works offline once it has been opened.
  await page.goto('/');
  await waitForController(page);

  await page.goto('/merge-pdf');
  await expect(page.locator('input[type=file]')).toBeAttached();

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('input[type=file]')).toBeAttached();

  await page.setInputFiles('input[type=file]', [
    pdfUpload('one.pdf', await makePdf([[300, 400], [300, 400]])),
    pdfUpload('two.pdf', await makePdf([[200, 260]])),
  ]);
  await page.getByRole('button', { name: en.tools.merge.action }).click();

  // The usage call cannot reach us with the network off, and must not stop the job:
  // src/lib/usage.ts fails open precisely so the cap never becomes a lock.
  const { bytes } = await download(page, () =>
    page.getByRole('link', { name: 'Download', exact: true }).click(),
  );

  // Three real pages came out, in order, with no server involved at any point.
  expect(await pageSizesOf(bytes)).toEqual([
    [300, 400],
    [300, 400],
    [200, 260],
  ]);

  await context.setOffline(false);
});

test('falls back to the offline page for a URL that was never cached', async ({ page, context }) => {
  await page.goto('/');
  await waitForController(page);

  await context.setOffline(true);
  // Session-only pages are deliberately left out of the precache, so this is the
  // fallback's real-world case rather than a contrived one.
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(en.common.offline.heading);

  await context.setOffline(false);
});

test('never serves an API call from the cache', async ({ page }) => {
  await page.goto('/');
  await waitForController(page);

  // Sessions and metering must always be live: a cached /api/auth/me would show the
  // wrong person as signed in.
  const fromWorker = await page.evaluate(async () => {
    const keys = await caches.keys();
    for (const key of keys) {
      const cache = await caches.open(key);
      const requests = await cache.keys();
      if (requests.some((request) => new URL(request.url).pathname.startsWith('/api/'))) return true;
    }
    return false;
  });
  expect(fromWorker).toBe(false);
});
