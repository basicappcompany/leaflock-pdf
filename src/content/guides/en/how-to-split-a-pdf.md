---
title: How to split a PDF into separate files
description: Three ways to split a PDF, by page range, by a fixed number of pages or one file per page, and how to pick the right one for the job.
published: 2026-11-22
tools: [split]
updated: 2026-11-23
---

**Short answer:** [Split PDF](/split-pdf) has three modes: by page ranges such as `1-4, 5-20, 21-30` (each range becomes one file), into files of a set number of pages, and one file per page. Pick the mode by how your pages are grouped.

A single PDF is often several documents stuck together: a scanned stack of invoices, a report with one chapter per recipient, a contract bundle with exhibits. Splitting it gives each part its own file, so you can send, file or print them separately. This guide covers the three ways to split, when each one fits and what to check afterwards.

## Pick the split that matches your document

[Split PDF](/split-pdf) offers three modes. The right one depends on how the pages are grouped.

- **By page ranges.** You type the ranges and each range becomes one file. Use this when the parts are different lengths, such as pages 1-4 for the cover letter, 5-20 for the report and 21-30 for the appendix.
- **Into files of a set number of pages.** Use this when every part is the same length, for example a scan where each statement is three pages.
- **One file per page.** Use this for a stack of single-page items, such as receipts or ID pages, that were scanned together.

If you're not sure where the boundaries are, open the PDF in your reader first and write down the first and last page of each part. Two minutes of notes saves a re-run.

## How to split a PDF with LeafLock

The PDF is processed in your browser, so it is not uploaded.

1. Open [Split PDF](/split-pdf) and choose your file.
2. Pick one of the three modes.
3. For page ranges, type them with commas between them, for example `1-4, 5-20, 21-30`. Each range becomes one file.
4. Select **Split PDF**.
5. Download the files one at a time, or select **Download all as ZIP** when the split made more than one file.

## Ranges can overlap

Ranges don't have to be separate. A page can appear in more than one of the new files, so `1-5, 5-9` gives two files that both contain page 5. That helps when a page belongs to two sections, such as a signature page shared by two agreements.

## What splitting keeps and what it changes

The pages are copied into the new PDFs without being turned into images, so text stays sharp and selectable, and nothing loses quality. Your original file isn't touched; you always get new files in addition to it.

One thing to know: copying pages into a new document can't carry everything over. Bookmarks, form fields and internal links that point to pages in a different part of the original don't survive the copy, because the page they pointed to may not exist in the new file. If the original relies on a table of contents of clickable links, expect the pieces to lose them.

## Naming and organising the results

Split files get numbered names based on the original. Rename them straight away to something that says what they are, for example `invoice-march.pdf`, because "document-part-3" is meaningless a month later. If you will send them to different people, check each file's first page before attaching it, so the wrong part does not go to the wrong recipient.

## When another tool is a better fit

- You only want a few pages from a long document, and don't need the rest as files: [Extract pages](/extract-pages) is quicker.
- You want to drop pages and keep everything else in one file: [Remove pages](/remove-pages).
- You want to put the pieces back together later, in a different order: [Merge PDF](/merge-pdf) or [Organize PDF](/organize-pdf).
- The pieces are still too large to email: [Compress PDF](/compress-pdf), or read [how to compress a PDF for email](/guides/compress-pdf-for-email).

## Size limits

There is no fixed size limit. The practical limit is your device's memory, because the whole document is processed there. For a very large file, split into ranges rather than into many single pages, which produces the most output at once.

## Summary

1. Choose ranges for uneven parts, a set page count for equal parts, one file per page for stacks of single items.
2. Ranges may overlap, so a page can sit in more than one file.
3. Pages are copied, not re-rendered, so quality doesn't drop, but links and bookmarks between parts are not carried over.
4. Rename and check each file before you send it.

Related: [How to merge PDFs without uploading them](/guides/merge-pdf-without-uploading).
