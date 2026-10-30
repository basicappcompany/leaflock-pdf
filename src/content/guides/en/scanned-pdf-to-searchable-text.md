---
title: How to turn a scanned PDF into searchable text
description: What OCR is, how to prepare scans for accurate text recognition, and how to make a scanned PDF searchable on your own device without uploading it.
published: 2026-10-21
tools: [ocr, scan, pdfToText, rotate]
---

A scanned PDF looks like a document, but to your computer it's just a set of pictures. You can't search it, select a sentence, or copy a paragraph into an email. Screen readers can't read it aloud either.

OCR fixes that. This guide explains what OCR does, how to get accurate results, and how to run it on your own device so your scans stay private.

## What OCR is

OCR stands for optical character recognition. It's software that looks at an image of text and works out which letters and words it shows.

When you run OCR on a scanned PDF, the result is usually a **searchable PDF**. It looks exactly like the original scan, but an invisible layer of recognized text sits on top of each page, lined up with the words in the image. That lets you:

- Search the document with Ctrl+F (Cmd+F on a Mac)
- Select and copy text
- Have the text read by screen readers and other assistive tools
- Find the document later by searching your computer or file storage for words inside it

### How to tell if a PDF needs OCR

Open the PDF and try to select a word with your mouse. If you can highlight individual words, the PDF already has text. If your selection draws a box over the whole page, or nothing happens, the page is an image and needs OCR.

## How to make a scanned PDF searchable with LeafLock

[OCR PDF](/ocr-pdf) recognizes text in your browser. Your scan isn't uploaded.

1. Open [OCR PDF](/ocr-pdf) and choose your scanned PDF. If you have photos or image files instead, choose those; they'll be combined into one searchable PDF.
2. Select **Recognize text**. The first time, your browser downloads the English text model (about 10 MB) from our site. After that, it's usually reused from your browser's cache.
3. Wait while each page is recognized. Long documents take a while, because the work is done by your own device.
4. Download the searchable PDF, or copy the recognized text directly.

If you only need the plain text, [PDF to Text](/pdf-to-text) can extract it from a PDF that already has a text layer, including one you've just run through OCR.

### English only, for now

LeafLock's OCR currently recognizes **English** text. Other languages will be added later. Documents in other languages will give poor or empty results, and pages that mix languages will only be read accurately where the text is in English.

## How to get good OCR results

OCR accuracy depends far more on the scan than on the software. A clean, straight, sharp page is usually recognized almost perfectly. A blurry, tilted photo taken in bad light can come out as nonsense. These tips make the biggest difference.

### Resolution

- **Scan at 300 DPI** for normal documents. That's the usual standard for OCR.
- **Use 400 to 600 DPI for very small print,** such as footnotes or fine print on contracts.
- **Avoid going much lower than 200 DPI.** Letters start to blur together and accuracy drops quickly.

If you're photographing a page with a phone, fill the frame with the page and hold the phone steady. Today's phone cameras have plenty of resolution; blur and shadows are the real problems.

### Straight, upright pages

- **Rotate pages the right way up** before running OCR. Text on its side or upside down is often not recognized at all. Use [Rotate PDF](/rotate-pdf) to fix them.
- **Keep the page straight.** Line the paper up with the edge of the scanner glass. With a phone, hold it directly above the page, not at an angle.
- **Flatten the page.** Curved pages near a book's spine distort the lines of text. Press the book flat, or scan one page at a time.

### Contrast and light

- **Dark text on a light background** works best.
- **Use even light.** Avoid shadows from your hand or phone, and glare from glossy paper or a lamp.
- **Grayscale is fine.** Color usually doesn't help recognition, and it makes the file bigger.
- **Avoid heavy compression.** Very low-quality JPEG images create smudges around letters that confuse OCR.

### Know what OCR struggles with

Even with a perfect scan, some content is hard to recognize:

- Handwriting, especially joined-up writing
- Decorative or very stylized fonts
- Text over photos or patterned backgrounds
- Complex tables, where text may be read in an unexpected order
- Stamps, watermarks and text at an angle

Always check important details in the recognized text, such as names, amounts and dates. OCR can confuse similar characters, like `0` and `O`, `1` and `l`, or `rn` and `m`.

## Scan directly to a PDF

If you're starting from paper, [Scan to PDF](/scan-to-pdf) uses your phone or laptop camera to photograph pages and save them as a PDF, also without uploading them. Then run the result through [OCR PDF](/ocr-pdf) to make it searchable.

## Why on-device OCR matters for privacy

The documents people scan are often personal: medical letters, tax records, bank statements, ID cards, contracts. Many OCR services upload each page to a server, where the text is recognized and the result is sent back.

With LeafLock, recognition happens in your browser. The text model is downloaded from our own site and runs on your device. The pages you scan and the text recognized from them stay with you. Your browser enforces this: our Content Security Policy only lets the page connect to our own site, and our tools don't send your files there.

You can check this for yourself, on our site or any other, using the steps in [how to check if a PDF site uploads your files](/guides/how-to-check-if-a-pdf-site-uploads-your-files). The offline test works well for OCR: run it once online so the text model is downloaded, then disconnect and try again.

## Summary

1. OCR turns pictures of text into real, searchable text, usually as an invisible layer in the PDF.
2. Good scans matter most: 300 DPI, straight and upright pages, dark text on a light background, even light.
3. LeafLock's [OCR PDF](/ocr-pdf) currently recognizes English text.
4. OCR runs on your device, so your scans aren't uploaded.

Related: [How to compress a PDF for email](/guides/compress-pdf-for-email), for when your searchable scan is too big to send.
