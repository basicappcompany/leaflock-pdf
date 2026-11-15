/// <reference types="node" />
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test } from './fixtures';
import { strFromU8, unzipSync } from 'fflate';
import { download, pdfUpload, watchPage } from './helpers';

/** A page with an aligned table and a page of plain prose, same fixture `PDF to Excel`'s
 * own browser test uses, so both tools are checked against the same column layout. */
async function tableAndProsePdf(): Promise<Uint8Array> {
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);

  const table = source.addPage([595, 842]);
  const row = (text: string[], y: number) => {
    table.drawText(text[0]!, { x: 60, y, size: 11, font });
    table.drawText(text[1]!, { x: 300, y, size: 11, font });
    table.drawText(text[2]!, { x: 450, y, size: 11, font });
  };
  row(['Item', 'Qty', 'Price'], 760);
  row(['Widget', '3', '$9.00'], 740);
  row(['Gadget', '1', '$20.00'], 720);
  row(['Sprocket', '5', '$2.50'], 700);

  const prose = source.addPage([595, 842]);
  prose.drawText('This page is ordinary prose, not a table,', { x: 60, y: 760, size: 11, font });
  prose.drawText('so it should be skipped entirely.', { x: 60, y: 744, size: 11, font });

  return source.save();
}

test('Extract tables: CSV keeps only the table page, skipping prose entirely', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/extract-tables-from-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('prices.pdf', await tableAndProsePdf()));
  await page.getByRole('button', { name: 'Extract tables' }).click();

  await expect(page.getByText('Found a table on 1 page.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('prices-table-p1.csv');

  const text = new TextDecoder().decode(result.bytes);
  expect(text).toContain('Item,Qty,Price');
  expect(text).toContain('Widget,3,$9.00');
  // The prose page never shows up anywhere in the output.
  expect(text).not.toContain('prose');

  watch.assertClean();
});

test('Extract tables: Excel writes one workbook, one sheet per table page', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/extract-tables-from-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('prices.pdf', await tableAndProsePdf()));
  await page.getByText('Excel (.xlsx)').click();
  await page.getByRole('button', { name: 'Extract tables' }).click();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('prices-tables.xlsx');

  const parts = unzipSync(result.bytes);
  const xml = Object.values(parts).map((data) => strFromU8(data)).join('\n');
  expect(xml).toContain('Widget');
  expect(xml).toContain('Page 1');
  expect(xml).not.toContain('Page 2');
  expect(xml).not.toContain('prose');

  watch.assertClean();
});

test('Extract tables: reports plainly when no table is found', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const source = await PDFDocument.create();
  const font = await source.embedFont(StandardFonts.Helvetica);
  source.addPage([400, 300]).drawText('Just a letter, no table here.', { x: 40, y: 150, size: 14, font });

  await page.goto('/extract-tables-from-pdf');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('letter.pdf', await source.save()));
  await page.getByRole('button', { name: 'Extract tables' }).click();

  await expect(page.getByRole('alert')).toContainText('No table was found');
  watch.assertClean();
});
