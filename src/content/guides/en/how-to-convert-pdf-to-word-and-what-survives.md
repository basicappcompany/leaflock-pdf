---
title: How to convert a PDF to Word, and what survives the trip
description: Turn a PDF into an editable Word document on your device, with real headings and lists, and an honest list of what a conversion cannot rebuild.
published: 2026-11-22
tools: [pdfToWord]
updated: 2026-11-23
---

**Short answer:** [PDF to Word](/pdf-to-word) rebuilds paragraphs, headings, bold and italic text and lists, as real Word styles. Tables, images, exact fonts and colors and page layout do not come across, because the structure is inferred from the PDF, not read from it.

Converting a PDF to Word is one of the most searched document jobs, and also one of the most disappointing. Results range from tidy to mangled. This guide explains why, how to get the best result and how to do it without uploading a contract, payslip or medical letter to someone else's server.

## Why converting from PDF is hard

A Word document stores structure: this is a heading, this is a list, this is a table. A PDF stores almost none of that. It records glyphs at coordinates on a page. Any converter therefore infers or invents the structure, and the more complex the layout, the more it has to guess.

That is why the honest question is not "will it look identical" but "which parts can be rebuilt reliably, and which can't".

## What [PDF to Word](/pdf-to-word) rebuilds

- Paragraphs
- Headings
- Bold and italic text
- Bulleted and numbered lists

Headings and lists are real Word styles, not characters typed to look like them. You can keep editing, and the numbering continues properly.

## What it does not rebuild

- Tables
- Images
- Exact fonts and colors
- Precise page layout

A converter that claims to reproduce these either infers them, often wrongly, or invents them. This one tells you what you are getting. If the layout matters more than the text, keep the PDF.

## How to convert with LeafLock

The text is read and the Word file is built in your browser on your device, so nothing is uploaded.

1. Open [PDF to Word](/pdf-to-word) and choose your PDF.
2. Convert.
3. Read any warnings, such as pages that appear to have columns.
4. Download the .docx and open it in Word or another editor.

## How headings are detected

By size, measured against the rest of the document rather than a fixed point size. The size that covers the most text is treated as body copy, and anything meaningfully larger becomes a heading. So a document in 10 pt and one in 14 pt both come out sensibly. A heading that is bold but the same size as the body will not be detected.

## Columns

Two-column text is stored as two blocks side by side, with nothing saying they are columns. Read top to bottom, a left-column line is followed by a right-column line. The tool looks for the gutter between columns and tells you which pages have one, so you can check them instead of discovering shuffled text later.

## Scanned PDFs

A scan is a picture of a page, so no text is found. Run [OCR PDF](/ocr-pdf) first to add a text layer, then convert the result. See [how to turn a scanned PDF into searchable text](/guides/scanned-pdf-to-searchable-text).

## Getting a better result

1. **Start from the original if you have it.** A PDF exported from a word processor converts better than one printed from a scan.
2. **Unlock first if needed.** A password-protected file must be opened with [Unlock PDF](/unlock-pdf) before conversion.
3. **Convert only the pages you need.** [Extract pages](/extract-pages) first for a long document.
4. **Proof the result.** Check numbers, names and any section that had a table.

## When to use a different tool

- You need **tables as data**: [PDF to Excel](/pdf-to-excel) or [Extract tables](/extract-tables-from-pdf).
- You need **just the words**: [PDF to Text](/pdf-to-text).
- You need to **make small changes to a PDF**: [Edit PDF](/edit-pdf) adds text, images and shapes on top of the page without conversion.
- You need to go the other way, see [how to convert a Word document to PDF](/guides/how-to-convert-word-to-pdf-privately).

## Summary

1. A PDF has no structure, so conversion infers it.
2. Paragraphs, headings, bold, italic and lists come across; tables, images, fonts and layout do not.
3. The conversion runs on your device.
4. Scans need OCR first.
