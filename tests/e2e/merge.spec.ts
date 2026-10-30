/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { makePdf, pageSizesOf } from '../fixtures/pdfs';

function asUpload(name: string, bytes: Uint8Array) {
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(bytes) };
}

/** Collects every request that leaves our own origin, and every CSP violation. */
function watchPrivacy(page: Page, origin: string) {
  const offsite: string[] = [];
  const cspViolations: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(origin) && !url.startsWith('blob:') && !url.startsWith('data:')) offsite.push(url);
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) {
      cspViolations.push(message.text());
    }
  });
  return { offsite, cspViolations };
}

test('merges PDFs in the chosen order without contacting any other site', async ({ page, baseURL }) => {
  const privacy = watchPrivacy(page, baseURL!);
  const first = await makePdf([[200, 300], [210, 300]]);
  const second = await makePdf([[400, 500]]);

  await page.goto('/merge-pdf');
  await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveAttribute(
    'content',
    /connect-src 'self'/,
  );

  await page.locator('input[type="file"]').setInputFiles([asUpload('first.pdf', first), asUpload('second.pdf', second)]);
  await expect(page.getByText('2 files', { exact: true })).toBeVisible();

  // Put second.pdf in front.
  await page.getByRole('button', { name: 'Move second.pdf up' }).click();

  await page.getByRole('button', { name: 'Merge PDFs' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download', exact: true }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('merged.pdf');
  const merged = await readFile(await download.path());
  expect(await pageSizesOf(merged)).toEqual([[400, 500], [200, 300], [210, 300]]);

  expect(privacy.offsite).toEqual([]);
  expect(privacy.cspViolations).toEqual([]);
});

test('says which file needs a password', async ({ page }) => {
  const plain = await makePdf([[200, 300]]);
  const locked = await makePdf([[300, 300]], { userPassword: 'open-secret', ownerPassword: 'owner-secret' });

  await page.goto('/merge-pdf');
  await page.locator('input[type="file"]').setInputFiles([asUpload('plain.pdf', plain), asUpload('locked.pdf', locked)]);
  await page.getByRole('button', { name: 'Merge PDFs' }).click();

  await expect(page.getByRole('alert')).toHaveText(/locked\.pdf is password-protected/);
});

test('skips files that are not PDFs', async ({ page }) => {
  await page.goto('/merge-pdf');
  await page.locator('input[type="file"]').setInputFiles([
    { name: 'photo.jpg', mimeType: 'image/jpeg', buffer: Buffer.from([0xff, 0xd8, 0xff]) },
  ]);

  await expect(page.getByText('photo.jpg is not a supported file, so it was skipped.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Merge PDFs' })).toBeDisabled();
});
