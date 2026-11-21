---
title: How to print multiple PDF pages on one sheet
description: Put 2, 4 or more PDF pages on each sheet to save paper, hand out slides or review a long document, with the layout fixed in the file itself.
published: 2026-11-22
tools: [nUp]
---

Printing a 60-page document one page per sheet uses 60 sheets. Put four pages on each and it is 15. Printing several pages on one sheet is called N-up printing, and it is the usual way to save paper, print slides as handouts or produce a compact review copy. This guide explains when to do it in the file rather than in the print dialog, and what the trade-offs are.

## Why make a file instead of using printer settings

Many printers and print dialogs offer a "pages per sheet" option, and when that is available, it is fine. Making the file with [Multiple pages per sheet](/multiple-pages-per-sheet) has some advantages:

- **The layout is fixed in the PDF.** It looks the same on any printer, so you do not depend on every printer's driver.
- **You can check it before printing.** Open the result and see exactly how it will come out.
- **You can send it to someone else to print.** They do not need to know which setting to choose.

## How to make an N-up PDF with LeafLock

The sheets are drawn in your browser, and the file never leaves your device.

1. Open [Multiple pages per sheet](/multiple-pages-per-sheet) and choose your PDF.
2. Choose how many pages go on each sheet, for example 2 or 4.
3. Select the button to build the new PDF and download it.
4. Open it and check a few sheets before printing.

## What happens to the pages

Each page is scaled to fit its cell while keeping its shape, and centered in it. Pages are not squashed or stretched. If one document mixes page sizes, each page is scaled to fit on its own, so you may see different amounts of white space around them.

## Sideways pages

A PDF stores a page's size and its rotation separately, which is how a page can look landscape without being drawn landscape. Some tools lose track of that and lay out those pages on their side. Here, a page that a viewer shows as landscape is laid out as landscape. If a page still looks wrong, [rotate it](/rotate-pdf) first, then build the sheet.

## The one real trade-off

Each page is drawn onto the sheet as artwork. That means links, comments and fillable form fields are left behind. Several pages now share one sheet, so a link's position would no longer point to the right place anyway.

For printing, that rarely matters. For reading on screen, keep the original. Treat the N-up file as a print copy.

## Making pages readable

Fitting more pages on a sheet makes each one smaller. As a rough guide:

- **2 per sheet** stays readable for ordinary documents.
- **4 per sheet** works for slides and large type; small print gets hard to read.
- **More than 4** is fine for skimming thumbnails or checking layout, not for reading.

Print one sheet first and read it at arm's length before running a whole job.

## Booklets are different

If you want to print double-sided and fold the stack into a booklet, the page order matters, and simply putting pages side by side is not enough. Use [Booklet PDF](/booklet-pdf) for that; see [how to make a printable booklet from a PDF](/guides/how-to-make-a-booklet-from-a-pdf).

## Related jobs

- **Trim wide margins first** so the pages use the cell better: [Crop PDF](/crop-pdf).
- **Take only some pages**: [Extract pages](/extract-pages), then N-up the result.
- **Number the printed pages**: add page numbers before laying them out, with [Add page numbers](/add-page-numbers).

## Summary

1. N-up puts several pages on each sheet to save paper.
2. Making the file fixes the layout for any printer and lets you preview it.
3. Pages keep their proportions and are centered; sideways pages stay sideways.
4. Links and form fields do not survive, so keep the original for screen use.
