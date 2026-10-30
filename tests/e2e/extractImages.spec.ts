/// <reference types="node" />
import { PDFDocument } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { makeJpeg } from '../fixtures/images';
import { download, pdfUpload, watchPage } from './helpers';

test('Extract images: pulls an embedded JPEG out byte for byte', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const doc = await PDFDocument.create();
  const jpeg = makeJpeg(30, 20);
  const image = await doc.embedJpg(jpeg);
  const pdfPage = doc.addPage([100, 100]);
  pdfPage.drawImage(image, { x: 0, y: 0, width: 30, height: 20 });

  await page.goto('/extract-images-from-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('brochure.pdf', await doc.save()));
  await page.getByRole('button', { name: 'Extract images' }).click();

  await expect(page.getByText('1 image extracted.')).toBeVisible();
  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('brochure-image-1.jpg');
  expect(new Uint8Array(result.bytes)).toEqual(jpeg);

  watch.assertClean();
});

test('Extract images: reports plainly when nothing could be extracted', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const doc = await PDFDocument.create();
  doc.addPage([100, 100]);

  await page.goto('/extract-images-from-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('blank.pdf', await doc.save()));
  await page.getByRole('button', { name: 'Extract images' }).click();

  await expect(page.getByRole('alert')).toContainText('no embedded images');
  watch.assertClean();
});
