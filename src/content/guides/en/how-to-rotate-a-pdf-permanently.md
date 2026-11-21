---
title: How to rotate a PDF and save it that way
description: Turn sideways or upside-down PDF pages the right way up, one page or all of them, and save the rotation so it holds in every reader.
published: 2026-11-22
tools: [rotate]
---

Rotating a page in your PDF reader is easy. Keeping it rotated is the part that trips people up: you close the file, reopen it and the pages are sideways again, or the person you sent it to sees them the wrong way up. This guide explains the difference and how to save the rotation properly.

## View rotation versus saved rotation

Most readers have a **rotate view** button. It turns what you see, for you, in that session. It usually does not change the file, so the next person who opens it sees the original orientation.

To fix the file itself, the rotation has to be written into the PDF. Each PDF page carries an orientation setting, and saving a new rotation changes that setting. [Rotate PDF](/rotate-pdf) does exactly that, and the downloaded file opens the right way up in any reader.

## How to rotate a PDF with LeafLock

The rotation is applied in your browser, so the PDF is not uploaded.

1. Open [Rotate PDF](/rotate-pdf) and choose your file.
2. Turn single pages with the buttons under each thumbnail, or use **Rotate all left** or **Rotate all right** to turn every page at once.
3. Check the thumbnails: every page should now read upright.
4. Save and download the new PDF.

## Why pages only turn in quarter turns

PDF pages support rotation in steps of 90 degrees: right, upside down, left. There is no setting for 15 or 30 degrees. If a scan is slightly crooked, rotating will not fix it. The scan itself is tilted and needs straightening in an image tool before it goes into the PDF, or you can rescan the page flat.

## Rotating only some pages

A mixed document is common. Landscape tables inside a portrait report, or one sheet fed the wrong way round in a scan. Use the per-page buttons for those, and leave the rest alone. If half the pages are sideways, rotate them all first, then turn the few that were right back.

## Does it reduce quality?

No. Rotation changes each page's orientation setting only. The text and images are not re-drawn or re-compressed, so text stays selectable and images keep their quality. That is also why it is fast, even on large files.

## When rotation does not look right

- **A page looks fine in one reader and sideways in another.** Some PDFs store both a page size and a rotation, and a tool that ignores one produces the wrong picture. Save the corrected file here, then open it in a second reader to check.
- **The text is upright but the scan looks like it is on its side.** The page may already be rotated in the file, with the scan stored sideways. Rotate it back, then check the result.
- **You need a combination of rotating and reordering.** Use [Organize PDF](/organize-pdf), which does both in one view.

## A scan workflow that works

1. Scan at a normal resolution and load all pages in one file.
2. Rotate any sideways pages here.
3. If you need the text to be searchable, run [OCR PDF](/ocr-pdf) afterwards, so recognition works on upright pages. See [scanned PDF to searchable text](/guides/scanned-pdf-to-searchable-text).
4. Compress if the file is large, with [Compress PDF](/compress-pdf).

Doing the rotation before OCR matters, because recognition on sideways pages gives poor results.

## Works on a phone

It works in a modern browser on phones, tablets and computers, with nothing to install. That is handy for a photo-scanned document you just took on your phone.

## Summary

1. A reader's rotate-view button does not change the file; saving the rotation does.
2. Pages turn in quarter turns only.
3. Rotation does not reduce quality.
4. Rotate before OCR, not after.
