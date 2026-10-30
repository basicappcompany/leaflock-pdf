/// <reference types="node" />
import { expect, test } from '@playwright/test';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { makePdf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

/** Just the text items, so the fixture's own "Page N" label doesn't mask the stamp. */
async function stampsOf(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  const stamps: string[] = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const content = await (await doc.getPage(number)).getTextContent();
    const items = content.items.filter((item) => 'str' in item && item.str.trim() !== '');
    const stamp = items.find((item) => 'str' in item && !item.str.startsWith('Page'));
    stamps.push(stamp && 'str' in stamp ? stamp.str : '');
  }
  await doc.loadingTask.destroy();
  return stamps;
}

test('Bates numbering: one continuous sequence runs across every file, in list order', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const a = await makePdf([[300, 400], [300, 400]]);
  const b = await makePdf([[300, 400]]);

  await page.goto('/bates-numbering');
  await page.locator('input[type="file"]').setInputFiles([pdfUpload('a.pdf', a), pdfUpload('b.pdf', b)]);
  await expect(page.getByText('2 files', { exact: true })).toBeVisible();

  // Put b.pdf first: the sequence should follow list order, not upload order.
  await page.getByRole('button', { name: 'Move b.pdf up' }).click();

  await page.getByLabel('Prefix').fill('CASE');
  await page.getByLabel('Digits').fill('4');
  await page.getByLabel('First number').fill('1');
  await expect(page.getByText('First stamp: CASE0001')).toBeVisible();

  await page.getByRole('button', { name: 'Add Bates numbers' }).click();

  const first = await download(page, () => page.getByRole('link', { name: 'Download b-bates.pdf' }).click());
  expect(await stampsOf(first.bytes)).toEqual(['CASE0001']);

  const second = await download(page, () => page.getByRole('link', { name: 'Download a-bates.pdf' }).click());
  expect(await stampsOf(second.bytes)).toEqual(['CASE0002', 'CASE0003']);

  watch.assertClean();
});
