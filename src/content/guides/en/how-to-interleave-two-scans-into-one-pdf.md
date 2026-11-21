---
title: How to combine a front-side and back-side scan into one PDF
description: Rejoin a document scanned in two passes by weaving fronts and backs together page by page, even when the backs came out in reverse order.
published: 2026-11-22
tools: [mixPages]
---

If your scanner can only scan one side of a sheet at a time, scanning a double-sided document means two passes: first all the fronts, then you flip the stack and scan all the backs. You end up with two PDFs, and neither reads properly on its own. Mixing them weaves the pages back into the right order. This guide explains how to do it and why the backs usually arrive in reverse.

## The problem in plain terms

Say you have a ten-sheet document. The first PDF has the fronts, pages 1, 3, 5, 7 and so on. The second PDF has the backs, pages 2, 4, 6, 8 and so on. What you want is a single PDF that reads 1, 2, 3, 4, and so on. Joining the files end to end, as [Merge PDF](/merge-pdf) does, gives you all the fronts then all the backs. You need them alternating.

[Mix pages](/mix-pdf-pages) does that: it takes a page from the first file, then a page from the second, and repeats.

## Why the backs are in reverse

When you flip the whole stack over to scan the other sides, the last sheet is now on top. The scanner reads it first. So the second PDF holds the backs from the last sheet to the first.

That is the normal case, so the tool has an option for it: **the second PDF is in reverse order**, on by default. Leave it on and the backs are matched up correctly with their fronts. Turn it off only if you fed the backs in the same order as the fronts, for example by flipping each sheet individually.

## How to mix two scans with LeafLock

Both files are read in your browser and the combined PDF is built on your device, so contracts, records and statements do not leave it.

1. Open [Mix pages](/mix-pdf-pages).
2. Choose the PDF of the fronts first, then the PDF of the backs.
3. Check the reverse-order option matches how you scanned.
4. Select the mix button and download the result.
5. Scroll through the new file to confirm each back follows its front.

## When the two files have different page counts

Nothing is dropped. Pages alternate until one file runs out, and the remaining pages of the longer file follow at the end. If the counts differ when you expected them to match, you probably skipped a blank back or double-fed a sheet. Fix the source scan, then mix again.

## Blank backs

If some backs are blank and your scanner skipped them, the counts will not line up. Either rescan including the blanks, or mix, then delete the unwanted blank pages with [Remove pages](/remove-pages). It is usually easier to scan every back and delete blanks afterwards than to try to realign the files.

## Taking more than one page at a time

You can raise the pages-at-a-time setting to take two or more pages from each file before switching. That is useful when the document was scanned two sheets at a time, or when you are interleaving chapters rather than single pages. For a standard double-sided scan, leave it at one.

## How this differs from merging

[Merge PDF](/merge-pdf) puts one document after the other. Mix pages weaves two documents together page by page. If you are not sure which you need, ask: should the result alternate between the files? If so, mix.

## After mixing

1. Check the order on the first few and last few pages.
2. If any page is sideways, fix it with [Rotate PDF](/rotate-pdf).
3. To make the text searchable, run [OCR PDF](/ocr-pdf); see [scanned PDF to searchable text](/guides/scanned-pdf-to-searchable-text).
4. If the file is large, [compress it](/compress-pdf).

## Summary

1. Two scans of fronts and backs need weaving, not joining.
2. Backs scanned after flipping the stack come out in reverse; the default setting handles that.
3. Unequal counts are kept: nothing is dropped.
4. Check the order, then OCR and compress if needed.
