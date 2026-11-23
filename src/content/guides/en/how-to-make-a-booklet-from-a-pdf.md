---
title: How to make a printable booklet from a PDF
description: Reorder a PDF so that printing double-sided and folding gives a stapled booklet that reads in the right order, with the printer settings that matter.
published: 2026-11-22
tools: [booklet]
updated: 2026-11-23
---

**Short answer:** [Booklet PDF](/booklet-pdf) rearranges your pages so that, printed double-sided and folded, they read in order. Print double-sided flipping on the short edge, with scaling at none or 100%, then fold and staple.

A folded booklet is the cheapest way to turn a PDF into something you can hand to people: a programme, a manual, a zine, a short report. It only works if the pages are arranged in the order a folded stack needs, which is not the order a reader sees. This guide explains what that order is, how to print it and why the file looks wrong on screen.

## What a booklet needs

Take four sheets of paper, stack them and fold the stack in half. You now have 16 pages. The first sheet carries the last page and the first page on one side, and the second page and the second-to-last on the other. Each sheet has two pages per side, arranged so that when the stack is folded and stapled on the spine, the pages read 1, 2, 3 and onward.

You can work that out by hand, but it is easy to get wrong. [Booklet PDF](/booklet-pdf) does the arrangement for you, putting two pages side by side on each side of each sheet in exactly that order.

## How to make a booklet with LeafLock

The booklet is built in your browser, and the file never leaves your device.

1. Open [Booklet PDF](/booklet-pdf) and choose your document.
2. Pick the sheet size you will print on, build the booklet and download the new file.
3. Print it double-sided, flipping on the short edge, with scaling set to none or 100%.
4. Stack the printed sheets in order, fold them in half and staple on the fold.

## The printer settings that matter

- **Double-sided, flip on the short edge.** Most print dialogs call this "flip on short edge" or sometimes "booklet". If your printer flips on the long edge, every other sheet comes out upside down.
- **Scale: none or 100%.** Do not choose "fit to page". The sheets are already laid out to fill the paper, and scaling shrinks them.
- **Sheet size:** pick the sheet you will print on in the tool before you build the file: A4 landscape (two A5 pages), US Letter landscape or A3 landscape (two A4 pages). Each page is scaled to fit its half of the sheet.

Print one test sheet, both sides, and fold it to check before printing the whole run.

## Why blank pages were added

A folded sheet always carries four pages, so the total must be a multiple of four. If your document has 10 pages, two blank pages are added to reach 12. They go at the end of the finished booklet, where a reader expects a blank back page. If you would rather have something useful there, such as notes or contact details, add a final page to the PDF first so the count fills up.

## Why it looks wrong on screen

Open the booklet in a PDF reader and the first sheet shows the last page next to the first. That is correct. The file is in the printer's order, not the reader's. It reads properly once printed and folded, so do not try to read it on screen.

## Links and forms do not survive

Each page is drawn onto the sheet as artwork, so links, comments and fillable fields are left behind. A booklet is made to be printed. Keep the original for reading on screen.

## Preparing the source document

Before building the booklet:

1. **Match the sheet to your printer.** An A4 document on A4 landscape sheets is shrunk to A5 pages, which suits most home printers. Keeping full A4 pages needs A3 sheets, which most home printers cannot print.
2. **Mind the margins.** Text close to the fold gets harder to read. [Crop](/crop-pdf) or re-export with wider inner margins if needed.
3. **Number the pages**, with [Add page numbers](/add-page-numbers), before building. Doing it afterwards numbers the sheets rather than the pages.

## When you only want to save paper

If you do not need a fold-and-staple booklet, but simply want several pages per sheet, use [Multiple pages per sheet](/multiple-pages-per-sheet) instead; see [how to print multiple PDF pages on one sheet](/guides/how-to-print-multiple-pdf-pages-per-sheet).

## Summary

1. A booklet needs a special page order: first and last pages share a sheet.
2. Print double-sided, flip on the short edge, scale 100%.
3. The page count is padded to a multiple of four with blank pages at the end.
4. The file reads wrongly on screen by design; it is for printing.
