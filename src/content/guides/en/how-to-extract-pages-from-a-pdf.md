---
title: How to extract pages from a PDF
description: Copy only the pages you need into a new PDF, or save each page as its own file, without re-rendering anything or touching the original.
published: 2026-11-22
tools: [extractPages]
---

Sometimes a PDF is a haystack and you only need a few needles: the three pages of a report that matter to a colleague, the signature page of a contract, one chapter of a manual. Extracting copies exactly those pages into a new file. This guide covers how, what stays the same, and what to do when you want a different order.

## Extract or delete: which is quicker?

Both end in a smaller PDF. The difference is which list is shorter.

- If you want **a few pages out of many**, extract them. You name the pages you want to keep.
- If you want **most of the document minus a few pages**, use [Remove pages](/remove-pages) instead and name the ones to drop.

Picking the shorter list means fewer typos and an easier check at the end.

## How to extract pages with LeafLock

Copying the pages happens in your browser, and the document is not uploaded.

1. Open [Extract pages](/extract-pages) and choose your PDF.
2. Choose the pages by clicking thumbnails or typing numbers and ranges, such as `2-4, 9`.
3. Under **Save as**, choose whether you want one PDF containing those pages or one PDF per page.
4. Select **Extract pages** and download the result.

If you choose one PDF per page, you can download the files one by one or all together as a ZIP.

## The order is the original order

Extracted pages keep the order they have in the original. If you type `9, 2` you still get page 2 before page 9. To put them in another order, run the result through [Organize PDF](/organize-pdf), where you can drag pages, move them with the arrow buttons or rotate them.

## One file or many?

- **One PDF** is right when the pages belong together, such as the pages of a section you are sending as a single attachment.
- **One PDF per page** is right when each page is its own item: pages of a stack of receipts, test sheets for different people, or ID pages. It gives you separate files without having to type a range for every page.

If your parts are different lengths and you want several files out of one run, [Split PDF](/split-pdf) with page ranges is a better fit.

## What stays the same and what doesn't

Pages are copied as they are, not turned into images, so text stays sharp and selectable and the quality doesn't change. The original is complete afterwards; extracting never edits it.

What copying pages cannot carry across is anything that depends on the rest of the document: bookmarks, internal links that point to other pages, and form fields that belong to the whole file. If a link on an extracted page pointed to a page you did not extract, it has nowhere to go.

## Typical jobs

- **Send one chapter, not the whole book.** Extract the chapter's range.
- **Pull the signature page out for signing.** Extract that page, then use [Sign PDF](/sign-pdf) on it. See [how to sign a PDF without printing](/guides/how-to-sign-a-pdf-without-printing).
- **Share a table without the commentary around it.** Extract the pages with the table, then check the surrounding text did not carry anything private.
- **Make a smaller file for email.** Extract the needed pages, then [compress](/guides/compress-pdf-for-email) if it is still too big.

## Check the result

Open the new file and check the page count and the first and last page. If you extracted a range from a long document, scan through quickly to confirm it starts and ends where you meant. Rename the file to say what it is; a name that includes the section or date saves confusion later.

## Limits

There is no fixed file size limit. Very large files depend on how much memory your device has, since everything is processed there. If a huge file struggles, extract a smaller range first.

## Summary

1. Extract when you want few pages; remove when you want to drop few.
2. Choose one combined PDF or one PDF per page.
3. Pages keep their original order. Reorder with Organize PDF.
4. Pages are copied, not re-rendered, so quality holds, but cross-page links and bookmarks do not come along.
