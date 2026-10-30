/// <reference types="node" />
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { download, pdfUpload, watchPage } from './helpers';

test('PDF to Markdown: keeps headings, bold, italic and lists as real Markdown syntax', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const source = await PDFDocument.create();
  const body = await source.embedFont(StandardFonts.Helvetica);
  const bold = await source.embedFont(StandardFonts.HelveticaBold);
  const italic = await source.embedFont(StandardFonts.HelveticaOblique);

  const sheet = source.addPage([595, 842]);
  sheet.drawText('Quarterly Report', { x: 60, y: 760, size: 24, font: bold });
  sheet.drawText('This is body copy on one line', { x: 60, y: 700, size: 11, font: body });
  sheet.drawText('and this is its second line.', { x: 60, y: 684, size: 11, font: body });
  sheet.drawText('An italic aside here.', { x: 60, y: 640, size: 11, font: italic });
  sheet.drawText('- first bullet', { x: 60, y: 600, size: 11, font: body });
  sheet.drawText('- second bullet', { x: 60, y: 584, size: 11, font: body });

  await page.goto('/pdf-to-markdown');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await source.save()));
  await page.getByRole('button', { name: 'Convert to Markdown' }).click();

  await expect(page.getByText('1 heading.')).toBeVisible();
  await expect(page.getByText('2 list items.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('report-converted.md');

  const md = new TextDecoder().decode(result.bytes);
  // The heading's source font is bold, so the span correctly carries that formatting
  // too — a heading already reads as bold visually, but suppressing real span data
  // would be the dishonest shortcut, not the correct one.
  expect(md).toContain('# **Quarterly Report**');
  expect(md).toContain('This is body copy on one line and this is its second line.');
  expect(md).toContain('*An italic aside here.*');
  expect(md).toContain('- first bullet');
  expect(md).toContain('- second bullet');
  // The bullet character was formatting in the PDF; it must not survive as literal text.
  expect(md).not.toContain('- - first bullet');

  watch.assertClean();
});
