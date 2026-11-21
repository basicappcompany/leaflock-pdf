---
title: How to extract text from a PDF
description: Pull all the text out of a PDF into a plain .txt file on your device, keep track of pages, and what to do when no text is found.
published: 2026-11-22
tools: [pdfToText]
---

You have a PDF and you want the words in it: to paste into an email, search in a text editor, feed to another program or quote in a report. Selecting and copying works for a paragraph. For a whole document, extracting the text in one go is faster and more reliable. This guide explains how to do it, what you get and what to do when the PDF turns out to hold no text at all.

## How to extract text with LeafLock

The text is read out of the PDF by your browser and stays on your device, in the preview and in the file you download.

1. Open [PDF to Text](/pdf-to-text) and choose your file.
2. Choose whether to mark where each page starts.
3. Read the preview, copy from it directly or download the .txt file.

## What you get

A plain text file in UTF-8, which opens in any text editor. It is plain text with line breaks: fonts, tables and images are not kept. Text laid out in columns may not come out in reading order, because a PDF stores text as pieces placed at coordinates, and the tool reads them in the order they appear in the file.

If a document is set in two columns, check the result against the original. If column order matters, [PDF to Word](/pdf-to-word) and [PDF to Markdown](/pdf-to-markdown) warn which pages appear to have columns.

## Marking page boundaries

The **Mark where each page starts** option is on by default and adds a line such as `--- Page 2 ---` before each page. That helps when you need to cite where something came from, or when you will later split the text by page. Turn it off when you want continuous text, for example to paste into an article.

## "No text was found"

Sometimes the extraction comes back empty. The most likely reason is that the PDF holds pictures of pages, a scan or a photo, not real text. There is nothing to extract, because there are no letters in the file, only pixels.

The fix is to run the PDF through [OCR PDF](/ocr-pdf) first. That recognizes the words and adds them as a text layer. Then extract the text from the OCR result. [How to turn a scanned PDF into searchable text](/guides/scanned-pdf-to-searchable-text) walks through it.

## Password-protected PDFs

If the PDF needs a password to open, remove the password with [Unlock PDF](/unlock-pdf) first, using the password you have, then extract the text. See [how to unlock a PDF you have the password for](/guides/how-to-unlock-a-pdf).

## Which text tool should I use?

| You want | Use |
|---|---|
| Only the words | PDF to Text |
| Headings and lists kept as structure, in a Markdown file | [PDF to Markdown](/pdf-to-markdown) |
| An editable Word file | [PDF to Word](/pdf-to-word) |
| Tables as spreadsheet data | [PDF to Excel](/pdf-to-excel) or [Extract tables](/extract-tables-from-pdf) |

## Practical tips

- Check the first and last page of the output to confirm nothing was cut off.
- Hyphenated words at line ends may stay split in two, so search for fragments if a word seems missing.
- Special characters and ligatures usually come through, but check names and numbers where accuracy matters.
- For legal or financial text, compare key figures against the PDF, not just the extract.

## Why on-device matters here

The documents people want text from are often ones they would rather not upload: reports, contracts and statements. The text is read on your device and never sent anywhere.

## Summary

1. You get a UTF-8 .txt file with line breaks; layout is not kept.
2. Page markers are optional.
3. No text means the PDF is a scan; run OCR PDF first.
4. Use Unlock PDF first if a password is needed to open the file.
