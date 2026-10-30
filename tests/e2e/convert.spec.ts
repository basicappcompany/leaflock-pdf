/// <reference types="node" />
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PDFDocument, StandardFonts } from '@cantoo/pdf-lib';
import { expect, test, type Page } from '@playwright/test';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { unzipSync } from 'fflate';
import { makePdf, pageSizesOf } from '../fixtures/pdfs';
import { makePng } from '../fixtures/images';
import { pageTextRuns } from '../../src/lib/pdfjs';
import { download, pdfUpload, watchPage } from './helpers';

const requireFromHere = createRequire(import.meta.url);
GlobalWorkerOptions.workerSrc = pathToFileURL(requireFromHere.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs')).href;

/** Every text run of every page, with bold/italic resolved the way `pageTextRuns` does
 * for PDF -> Word — used to check Word -> PDF's output, since both rely on the same
 * pdf.js `commonObjs` route. */
async function allPdfTextRuns(bytes: Uint8Array) {
  const doc = await getDocument({ data: new Uint8Array(bytes) }).promise;
  const pages = [];
  for (let number = 1; number <= doc.numPages; number++) {
    pages.push(await pageTextRuns(await doc.getPage(number)));
  }
  await doc.loadingTask.destroy();
  return pages;
}

// A fake camera for the Scan test (Chromium/Edge flags); harmless for the other tests.
test.use({ launchOptions: { args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] } });

const fontsDir = fileURLToPath(new URL('../../node_modules/pdfjs-dist/standard_fonts/', import.meta.url)).replaceAll(
  '\\',
  '/',
);

/** All text pdf.js can extract from a PDF, pages joined by spaces. */
async function extractText(bytes: Uint8Array): Promise<string> {
  const task = getDocument({ data: new Uint8Array(bytes), standardFontDataUrl: fontsDir });
  const doc = await task.promise;
  let text = '';
  for (let number = 1; number <= doc.numPages; number++) {
    const content = await (await doc.getPage(number)).getTextContent();
    text += content.items.map((item) => ('str' in item ? item.str : '')).join(' ') + ' ';
  }
  await task.destroy();
  return text;
}

/** Draws an image in the page's own canvas and returns its bytes (real, decodable JPEG/WebP/PNG). */
async function canvasImage(
  page: Page,
  type: 'image/jpeg' | 'image/webp' | 'image/png',
  width: number,
  height: number,
  text?: string,
): Promise<Buffer> {
  const dataUrl = await page.evaluate(
    ({ type, width, height, text }) => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.fillStyle = text ? '#000000' : '#3a7';
      if (text) {
        context.font = 'bold 110px Arial, sans-serif';
        context.textBaseline = 'middle';
        context.fillText(text, 60, height / 2);
      } else {
        context.fillRect(width / 4, height / 4, width / 2, height / 2);
      }
      return canvas.toDataURL(type, 0.95);
    },
    { type, width, height, text },
  );
  return Buffer.from(dataUrl.split(',')[1]!, 'base64');
}

const image = (name: string, mimeType: string, buffer: Buffer | Uint8Array) => ({
  name,
  mimeType,
  buffer: Buffer.from(buffer),
});

test('JPG to PDF: converts PNG, JPEG and WebP to A4 pages in order', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/jpg-to-pdf');
  const jpeg = await canvasImage(page, 'image/jpeg', 300, 600);
  const webp = await canvasImage(page, 'image/webp', 500, 500);

  await page.locator('input[type="file"]').setInputFiles([
    image('wide.png', 'image/png', makePng(400, 200)),
    image('tall.jpg', 'image/jpeg', jpeg),
    image('square.webp', 'image/webp', webp),
  ]);
  await expect(page.getByText('3 images')).toBeVisible();

  // Put the WebP first.
  await page.getByRole('button', { name: 'Move square.webp up' }).click();
  await page.getByRole('button', { name: 'Move square.webp up' }).click();
  await page.getByText('A4', { exact: true }).click();
  await page.getByRole('button', { name: 'Convert to PDF' }).click();

  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('images.pdf');
  expect(await pageSizesOf(bytes)).toEqual([
    [595, 842],
    [842, 595],
    [595, 842],
  ]);
  watch.assertClean();
});

test('JPG to PDF: names an image that cannot be read', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/jpg-to-pdf');
  await page.locator('input[type="file"]').setInputFiles([
    image('broken.jpg', 'image/jpeg', Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 1, 2, 3])),
  ]);
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByRole('alert')).toContainText('broken.jpg could not be read');
  watch.assertClean();
});

test('PDF to JPG: renders each page at the chosen resolution', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/pdf-to-jpg');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await makePdf([[200, 300], [300, 200]])));
  await expect(page.getByText('2 pages')).toBeVisible();
  await page.getByRole('button', { name: 'Convert to images' }).click();

  const { file, bytes } = await download(page, () =>
    page.getByRole('link', { name: 'Download report-page-1.jpg' }).click(),
  );
  expect(file.suggestedFilename()).toBe('report-page-1.jpg');
  expect([...bytes.subarray(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  // 200×300 pt at 150 dpi.
  const size = await page.evaluate(async (data) => {
    const bitmap = await createImageBitmap(new Blob([new Uint8Array(data)]));
    return [bitmap.width, bitmap.height];
  }, [...bytes]);
  expect(size).toEqual([417, 625]);

  const zip = await download(page, () => page.getByRole('button', { name: 'Download all as ZIP' }).click());
  expect(Object.keys(unzipSync(new Uint8Array(zip.bytes))).sort()).toEqual(['report-page-1.jpg', 'report-page-2.jpg']);
  watch.assertClean();
});

test('PDF to JPG: PNG output for chosen pages only', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/pdf-to-jpg');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('three.pdf', await makePdf([[200, 200], [200, 200], [200, 200]])));
  await page.getByText('PNG', { exact: true }).click();
  await page.getByText('Chosen pages', { exact: true }).click();
  await page.getByLabel('Pages', { exact: true }).fill('2-3');
  await page.getByRole('button', { name: 'Convert to images' }).click();
  await expect(page.getByRole('link', { name: 'Download three-page-2.png' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Download three-page-3.png' })).toBeVisible();
  await expect(page.getByRole('link', { name: /three-page-1/ })).toHaveCount(0);
  watch.assertClean();
});

test('PDF to text: extracts text with page markers, and offers OCR for scans', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/pdf-to-text');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('notes.pdf', await makePdf([[300, 300], [300, 300]])));
  const textArea = page.getByLabel('Text from notes.pdf');
  await expect(textArea).toHaveValue(/--- Page 1 ---\nPage 1\n\n--- Page 2 ---\nPage 2/);

  await page.getByLabel('Mark where each page starts').click();
  await expect(textArea).toHaveValue('Page 1\n\nPage 2');
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('notes-text.txt');
  expect(bytes.toString('utf8')).toBe('Page 1\n\nPage 2');

  const blank = await PDFDocument.create();
  blank.addPage([300, 300]);
  await page.getByRole('button', { name: 'Choose a different file' }).click();
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('scan.pdf', await blank.save()));
  await expect(page.getByText('This PDF has no selectable text.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Recognize the text with OCR PDF' })).toHaveAttribute('href', '/ocr-pdf');
  watch.assertClean();
});

test('OCR: recognises text in an image and makes a searchable PDF', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const watch = watchPage(page, baseURL!);
  await page.goto('/ocr-pdf');
  const scan = await canvasImage(page, 'image/png', 1800, 400, 'LEAFLOCK PRIVATE');

  await page.getByRole('button', { name: 'Choose images' }).click();
  await page.locator('input[type="file"]').setInputFiles([image('scan.png', 'image/png', scan)]);
  await page.getByRole('button', { name: 'Recognize text' }).click();

  await expect(page.getByLabel('Recognized text')).toHaveValue(/LEAFLOCK\s+PRIVATE/, { timeout: 150_000 });
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('scan-searchable.pdf');
  expect(await extractText(bytes)).toMatch(/LEAFLOCK\s+PRIVATE/);
  watch.assertClean();
});

test('OCR: adds a text layer to a scanned PDF and keeps its pages', async ({ page, baseURL }) => {
  test.setTimeout(180_000);
  const watch = watchPage(page, baseURL!);
  await page.goto('/ocr-pdf');
  const scan = await canvasImage(page, 'image/png', 1800, 400, 'INVOICE 2026');
  const doc = await PDFDocument.create();
  const embedded = await doc.embedPng(scan);
  doc.addPage([900, 200]).drawImage(embedded, { x: 0, y: 0, width: 900, height: 200 });

  await page.locator('input[type="file"]').setInputFiles(pdfUpload('scanned.pdf', await doc.save()));
  await expect(page.getByText('1 page')).toBeVisible();
  await page.getByRole('button', { name: 'Recognize text' }).click();

  await expect(page.getByLabel('Recognized text')).toHaveValue(/INVOICE\s+2026/, { timeout: 150_000 });
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('scanned-searchable.pdf');
  expect(await pageSizesOf(bytes)).toEqual([[900, 200]]);
  expect(await extractText(bytes)).toMatch(/INVOICE\s+2026/);
  watch.assertClean();
});

test('Scan: photos chosen from the device become a PDF', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  await page.goto('/scan-to-pdf');
  const photo = await canvasImage(page, 'image/jpeg', 600, 800);
  await page.locator('input[type="file"]').setInputFiles([
    image('IMG_1.jpg', 'image/jpeg', photo),
    image('IMG_2.jpg', 'image/jpeg', photo),
  ]);
  await expect(page.getByText('2 pages')).toBeVisible();
  await page.getByRole('button', { name: 'Remove Page 2' }).click();
  await expect(page.getByText('1 page', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Save PDF' }).click();
  const { file, bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(file.suggestedFilename()).toBe('scan.pdf');
  expect(await pageSizesOf(bytes)).toEqual([[450, 600]]);
  watch.assertClean();
});

test.describe('with a camera', () => {
  test('Scan: captures pages from the camera, retakes one, and stops the camera', async ({ page, baseURL }) => {
    const watch = watchPage(page, baseURL!);
    await page.goto('/scan-to-pdf');
    await page.getByRole('button', { name: 'Start camera' }).click();
    const video = page.getByLabel('Camera preview');
    await expect(video).toBeVisible();
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.videoWidth)).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Capture page' }).click();
    await expect(page.getByText('1 page', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Capture page' }).click();
    await expect(page.getByText('2 pages')).toBeVisible();

    await page.getByRole('button', { name: 'Retake page 1' }).click();
    await page.getByRole('button', { name: 'Replace page 1' }).click();
    await expect(page.getByText('2 pages')).toBeVisible();

    await page.getByRole('button', { name: 'Save PDF' }).click();
    const { bytes } = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
    expect((await pageSizesOf(bytes)).length).toBe(2);
    // Saving stops the camera.
    await expect(video).toHaveCount(0);
    watch.assertClean();
  });
});

test('PDF to Word: keeps headings, bold, italic and lists as real Word formatting', async ({ page, baseURL }) => {
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

  await page.goto('/pdf-to-word');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('report.pdf', await source.save()));
  await page.getByRole('button', { name: 'Convert to Word' }).click();

  await expect(page.getByText('1 heading.')).toBeVisible();
  await expect(page.getByText('2 list items.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('report-converted.docx');

  const parts = unzipSync(result.bytes);
  const xml = new TextDecoder().decode(parts['word/document.xml']!);

  // The text survived, joined back into one paragraph across the line break.
  expect(xml).toContain('Quarterly Report');
  expect(xml).toContain('This is body copy on one line and this is its second line.');

  // Heading, bold and italic are Word formatting, and the bullets are a real list —
  // this is also the guard that pdf.js still reports font styles (see lib/pdfjs.ts).
  expect(xml).toContain('Heading1');
  expect(xml).toMatch(/<w:b\b/);
  expect(xml).toMatch(/<w:i\b/);
  expect(xml).toContain('<w:numPr>');
  expect(xml).toContain('first bullet');
  // The bullet character was formatting, not text.
  expect(xml).not.toContain('- first bullet');

  watch.assertClean();
});

test('PDF to Excel: finds columns in a price list and keeps prose as one column', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
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
  prose.drawText('so it should stay as one wide column.', { x: 60, y: 744, size: 11, font });

  await page.goto('/pdf-to-excel');
  await page.locator('input[type="file"]').setInputFiles(pdfUpload('prices.pdf', await source.save()));
  await page.getByRole('button', { name: 'Convert to Excel' }).click();

  await expect(page.getByText('2 sheets.')).toBeVisible();
  await expect(page.getByText('A column layout was found on page 1.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('prices-converted.xlsx');

  const parts = unzipSync(result.bytes);
  const allXml = Object.values(parts).map((data) => new TextDecoder().decode(data)).join('\n');

  // The table's data landed somewhere in the workbook, cell by cell.
  for (const text of ['Item', 'Qty', 'Price', 'Widget', '3', '$9.00', 'Sprocket', '$2.50']) {
    expect(allXml).toContain(text);
  }
  // The two sheets are distinguishable by page.
  expect(allXml).toContain('Page 1');
  expect(allXml).toContain('Page 2');
  // The prose page's two lines joined back into full sentences, not split into columns.
  expect(allXml).toContain('This page is ordinary prose, not a table,');

  watch.assertClean();
});

test('Word to PDF: keeps headings, bold, italic and lists, drops a table with notice', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun: DocxRun } = await import('docx');

  const source = new Document({
    sections: [
      {
        children: [
          new Paragraph({ children: [new DocxRun({ text: 'Quarterly Report' })], heading: HeadingLevel.HEADING_1 }),
          new Paragraph({
            children: [
              new DocxRun({ text: 'Plain, ' }),
              new DocxRun({ text: 'bold', bold: true }),
              new DocxRun({ text: ' and ' }),
              new DocxRun({ text: 'italic', italics: true }),
              new DocxRun({ text: ' text.' }),
            ],
          }),
          new Paragraph({ children: [new DocxRun({ text: 'First point' })], bullet: { level: 0 } }),
          new Paragraph({ children: [new DocxRun({ text: 'Second point' })], bullet: { level: 0 } }),
          new Table({
            rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph('cell')] })] })],
          }),
        ],
      },
    ],
  });
  const bytes = new Uint8Array(await Packer.toArrayBuffer(source));

  await page.goto('/word-to-pdf');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'report.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    buffer: Buffer.from(bytes),
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();

  await expect(page.getByText('1 table was dropped.')).toBeVisible();
  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('report-converted.pdf');

  const runs = (await allPdfTextRuns(result.bytes))[0]!;
  const by = (text: string) => runs.find((r) => r.text === text)!;
  expect(by('Quarterly Report').bold).toBe(true);
  expect(by('bold').bold).toBe(true);
  expect(by('italic').italic).toBe(true);
  expect(runs.map((r) => r.text)).toContain('•');
  expect(runs.map((r) => r.text)).toContain('First point');

  watch.assertClean();
});

test('Excel to PDF: draws each sheet as a bordered grid, columns aligned', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const writeXlsxFile = (await import('write-excel-file/node')).default;
  const buffer = await writeXlsxFile([
    { sheet: 'Prices', data: [['Item', 'Price'], ['Widget', '$9']].map((row) => row.map((value) => ({ type: String, value }))) },
    { sheet: 'Notes', data: [['second sheet']].map((row) => row.map((value) => ({ type: String, value }))) },
  ]).toBuffer();

  await page.goto('/excel-to-pdf');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'workbook.xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    buffer: Buffer.from(buffer),
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText('2 pages.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('workbook-converted.pdf');

  const doc = await getDocument({ data: new Uint8Array(result.bytes) }).promise;
  expect(doc.numPages).toBe(2);
  const first = await (await doc.getPage(1)).getTextContent();
  const items = first.items.flatMap((item) => ('str' in item && item.str.trim() ? [{ text: item.str, x: item.transform[4] as number }] : []));
  const byText = (text: string) => items.find((i) => i.text === text)!;
  expect(byText('Prices')).toBeDefined(); // the sheet name, drawn as a heading
  expect(Math.round(byText('Item').x)).toBe(Math.round(byText('Widget').x));
  expect(byText('Item').x).toBeLessThan(byText('Price').x);

  const second = await (await doc.getPage(2)).getTextContent();
  expect(second.items.some((item) => 'str' in item && item.str === 'Notes')).toBe(true);
  await doc.loadingTask.destroy();

  watch.assertClean();
});

test('CSV to PDF: draws rows as a bordered grid, including a quoted comma', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const csv = 'Item,Price\n"Widget, deluxe",$9\n';

  await page.goto('/csv-to-pdf');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'prices.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText('1 page.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('prices-converted.pdf');

  const text = await extractText(result.bytes);
  expect(text).toContain('Widget, deluxe');
  expect(text).toContain('$9');

  watch.assertClean();
});

test('RTF to PDF: keeps paragraphs, bold and italic, skips the font table as text', async ({ page, baseURL }) => {
  const watch = watchPage(page, baseURL!);
  const rtf = String.raw`{\rtf1\ansi\deff0{\fonttbl{\f0 Arial;}}` +
    String.raw`A plain paragraph.\par ` +
    String.raw`\b Bold\b0  and \i italic\i0  text.}`;

  await page.goto('/rtf-to-pdf');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'letter.rtf',
    mimeType: 'application/rtf',
    buffer: Buffer.from(rtf),
  });
  await page.getByRole('button', { name: 'Convert to PDF' }).click();
  await expect(page.getByText('1 page.')).toBeVisible();

  const result = await download(page, () => page.getByRole('link', { name: 'Download', exact: true }).click());
  expect(result.file.suggestedFilename()).toBe('letter-converted.pdf');

  const runs = (await allPdfTextRuns(result.bytes))[0]!;
  const text = runs.map((r) => r.text).join('');
  expect(text).toContain('A plain paragraph.');
  // The font table name must not leak into the document as visible text.
  expect(text).not.toContain('Arial');

  const by = (needle: string) => runs.find((r) => r.text.includes(needle))!;
  expect(by('Bold').bold).toBe(true);
  expect(by('italic').italic).toBe(true);

  watch.assertClean();
});
