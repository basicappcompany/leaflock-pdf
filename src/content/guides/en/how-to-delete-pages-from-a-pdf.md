---
title: How to delete pages from a PDF
description: Remove blank, duplicate or private pages from a PDF on your device, choose them by thumbnail or page number, and keep the rest exactly as it was.
published: 2026-11-22
tools: [removePages]
---

Most PDFs carry a few pages nobody needs: a blank back of a scanned sheet, a cover page with internal notes, a duplicate, or a page with details you would rather not share. Deleting them is simple, but a few details decide whether the result is what you wanted. This guide shows how to do it and what to check.

## Two ways to choose the pages

[Remove pages](/remove-pages) lets you choose in whichever way is quicker, and the two stay in sync.

- **Click the thumbnails.** Best for a short document where you can see which pages to drop, such as a blank page after a scan.
- **Type the page numbers.** Best for a long document or a pattern. You can mix single pages and ranges: `1-3, 5, 8-` means pages 1 to 3, page 5, and page 8 through to the end. A range with nothing after the dash runs to the last page.

If you type the numbers first, check the thumbnails afterwards. Seeing the highlighted pages is the easiest way to catch a typo, like `15` where you meant `5`.

## How to delete pages with LeafLock

The pages are removed in your browser, and the document is not uploaded.

1. Open [Remove pages](/remove-pages) and choose your PDF.
2. Select the pages by clicking thumbnails, typing page numbers or both.
3. Select **Remove pages**.
4. Download the new copy.

## Your original is not changed

You get a new file without the removed pages, and the original stays as it was. There is no undo inside the downloaded copy, so keep the original until you have checked the new one, especially if the pages came from a scan you cannot easily redo.

## You must keep at least one page

A PDF with no pages isn't a valid document, so at least one page has to stay. If you find yourself selecting almost everything, flip the job around: it is quicker to keep a few pages than to remove many, and [Extract pages](/extract-pages) is built for that.

## Do the remaining pages lose quality?

No. The remaining pages are copied unchanged. Text stays selectable and images keep their quality, because nothing is re-rendered or re-compressed.

## Deleting a page is not the same as redacting it

Taking a page out of a copy removes it from that copy. That is the right tool when a whole page should not be in the file. It is not the right tool when only a name or number on a page needs to go, because you would lose the rest of the page. For that, use [Redact PDF](/redact-pdf), and read [how to redact a PDF properly](/guides/redact-pdf-properly) to understand why black boxes alone are not enough.

Also remember where else the page might live. If you emailed the original earlier, or it sits in a shared folder, deleting pages from a new copy does nothing to those copies.

## Common jobs

- **Blank pages after scanning double-sided stacks.** Scan, then delete the blanks by thumbnail. If every second page is blank, type the pattern as ranges, or mix the two scans back properly with [Mix pages](/mix-pdf-pages).
- **A cover sheet or fax header.** Remove page 1.
- **Draft pages before sending a final.** Delete them, then check the page count against what you expect.
- **Pages with private details before a document goes to a third party.** Delete, then check the file's properties with [Remove metadata](/remove-metadata) if the author or title is also private.

## Check the result

Open the new file and scroll through it. Check the first and last page, check that the page count is what you expected, and if the document had page numbers printed on the pages, remember that they will now skip. If that matters, add fresh ones with [Add page numbers](/add-page-numbers).

## Works on a phone

It runs in any modern browser on a phone, tablet or computer, with no app and no account.

## Summary

1. Click thumbnails, or type ranges such as `1-3, 5, 8-`.
2. The original is untouched; you download a new copy.
3. At least one page must remain.
4. Deleting a page is not redaction, and it does not affect copies you already shared.
