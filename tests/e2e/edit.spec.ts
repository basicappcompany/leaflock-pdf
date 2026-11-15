/// <reference types="node" />
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { PDFDict, PDFDocument, PDFName, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test, type Page } from './fixtures';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { loadPdf } from '../../src/lib/pdf/load';
import { makePdf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

// Tall enough that a whole page preview is on screen, so drags land where the test aims.
test.use({ viewport: { width: 1280, height: 1400 } });

const require = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

/** Text of each page, as pdf.js extracts it. */
async function pageTexts(bytes: Uint8Array): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(bytes), disableFontFace: true }).promise;
  const texts: string[] = [];
  for (let number = 1; number <= doc.numPages; number++) {
    const content = await (await doc.getPage(number)).getTextContent();
    texts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '));
  }
  await doc.loadingTask.destroy();
  return texts;
}

/** Number of distinct images stored for each page (one image drawn many times counts once). */
async function imagesPerPage(bytes: Uint8Array): Promise<number[]> {
  const doc = await PDFDocument.load(bytes);
  return doc.getPages().map((page) => {
    const xObjects = page.node.Resources()?.lookupMaybe(PDFName.of('XObject'), PDFDict);
    if (!xObjects) return 0;
    return new Set(xObjects.keys().map((key) => xObjects.get(key)?.toString())).size;
  });
}

async function openTool(page: Page, slug: string, bytes: Uint8Array, name = 'input.pdf') {
  await page.goto(`/${slug}`);
  await page.locator('input[type="file"]').first().setInputFiles(pdfUpload(name, bytes));
  // The page preview has rendered once its image appears.
  await expect(page.locator('.page-preview__image').first()).toBeVisible();
}

async function downloadResult(page: Page) {
  return download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
}

/** Drags across the page preview between two points given as fractions of its size. */
async function dragOnPage(page: Page, from: [number, number], to: [number, number]) {
  const box = (await page.locator('.overlay-surface').boundingBox())!;
  await page.mouse.move(box.x + box.width * from[0], box.y + box.height * from[1]);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * ((from[0] + to[0]) / 2), box.y + box.height * ((from[1] + to[1]) / 2), { steps: 4 });
  await page.mouse.move(box.x + box.width * to[0], box.y + box.height * to[1], { steps: 4 });
  await page.mouse.up();
}

test('page numbers: numbers chosen pages, and non-Latin text goes through the image path', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await openTool(page, 'add-page-numbers', await makePdf([[300, 400], [300, 400], [300, 400]]));

  await page.getByLabel('Style').selectOption('pageOfTotal');
  await page.getByLabel('Skip the first page (cover)').click();
  await page.getByRole('button', { name: 'Add page numbers' }).click();
  const latin = await downloadResult(page);
  expect(latin.file.suggestedFilename()).toBe('input-numbered.pdf');
  const texts = await pageTexts(latin.bytes);
  expect(texts[0]).not.toContain(' of ');
  expect(texts[1]).toContain('Page 1 of 2');
  expect(texts[2]).toContain('Page 2 of 2');

  // Hindi can't be drawn with Helvetica, so each label becomes an image.
  await page.getByLabel('Style').selectOption('custom');
  await page.getByLabel('Custom text').fill('पृष्ठ {n}');
  await page.getByRole('button', { name: 'Add page numbers' }).click();
  const hindi = await downloadResult(page);
  expect(await imagesPerPage(hindi.bytes)).toEqual([0, 1, 1]);
  watch.assertClean();
});

test('watermark: text watermark with a live preview, in Japanese', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await openTool(page, 'add-watermark', await makePdf([[400, 600], [400, 600]]));
  await expect(page.locator('.stamp-preview__mark')).toHaveText('CONFIDENTIAL');

  await page.getByRole('button', { name: 'Add watermark' }).click();
  const latin = await downloadResult(page);
  expect((await pageTexts(latin.bytes)).every((text) => text.includes('CONFIDENTIAL'))).toBe(true);

  await page.getByLabel('Watermark text').fill('社外秘');
  await page.getByText('Repeated across the page').click();
  await expect(page.locator('.stamp-preview__mark').nth(3)).toHaveText('社外秘');
  await page.getByRole('button', { name: 'Add watermark' }).click();
  const japanese = await downloadResult(page);
  // One embedded image per page, drawn many times.
  expect(await imagesPerPage(japanese.bytes)).toEqual([1, 1]);
  watch.assertClean();
});

test('sign: draws a signature with the mouse and places it with a date', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await openTool(page, 'sign-pdf', await makePdf([[400, 600], [400, 600]]));

  const pad = (await page.getByRole('img', { name: 'Signature drawing area' }).boundingBox())!;
  await page.mouse.move(pad.x + pad.width * 0.2, pad.y + pad.height * 0.6);
  await page.mouse.down();
  for (let step = 1; step <= 20; step++) {
    await page.mouse.move(pad.x + pad.width * (0.2 + step * 0.03), pad.y + pad.height * (0.6 - Math.sin(step / 2) * 0.2));
  }
  await page.mouse.up();
  await page.getByRole('button', { name: 'Use this signature' }).click();

  const signature = page.getByRole('button', { name: 'Signature on page 1' });
  await expect(signature).toBeVisible();
  // Move it with the keyboard, then go to page 2 and place another copy plus a date.
  await signature.focus();
  await page.keyboard.press('Shift+ArrowUp');
  await page.getByRole('button', { name: 'Next page' }).click();
  await page.getByRole('button', { name: 'Add to this page' }).click();
  await page.getByRole('button', { name: 'Add today’s date' }).click();
  await expect(page.getByText('3 items placed')).toBeVisible();

  await page.getByRole('button', { name: 'Sign and download' }).click();
  const signed = await downloadResult(page);
  expect(signed.file.suggestedFilename()).toBe('input-signed.pdf');
  expect(await imagesPerPage(signed.bytes)).toEqual([1, 1]);
  expect((await pageTexts(signed.bytes))[1]).toContain(String(new Date().getFullYear()));
  watch.assertClean();
});

test('edit: adds text, a highlight and white-out', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await openTool(page, 'edit-pdf', await makePdf([[400, 600]]));

  await page.getByText('Text', { exact: true }).click();
  const surface = (await page.locator('.overlay-surface').boundingBox())!;
  await page.mouse.click(surface.x + surface.width * 0.1, surface.y + surface.height * 0.1);
  await page.getByLabel('Text to add').fill('Reviewed by Asha');

  await page.getByText('Highlight', { exact: true }).click();
  await dragOnPage(page, [0.05, 0.45], [0.5, 0.52]);
  await page.getByText('White-out', { exact: true }).click();
  await dragOnPage(page, [0.6, 0.7], [0.9, 0.8]);
  await expect(page.getByText('3 changes')).toBeVisible();

  await page.getByRole('button', { name: 'Save PDF' }).click();
  const edited = await downloadResult(page);
  expect((await pageTexts(edited.bytes))[0]).toContain('Reviewed by Asha');
  watch.assertClean();
});

async function makeForm(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const form = doc.getForm();
  form.createTextField('applicant.fullName').addToPage(page, { x: 50, y: 600, width: 300, height: 24 });
  form.createCheckBox('agree_terms').addToPage(page, { x: 50, y: 550, width: 16, height: 16 });
  const country = form.createDropdown('country');
  country.addOptions(['India', 'Germany', 'Japan']);
  country.addToPage(page, { x: 50, y: 500, width: 150, height: 24 });
  return doc.save();
}

test('fill form: fills fields and locks the answers in', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/fill-pdf-form');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('form.pdf', await makeForm()));

  await expect(page.getByText('This form has 3 fields.')).toBeVisible();
  await page.getByLabel('Full name').fill('Asha Rao');
  await page.getByText('Agree terms').click();
  await page.getByLabel('Country').selectOption('Japan');
  await page.getByLabel(/Lock the answers in/).click();
  await page.getByRole('button', { name: 'Save PDF' }).click();

  const filled = await downloadResult(page);
  const doc = await PDFDocument.load(filled.bytes);
  expect(doc.getForm().getFields()).toHaveLength(0);
  expect((await pageTexts(filled.bytes))[0]).toContain('Asha Rao');
  watch.assertClean();
});

test('fill form: explains a PDF without fields', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/fill-pdf-form');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('plain.pdf', await makePdf([[300, 300]])));
  await expect(page.getByRole('alert')).toContainText('no fillable fields');
  watch.assertClean();
});

test('redact: burns boxes in and removes the hidden text from the file', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  source.addPage([400, 500]).drawText('Account 99-1234-5678', { x: 40, y: 440, size: 16, font });
  source.addPage([400, 500]).drawText('Nothing secret here', { x: 40, y: 440, size: 16, font });
  await openTool(page, 'redact-pdf', await source.save());

  await dragOnPage(page, [0.05, 0.08], [0.9, 0.16]);
  await expect(page.getByText('1 box')).toBeVisible();
  await page.getByRole('button', { name: 'Redact and download' }).click();

  const redacted = await downloadResult(page);
  const texts = await pageTexts(redacted.bytes);
  expect(texts[0]!.trim()).toBe('');
  expect(texts[1]).toContain('Nothing secret here');
  expect(await imagesPerPage(redacted.bytes)).toEqual([1, 0]);
  watch.assertClean();
});

test('edit metadata: shows current properties, saves changes and clears emptied fields', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const source = await PDFDocument.create();
  source.addPage([300, 300]);
  source.setTitle('Old Title');
  source.setAuthor('Old Author');

  await page.goto('/edit-metadata');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('doc.pdf', await source.save()));

  // The values shown are read out of the file itself.
  const title = page.getByLabel('Title', { exact: true });
  await expect(title).toHaveValue('Old Title');
  await expect(page.getByLabel('Author', { exact: true })).toHaveValue('Old Author');

  await title.fill('New Title');
  await page.getByLabel('Author', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Save properties' }).click();
  await expect(page.getByText('Document properties saved.')).toBeVisible();

  const result = await downloadResult(page);
  const saved = await loadPdf({ name: 'out.pdf', bytes: result.bytes });
  expect(saved.getTitle()).toBe('New Title');
  // Emptied, so removed outright rather than stored as a blank author.
  expect(saved.getAuthor()).toBeUndefined();
  watch.assertClean();
});
