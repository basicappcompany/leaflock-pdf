---
title: How to convert a PDF to Markdown
description: Turn a PDF into clean Markdown with headings, bold, italic and lists, for notes, wikis and documentation, and know what the conversion cannot rebuild.
published: 2026-11-22
tools: [pdfToMarkdown]
updated: 2026-11-23
---

**Short answer:** [PDF to Markdown](/pdf-to-markdown) writes paragraphs, headings, bold, italic and lists to a plain `.md` file, and leaves out tables, images, exact fonts and page layout. Headings are inferred from how the text looks, so check the result against the original.

Markdown is where a lot of writing lives now: README files, wikis, static sites, note-taking apps and the text you paste into chat tools. A PDF is not a good starting point for any of those, because its text carries no structure. Converting to Markdown recovers the structure it can, so the result still has shape when it lands in a notes app or a commit. This guide explains how it works and where it falls short.

## How a PDF stores text, and why that matters

A PDF records glyphs at coordinates on a page. It does not record "this is a heading" or "these three lines are a list". So any converter has to infer structure from how things look: how large the text is, whether it is bold and how lines are indented.

[PDF to Markdown](/pdf-to-markdown) infers an outline and writes it as Markdown. It is the same inferred outline that [PDF to Word](/pdf-to-word) uses, written out differently, not a second analysis.

## What comes across

- Paragraphs
- Headings, as `#`, `##` and `###`
- Bold and italic text
- Bulleted and numbered lists

The output is plain CommonMark, the dialect that static-site generators, README renderers and chat tools read.

## What does not come across

- Tables
- Images
- Exact fonts and colors
- Precise page layout

If tables matter, use [PDF to Excel](/pdf-to-excel) or [Extract tables](/extract-tables-from-pdf) instead.

## How to convert with LeafLock

The text is read and the Markdown file built in your browser, on your device.

1. Open [PDF to Markdown](/pdf-to-markdown) and choose your file.
2. Convert.
3. Read the result and any warnings, then download the .md file.

## Columns

Text in two columns is stored as two blocks side by side, with nothing in the file saying they are columns. Read straight down, lines of the left column get interleaved with the right. The tool looks for the gutter between columns and tells you which pages have one, instead of quietly handing you shuffled text. When you see that warning, check those pages and fix the order by hand.

## How headings are decided

Headings are found by size, measured against the rest of the document. The size that covers the most text is treated as body copy, and meaningfully larger text becomes a heading. That means a document set in 10 pt and one set in 14 pt both convert sensibly. Headings in the same size as the body, only bold, may not be detected; promote them by hand.

## Scanned PDFs

A scan is a picture of a page, so there is no text to convert and nothing comes out. Run [OCR PDF](/ocr-pdf) first, which adds a text layer, then convert the OCR result. See [how to turn a scanned PDF into searchable text](/guides/scanned-pdf-to-searchable-text).

## When PDF to Text is enough

[PDF to Text](/pdf-to-text) gives you the words. Markdown also gives you the structure those words had. If you only want to search or count words, plain text is simpler. If the result will live in a notes app, a wiki or a repository, Markdown saves you retyping the headings and lists. See [how to extract text from a PDF](/guides/how-to-extract-text-from-a-pdf).

## Cleaning up after conversion

1. Skim the result in a Markdown preview.
2. Fix hyphenated words split across lines.
3. Re-insert tables and images by hand.
4. Check that numbered lists restart where they should.

## Summary

1. A PDF has no structure; headings and lists are inferred.
2. You get CommonMark with headings, bold, italic and lists.
3. Tables, images and layout are not carried over.
4. Scans need OCR first.
