/// <reference types="node" />
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test } from './fixtures';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { makePdf, pageSizesOf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

/**
 * Where each piece of text sits on a page, as a fraction of the page: {0,0} is the
 * bottom-left corner. Imposition is only correct if the pages land in the right cells
 * the right way up, and that is a question about position, not about file structure.
 */
async function textPositions(bytes: Uint8Array, pageNumber = 1): Promise<{ text: string; x: number; y: number }[]> {
  const doc = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  const page = await doc.getPage(pageNumber);
  const { width, height } = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const items = content.items.flatMap((item) =>
    'str' in item && item.str.trim()
      ? [{ text: item.str.trim(), x: item.transform[4] / width, y: item.transform[5] / height }]
      : [],
  );
  await doc.loadingTask.destroy();
  return items;
}

const fivePages = () => makePdf([[200, 300], [210, 300], [220, 300], [230, 300], [240, 300]]);

test('split by page ranges', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/split-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await fivePages()));
  // Thumbnails render through pdf.js; one appearing proves it works under the CSP.
  await expect(page.locator('.thumbnail__image').first()).toBeVisible();

  await page.getByLabel('File 1', { exact: true }).fill('1-2');
  await page.getByRole('button', { name: '+ Add another file' }).click();
  await page.getByLabel('File 2', { exact: true }).fill('5, 3');
  await expect(page.getByText('This makes 2 files.')).toBeVisible();
  await page.getByRole('button', { name: 'Split PDF' }).click();

  const { file, bytes } = await download(page, () =>
    page.getByRole('link', { name: 'Download report-pages-5_3.pdf' }).click(),
  );
  expect(file.suggestedFilename()).toBe('report-pages-5_3.pdf');
  expect(await pageSizesOf(bytes)).toEqual([[240, 300], [220, 300]]);
  await expect(page.getByRole('link', { name: 'Download report-pages-1-2.pdf' })).toBeVisible();

  const zip = await download(page, () => page.getByRole('button', { name: 'Download all as ZIP' }).click());
  expect(zip.file.suggestedFilename()).toBe('leaflock-files.zip');
  watch.assertClean();
});

test('split every page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/split-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await fivePages()));
  await page.getByText('Every page', { exact: true }).click();
  await expect(page.getByText('This makes 5 files.')).toBeVisible();
  await page.getByRole('button', { name: 'Split PDF' }).click();
  await expect(page.getByText('Done. 5 files are ready.')).toBeVisible();
  watch.assertClean();
});

test('remove pages by clicking thumbnails', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/remove-pages');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await fivePages()));
  await page.getByRole('button', { name: 'Page 2', exact: true }).click();
  await page.getByRole('button', { name: 'Page 4', exact: true }).click();
  await expect(page.getByLabel('Pages to remove')).toHaveValue('2, 4');
  await expect(page.getByText('2 pages selected')).toBeVisible();

  await page.getByRole('button', { name: 'Remove pages' }).click();
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('doc-pages-removed.pdf');
  expect(await pageSizesOf(bytes)).toEqual([[200, 300], [220, 300], [240, 300]]);
  watch.assertClean();
});

test('remove pages refuses to remove every page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/remove-pages');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await fivePages()));
  await page.getByRole('button', { name: 'Select all' }).click();
  await expect(page.getByText('You can’t remove every page. Leave at least one.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove pages' })).toBeDisabled();
  watch.assertClean();
});

test('extract typed pages into one file per page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/extract-pages');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await fivePages()));
  await page.getByLabel('Pages to extract').fill('2, 4');
  await expect(page.getByRole('button', { name: 'Page 4', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByText('One PDF per page', { exact: true }).click();
  await page.getByRole('button', { name: 'Extract pages' }).click();

  const { bytes } = await download(page, () => page.getByRole('link', { name: 'Download doc-page-4.pdf' }).click());
  expect(await pageSizesOf(bytes)).toEqual([[230, 300]]);
  await expect(page.getByRole('link', { name: 'Download doc-page-2.pdf' })).toBeVisible();
  watch.assertClean();
});

test('rotate all pages and one page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/rotate-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await makePdf([[200, 300], [200, 300]])));
  await expect(page.getByRole('button', { name: 'Save PDF' })).toBeDisabled();
  await page.getByRole('button', { name: /Rotate all right/ }).click();
  await page.getByRole('button', { name: 'Rotate page 2 right' }).click();
  await page.getByRole('button', { name: 'Save PDF' }).click();

  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('doc-rotated.pdf');
  const doc = await PDFDocument.load(bytes);
  expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([90, 180]);
  watch.assertClean();
});

test('organize pages from two files, with a blank page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/organize-pdf');
  await page
    .locator('input[type="file"]')
    .setInputFiles([pdfUpload('a.pdf', await makePdf([[100, 100], [110, 100]])), pdfUpload('b.pdf', await makePdf([[300, 300]]))]);
  await expect(page.getByText('2 files · 3 pages')).toBeVisible();

  // b.pdf's page to the front, a.pdf page 2 removed, blank page at the end.
  await page.getByRole('button', { name: 'Move page 3 earlier' }).click();
  await page.getByRole('button', { name: 'Move page 2 earlier' }).click();
  await page.getByRole('button', { name: 'Remove page 3' }).click();
  await page.getByRole('button', { name: '+ Add blank page' }).click();
  await expect(page.getByText('2 files · 3 pages')).toBeVisible();

  await page.getByRole('button', { name: 'Save PDF' }).click();
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('organized.pdf');
  // The blank page takes the size of the last page shown before it (b.pdf's, now removed a.pdf p2 is skipped).
  expect(await pageSizesOf(bytes)).toEqual([[300, 300], [100, 100], [110, 100]]);
  watch.assertClean();
});

test('crop the top of every page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/crop-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await makePdf([[200, 400], [200, 400]])));
  await expect(page.locator('.page-preview__image')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Crop PDF' })).toBeDisabled();

  await page.getByLabel('Top (%)').fill('25');
  await page.getByRole('button', { name: 'Crop PDF' }).click();
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('doc-cropped.pdf');
  const doc = await PDFDocument.load(bytes);
  for (const p of doc.getPages()) expect(p.getCropBox()).toEqual({ x: 0, y: 0, width: 200, height: 300 });
  watch.assertClean();
});

test('crop box can be dragged', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/crop-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await makePdf([[200, 400]])));
  await expect(page.locator('.page-preview__image')).toBeVisible();

  const handle = page.getByRole('button', { name: 'Left edge' });
  await handle.scrollIntoViewIfNeeded();
  const box = (await page.locator('.page-preview__page').boundingBox())!;
  const start = (await handle.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + box.width * 0.2, start.y + start.height / 2, { steps: 5 });
  await page.mouse.up();

  const left = Number(await page.getByLabel('Left (%)').inputValue());
  expect(left).toBeGreaterThan(15);
  expect(left).toBeLessThan(25);

  // Keyboard: nudge the right edge in.
  await page.getByRole('button', { name: 'Right edge' }).focus();
  await page.keyboard.press('Shift+ArrowLeft');
  expect(Number(await page.getByLabel('Right (%)').inputValue())).toBeCloseTo(5, 0);
  watch.assertClean();
});

test('a password-protected file gets a clear message', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/rotate-pdf');
  const locked = await makePdf([[200, 300]], { userPassword: 'open-secret', ownerPassword: 'owner-secret' });
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('locked.pdf', locked));
  await expect(page.getByRole('alert')).toHaveText(/locked\.pdf is password-protected/);
  watch.assertClean();
});

test('mix pages interleaves two scans, taking the second from the end', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  // Fronts, then backs as they come off a flipped stack: the last sheet first.
  const fronts = await makePdf([[200, 300], [210, 300], [220, 300]]);
  const backs = await makePdf([[620, 300], [610, 300], [600, 300]]);

  await page.goto('/mix-pdf-pages');
  // Both slots start empty, so the first slot's picker is the first of the two.
  await page.locator('input[type="file"]').first().setInputFiles(pdfUpload('fronts.pdf', fronts));
  // The first slot now holds a file, so the remaining picker is the second slot's.
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('backs.pdf', backs));

  await page.getByRole('button', { name: 'Mix pages' }).click();
  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());

  expect(await pageSizesOf(result.bytes)).toEqual([
    [200, 300], [600, 300],
    [210, 300], [610, 300],
    [220, 300], [620, 300],
  ]);
  watch.assertClean();
});

test('reverse pages landing opens the document already reversed', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/reverse-pdf-pages');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await fivePages()));
  await expect(page.locator('.thumbnail__image').first()).toBeVisible();

  await page.getByRole('button', { name: 'Save PDF' }).click();
  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());

  expect(await pageSizesOf(result.bytes)).toEqual([
    [240, 300], [230, 300], [220, 300], [210, 300], [200, 300],
  ]);
  watch.assertClean();
});

test('n-up puts four pages on each sheet', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 5; i++) {
    source.addPage([200, 300]).drawText(`Page ${i + 1}`, { x: 20, y: 150, size: 14, font });
  }

  await page.goto('/multiple-pages-per-sheet');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('slides.pdf', await source.save()));
  await page.getByRole('button', { name: 'Combine onto sheets' }).click();
  // Five pages, four to a sheet: two sheets.
  await expect(page.getByText('2 sheets.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(await pageSizesOf(result.bytes)).toEqual([[595, 842], [595, 842]]);

  // The point of the tool: the four pages must land in reading order — 1 and 2 across the
  // top, 3 and 4 beneath them — and be upright, not merely present in the file.
  const placed = await textPositions(result.bytes);
  const quadrant = (text: string) => {
    const item = placed.find((candidate) => candidate.text === text)!;
    return [item.x < 0.5 ? 'left' : 'right', item.y > 0.5 ? 'top' : 'bottom'];
  };
  expect(quadrant('Page 1')).toEqual(['left', 'top']);
  expect(quadrant('Page 2')).toEqual(['right', 'top']);
  expect(quadrant('Page 3')).toEqual(['left', 'bottom']);
  expect(quadrant('Page 4')).toEqual(['right', 'bottom']);

  // The fifth page starts the second sheet, back at the top-left.
  expect((await textPositions(result.bytes, 2)).map((item) => item.text)).toEqual(['Page 5']);
  watch.assertClean();
});

test('booklet imposes pages in folding order on landscape sheets', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < 6; i++) {
    source.addPage([300, 400]).drawText(`Page ${i + 1}`, { x: 20, y: 200, size: 14, font });
  }

  await page.goto('/booklet-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await source.save()));
  // Six pages pad to eight, so two blanks are announced before anything is made.
  await expect(page.getByText(/2 blank pages were added/)).toBeVisible();

  await page.getByRole('button', { name: 'Make booklet' }).click();
  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());

  // Eight booklet pages, two per side: four printed sides of A4 landscape.
  expect(await pageSizesOf(result.bytes)).toEqual([
    [842, 595], [842, 595], [842, 595], [842, 595],
  ]);

  // The first sheet is what proves the imposition: the last page of the booklet sits to
  // the left of page 1, because that is what folding the stack puts next to it. Here the
  // booklet's last page is a blank pad, so page 1 is alone on the right-hand half.
  const firstSheet = await textPositions(result.bytes, 1);
  expect(firstSheet.map((item) => item.text)).toEqual(['Page 1']);
  expect(firstSheet[0]!.x).toBeGreaterThan(0.5);

  // Its back carries page 2 on the left, and the pad's other side on the right.
  const secondSide = await textPositions(result.bytes, 2);
  expect(secondSide.map((item) => item.text)).toEqual(['Page 2']);
  expect(secondSide[0]!.x).toBeLessThan(0.5);

  // The innermost sheet is the one with no padding: pages 4 and 5 face each other.
  const innermost = await textPositions(result.bytes, 4);
  expect(innermost.map((item) => item.text).sort()).toEqual(['Page 4', 'Page 5']);
  watch.assertClean();
});
