/// <reference types="node" />
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { download, watchPage } from './helpers';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

/**
 * Chromium and Edge cannot decode HEIC themselves, which is exactly the case this
 * feature exists for — so running here proves the vendored libheif path, not the
 * OS one Safari would take.
 */
const heic = async () => ({
  name: 'photo.heic',
  mimeType: 'image/heic',
  buffer: await readFile(new URL('../fixtures/sample.heic', import.meta.url)),
});

test('HEIC to PDF: decodes with the vendored codec on a browser that cannot', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/jpg-to-pdf');

  // Nothing from libheif may be fetched before a HEIC is actually picked.
  const fetched: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('/vendor/libheif/')) fetched.push(new URL(request.url()).pathname);
  });
  expect(fetched).toEqual([]);

  await page.locator('input[type="file"]').setInputFiles([await heic()]);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();

  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('images.pdf');

  // The codec and its separate .wasm both came from our own origin — the LGPL shape and
  // the CSP both depend on that, and `assertClean()` below fails on any off-site request.
  expect(fetched).toContain('/vendor/libheif/libheif.js');
  expect(fetched).toContain('/vendor/libheif/libheif.wasm');

  // The page carries a real image, at the fixture's aspect ratio rather than a blank.
  const doc = await getDocument({ data: new Uint8Array(bytes) }).promise;
  expect(doc.numPages).toBe(1);
  const ops = await (await doc.getPage(1)).getOperatorList();
  const drew = ops.fnArray.some((fn: number) => fn === 85 || fn === 86); // paintImageXObject / paintJpegXObject
  expect(drew, 'the page should draw an image').toBe(true);
  await doc.loadingTask.destroy();

  watch.assertClean();
});
