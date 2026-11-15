/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from './fixtures';
import { makePdf, pageSizesOf } from '../fixtures/pdfs';
import { pdfUpload, watchPage } from './helpers';

/** The usage endpoint doesn't exist under `astro preview`; answer like the real one. */
async function allowUsage(page: Page) {
  await page.route('**/api/usage/claim', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ allowed: true, remaining: 9, authorizedTier: 'practice' }) }),
  );
}

test('runs one job over several PDFs and offers them together', async ({ page, baseURL }) => {
  const watcher = watchPage(page, baseURL!);
  await allowUsage(page);
  const a = await makePdf([[300, 400]]);
  const b = await makePdf([[200, 260], [210, 260]]);

  await page.goto('/batch-pdf');
  await page.locator('input[type="file"]').setInputFiles([pdfUpload('one.pdf', a), pdfUpload('two.pdf', b)]);

  await page.getByRole('button', { name: 'Run on all files' }).click();

  // Both rows reach Done, and the results are offered as a set.
  await expect(page.getByText('Done', { exact: true })).toHaveCount(2, { timeout: 30_000 });
  await expect(page.getByRole('button', { name: 'Download all as ZIP' })).toBeVisible();

  watcher.assertClean();
});

test('a locked file is skipped with a reason, and the rest still finish', async ({ page }) => {
  await allowUsage(page);
  const plain = await makePdf([[300, 400]]);
  const locked = await makePdf([[300, 300]], { userPassword: 'open-secret', ownerPassword: 'owner-secret' });

  await page.goto('/batch-pdf');
  await page
    .locator('input[type="file"]')
    .setInputFiles([pdfUpload('plain.pdf', plain), pdfUpload('locked.pdf', locked)]);
  await page.getByRole('button', { name: 'Run on all files' }).click();

  await expect(page.getByText('Failed', { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/locked\.pdf is password-protected/)).toBeVisible();
  // The good one still produced a file.
  await expect(page.getByText('Done', { exact: true })).toHaveCount(1);
  await expect(page.getByText(/could not be processed/)).toBeVisible();
});

test('compressed files keep their pages and are named per file', async ({ page }) => {
  await allowUsage(page);
  const a = await makePdf([[300, 400]]);
  const b = await makePdf([[200, 260]]);

  await page.goto('/batch-pdf');
  await page.locator('input[type="file"]').setInputFiles([pdfUpload('a.pdf', a), pdfUpload('b.pdf', b)]);
  await page.getByRole('button', { name: 'Run on all files' }).click();
  await expect(page.getByText('Done', { exact: true })).toHaveCount(2, { timeout: 30_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('link', { name: /a-smaller\.pdf/ }).click();
  const file = await download;
  expect(await pageSizesOf(await readFile(await file.path()))).toEqual([[300, 400]]);
});

test('a file with nothing to flatten says so, rather than "something went wrong"', async ({ page }) => {
  await allowUsage(page);
  const a = await makePdf([[300, 400]]);
  const b = await makePdf([[200, 260]]);

  await page.goto('/batch-pdf');
  await page.locator('input[type="file"]').setInputFiles([pdfUpload('a.pdf', a), pdfUpload('b.pdf', b)]);
  // The radio is visually replaced by its label, so click the label (as secure.spec.ts does).
  await page.getByText('Flatten', { exact: true }).click();
  await page.getByRole('button', { name: 'Run on all files' }).click();

  await expect(page.getByText('a.pdf has no form fields or annotations to flatten.')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/Something went wrong/)).toHaveCount(0);
});

test('asks for a password before protecting a batch', async ({ page }) => {
  await allowUsage(page);
  const a = await makePdf([[300, 400]]);
  const b = await makePdf([[200, 260]]);

  await page.goto('/batch-pdf');
  await page.locator('input[type="file"]').setInputFiles([pdfUpload('a.pdf', a), pdfUpload('b.pdf', b)]);
  await page.getByText('Protect with a password', { exact: true }).click();
  await page.getByRole('button', { name: 'Run on all files' }).click();

  await expect(page.getByText('Enter a password first.')).toBeVisible();
});
