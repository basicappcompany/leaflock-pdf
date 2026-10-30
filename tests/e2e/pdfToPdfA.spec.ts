/// <reference types="node" />
import { PDFDocument, PDFName, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { en } from '../../src/i18n/en';
import { loadPdf } from '../../src/lib/pdf/load';
import { makePdf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

const t = en.tools.pdfToPdfA;

/** A fixture carrying document JavaScript — the thing PDF/A forbids outright. */
async function pdfWithJavaScript(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  doc.addPage([300, 400]).drawText('Hello', { x: 20, y: 200, size: 18, font });
  const context = doc.context;
  const js = context.register(context.obj({ S: 'JavaScript', JS: 'app.alert("hi")' }));
  doc.catalog.set(PDFName.of('OpenAction'), js);
  return doc.save();
}

const asText = (bytes: Uint8Array) => Buffer.from(bytes).toString('latin1');

test('PDF to PDF/A: adds the output intent and PDF/A metadata, strips JavaScript, reports an unembedded font', async ({
  page,
  baseURL,
}) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/pdf-to-pdfa');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await pdfWithJavaScript()));
  await page.getByRole('button', { name: t.action }).click();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('report-pdfa.pdf');

  // The standard-font fixture never embeds Helvetica, so the tool has to say so plainly.
  await expect(page.getByText(/Helvetica/)).toBeVisible();

  const text = asText(result.bytes);
  expect(text).toContain('GTS_PDFA1');
  expect(text).toContain('<pdfaid:part>2</pdfaid:part>');
  expect(text).not.toContain('app.alert');

  const doc = await loadPdf({ name: 'out.pdf', bytes: result.bytes });
  expect(doc.catalog.has(PDFName.of('OpenAction'))).toBe(false);
  expect(doc.catalog.has(PDFName.of('OutputIntents'))).toBe(true);
  const metadataRef = doc.catalog.get(PDFName.of('Metadata'));
  expect(metadataRef).toBeDefined();

  watch.assertClean();
});

test('PDF to PDF/A: rejects a restriction-only encrypted file', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const restricted = await makePdf([[300, 400]], { ownerPassword: 'owner-secret' });

  await page.goto('/pdf-to-pdfa');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('restricted.pdf', restricted));
  await page.getByRole('button', { name: t.action }).click();

  await expect(page.getByRole('alert')).toContainText('password-protected');
  watch.assertClean();
});
