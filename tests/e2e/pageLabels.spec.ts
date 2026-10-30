/// <reference types="node" />
import { PDFArray, PDFDict, PDFName, PDFNumber, PDFString } from '@cantoo/pdf-lib';
import { expect, test } from '@playwright/test';
import { loadPdf } from '../../src/lib/pdf/load';
import { makePdf } from '../fixtures/pdfs';
import { download, pdfUpload, watchPage } from './helpers';

test('Page labels: a preface in roman numerals, then decimal numbering restarting at 1', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const pages: [number, number][] = Array.from({ length: 6 }, () => [300, 400]);

  await page.goto('/add-page-labels');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await makePdf(pages)));
  await expect(page.getByText('Page 1:')).toBeVisible();

  // Second range: starts at page 4, decimal, prefix "Ch. ".
  await page.getByRole('button', { name: 'Add a range' }).click();
  const fromPageInputs = page.getByLabel('From page');
  await fromPageInputs.nth(1).fill('4');
  const styleSelects = page.getByLabel('Style');
  await styleSelects.nth(0).selectOption('lowerRoman');
  const prefixInputs = page.getByLabel('Prefix');
  await prefixInputs.nth(1).fill('Ch. ');

  await expect(page.getByText('Page 1: i')).toBeVisible();
  await expect(page.getByText('Page 4: Ch. 1')).toBeVisible();

  await page.getByRole('button', { name: 'Add page labels' }).click();
  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('report-labelled.pdf');

  const doc = await loadPdf({ name: 'out.pdf', bytes: result.bytes });
  const pageLabels = doc.catalog.lookupMaybe(PDFName.of('PageLabels'), PDFDict)!;
  const nums = pageLabels.lookupMaybe(PDFName.of('Nums'), PDFArray)!;
  expect((nums.lookup(0, PDFNumber) as PDFNumber).asNumber()).toBe(0);
  expect((nums.lookup(1, PDFDict) as PDFDict).lookupMaybe(PDFName.of('S'), PDFName)?.decodeText()).toBe('r');
  expect((nums.lookup(2, PDFNumber) as PDFNumber).asNumber()).toBe(3);
  const secondDict = nums.lookup(3, PDFDict) as PDFDict;
  expect(secondDict.lookupMaybe(PDFName.of('S'), PDFName)?.decodeText()).toBe('D');
  expect(secondDict.lookupMaybe(PDFName.of('P'), PDFString)?.decodeText()).toBe('Ch. ');

  watch.assertClean();
});

test('Page labels: the button stays disabled until the first range starts at page 1', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/add-page-labels');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await makePdf([[300, 400], [300, 400]])));
  await expect(page.getByRole('button', { name: 'Add page labels' })).toBeEnabled();

  // The first row's "From page" is fixed, so force an invalid state through a second
  // row that starts before the point validateRanges would accept, then remove the first.
  await page.getByRole('button', { name: 'Add a range' }).click();
  await page.getByLabel('From page').nth(1).fill('2');
  await page.getByRole('button', { name: 'Remove this range' }).first().click();

  await expect(page.getByText('The first range must start at page 1.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add page labels' })).toBeDisabled();

  watch.assertClean();
});
