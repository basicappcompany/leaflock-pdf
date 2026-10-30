import { PDFArray, PDFDocument, PDFName, PDFNumber, PDFRawStream, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test, type Page } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { loadPdf } from '../../src/lib/pdf/load';
import { makePdf, pageSizesOf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

const t = en.tools;

async function textPdf(pages: string[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const text of pages) doc.addPage([400, 300]).drawText(text, { x: 30, y: 150, font, size: 16 });
  return doc.save();
}

/** A noisy photo-like JPEG, made by the browser itself, so compression has real work to do. */
async function bigJpeg(page: Page): Promise<Uint8Array> {
  const base64 = await page.evaluate(async () => {
    const canvas = new OffscreenCanvas(2400, 1800);
    const context = canvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, 0, 2400, 1800);
    gradient.addColorStop(0, '#3a6');
    gradient.addColorStop(1, '#a36');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 2400, 1800);
    const noise = context.getImageData(0, 0, 2400, 1800);
    for (let i = 0; i < noise.data.length; i += 4) noise.data[i] = (noise.data[i]! + ((i * 2654435761) % 64)) & 255;
    context.putImageData(noise, 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.95 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  });
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

test('protect then unlock round trip', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const original = await makePdf([[200, 300], [300, 400]]);

  await page.goto('/protect-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', original));
  await page.getByLabel(t.protect.passwordLabel).fill('correct horse battery');
  await page.getByLabel(t.protect.confirmLabel).fill('correct horse batter');
  await expect(page.getByText(t.protect.mismatch)).toBeVisible();
  await expect(page.getByRole('button', { name: t.protect.action })).toBeDisabled();
  await page.getByLabel(t.protect.confirmLabel).fill('correct horse battery');
  await expect(page.getByText(t.protect.strength.strong)).toBeVisible();
  await page.getByRole('button', { name: t.protect.action }).click();

  const protectedFile = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(protectedFile.file.suggestedFilename()).toBe('report-protected.pdf');
  await expect(loadPdf({ name: 'p.pdf', bytes: protectedFile.bytes })).rejects.toMatchObject({ problem: 'password-protected' });

  await page.goto('/unlock-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report-protected.pdf', protectedFile.bytes));
  await expect(page.getByText(t.unlock.needsPassword)).toBeVisible();
  await page.getByLabel(t.unlock.passwordLabel, { exact: true }).fill('wrong');
  await page.getByRole('button', { name: t.unlock.action }).click();
  await expect(page.getByRole('alert')).toContainText('not correct');
  await page.getByLabel(t.unlock.passwordLabel, { exact: true }).fill('correct horse battery');
  await page.getByRole('button', { name: t.unlock.action }).click();
  await expect(page.getByText(t.unlock.unlocked)).toBeVisible();

  const unlocked = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(await pageSizesOf(unlocked.bytes)).toEqual([[200, 300], [300, 400]]);
  watch.assertClean();
});

test('unlock says when a file has no password', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/unlock-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('plain.pdf', await makePdf([[200, 300]])));
  await expect(page.getByRole('alert')).toHaveText('plain.pdf isn’t password-protected, so there’s nothing to unlock.');
  watch.assertClean();
});

test('compress shrinks a PDF with a large photo', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/compress-pdf');
  const jpeg = await bigJpeg(page);
  const doc = await PDFDocument.create();
  const image = await doc.embedJpg(jpeg);
  doc.addPage([600, 450]).drawImage(image, { x: 0, y: 0, width: 600, height: 450 });
  const original = await doc.save();

  await page.locator('input[type="file"]').setInputFiles(pdfUpload('photo.pdf', original));
  await page.getByText(t.compress.levels.strong, { exact: true }).click();
  await page.getByRole('button', { name: t.compress.action }).click();
  await expect(page.getByText(/% smaller\.$/)).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('1 image made smaller.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('photo-compressed.pdf');
  expect(result.bytes.byteLength).toBeLessThan(original.byteLength / 2);

  const compressed = await PDFDocument.load(result.bytes);
  expect(compressed.getPageCount()).toBe(1);
  const images = compressed.context
    .enumerateIndirectObjects()
    .map(([, object]) => object)
    .filter((object): object is PDFRawStream => object instanceof PDFRawStream && object.dict.get(PDFName.of('Subtype')) === PDFName.of('Image'));
  expect(images).toHaveLength(1);
  expect((images[0]!.dict.get(PDFName.of('Width')) as PDFNumber).asNumber()).toBe(1000);
  watch.assertClean();
});

test('repair rebuilds a truncated PDF', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const doc = await PDFDocument.create();
  for (const size of [[200, 300], [300, 400], [400, 500]] as const) doc.addPage([...size]);
  const text = new TextDecoder('latin1').decode(await doc.save({ useObjectStreams: false }));
  const truncated = Uint8Array.from(text.slice(0, text.lastIndexOf('endobj') + 6), (char) => char.charCodeAt(0));

  await page.goto('/repair-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('broken.pdf', truncated));
  await page.getByRole('button', { name: t.repair.action }).click();
  await expect(page.getByText('Rebuilt 3 pages.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(await pageSizesOf(result.bytes)).toEqual([[200, 300], [300, 400], [400, 500]]);
  watch.assertClean();
});

test('flatten turns form fields into content', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const doc = await PDFDocument.create();
  const pdfPage = doc.addPage([400, 400]);
  const field = doc.getForm().createTextField('name');
  field.setText('Ada Lovelace');
  field.addToPage(pdfPage, { x: 50, y: 300, width: 200, height: 24 });

  await page.goto('/flatten-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('form.pdf', await doc.save()));
  await page.getByRole('button', { name: t.flatten.action }).click();
  await expect(page.getByText('1 form field flattened.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect((await PDFDocument.load(result.bytes)).getForm().getFields()).toHaveLength(0);
  watch.assertClean();
});

test('remove metadata strips the author and adds nothing of ours', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const doc = await PDFDocument.create();
  doc.addPage([300, 300]);
  doc.setTitle('Secret Report');
  doc.setAuthor('Ada Lovelace');

  await page.goto('/remove-metadata');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await doc.save()));
  await page.getByRole('button', { name: t.removeMetadata.action }).click();
  await expect(page.getByText(/document information fields removed/)).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  const cleaned = await loadPdf({ name: 'clean.pdf', bytes: result.bytes });
  expect(cleaned.getTitle()).toBeUndefined();
  expect(cleaned.getAuthor()).toBeUndefined();
  // The promise on the page is that we do not substitute our own name for theirs.
  expect(cleaned.getProducer()).toBeUndefined();
  watch.assertClean();
});

test('remove annotations deletes the comments and keeps the form field', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const doc = await PDFDocument.create();
  const pdfPage = doc.addPage([300, 300]);
  const { context } = doc;
  pdfPage.node.addAnnot(
    context.register(context.obj({ Type: 'Annot', Subtype: 'Text', Rect: [10, 10, 30, 30], Contents: 'Please revise' })),
  );
  pdfPage.node.addAnnot(context.register(context.obj({ Type: 'Annot', Subtype: 'Highlight', Rect: [40, 40, 90, 60] })));
  pdfPage.node.addAnnot(
    context.register(context.obj({ Type: 'Annot', Subtype: 'Widget', FT: 'Tx', T: 'name', Rect: [150, 150, 250, 170] })),
  );

  await page.goto('/remove-annotations');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('marked.pdf', await doc.save()));
  await page.getByRole('button', { name: t.removeAnnotations.action }).click();
  await expect(page.getByText('2 annotations removed.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  const cleaned = await loadPdf({ name: 'clean.pdf', bytes: result.bytes });
  const annots = cleaned.getPage(0).node.lookupMaybe(PDFName.of('Annots'), PDFArray);
  expect(annots?.size()).toBe(1); // the form field survives
  watch.assertClean();
});

test('compare shows text and visual differences', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const original = await textPdf(['The quick brown fox jumps', 'Unchanged second page']);
  const changed = await textPdf(['The quick red fox jumps high', 'Unchanged second page', 'A brand new page']);

  await page.goto('/compare-pdf');
  await page.locator('input[type="file"]').first().setInputFiles(pdfUpload('v1.pdf', original));
  // The original's slot now shows the file, so the only picker left is the changed version's.
  await expect(page.locator('input[type="file"]')).toHaveCount(1);
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('v2.pdf', changed));

  // red, high, plus the four words of the new page; brown removed.
  await expect(page.getByText('6 words added, 1 word removed')).toBeVisible();
  await expect(page.locator('.text-diff__body del')).toHaveText(['brown ']);
  await expect(page.locator('.text-diff__body ins')).toHaveText(['red ', 'high']);
  await expect(page.getByRole('button', { name: /Page 2.*No text changes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`Page 3.*${t.compare.onlyInChanged}`) })).toBeVisible();

  await page.getByText(t.compare.modes.overlay, { exact: true }).click();
  await expect(page.getByText(/of this page looks different/)).toBeVisible();
  await page.getByRole('button', { name: /Page 2/ }).click();
  await expect(page.getByText(t.compare.visualSame)).toBeVisible();

  await page.getByText(t.compare.modes.sideBySide, { exact: true }).click();
  await expect(page.getByRole('img', { name: 'Original, page 2' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Changed version, page 2' })).toBeVisible();
  watch.assertClean();
});
