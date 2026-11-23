---
title: How to set roman numerals and custom page labels in a PDF
description: Make your PDF reader show i, ii, iii for a preface and 1, 2, 3 for the body, or prefixes like A-1, without touching what is printed on the page.
published: 2026-11-22
tools: [pageLabels]
updated: 2026-11-23
---

**Short answer:** [Add page labels](/add-page-labels) sets the number a PDF reader shows for each page, such as roman numerals (i, ii, iii) for a preface and 1 onward for the body. It changes only what the reader displays, not what is printed on the page; [Add page numbers](/add-page-numbers) does that.

Open a book-length PDF and you will often see two numbers that disagree: the reader says page 9 of 120, while the page itself says "1". The first is the physical page position; the second is the printed number. Page labels let you make the reader show the same number the page prints, so "go to page 1" takes you to the page marked 1. This guide explains what labels are and how to set them.

## What a page label is

A label is the name a PDF reader shows for a page in its page box, thumbnail strip and "go to page" dialog. It is stored in the file separately from the page's content. Changing it does not alter what is drawn on the page.

That makes it different from [Add page numbers](/add-page-numbers), which draws visible text onto the page. Labels only change what the reader's interface says. Many PDFs use both: a printed "i" on the preface and a reader that also says "i" because labels were set.

## A typical case: front matter and body

The common need is a preface with roman numerals, followed by a body starting again at 1.

1. Add a range starting at page 1 with **roman numerals** (i, ii, iii).
2. Add a second range starting where the body begins, with **decimal numbers restarting at 1**.

Now the reader shows i to iv for the front matter and 1 onward for the body, matching what is printed.

## How to set labels with LeafLock

The label is written into the PDF by your browser on your device. The document is not uploaded.

1. Open [Add page labels](/add-page-labels) and choose your PDF.
2. Add a range for each section: the first page it applies to, the style and the number it starts from.
3. Add a prefix if you want one.
4. Save and download.

## Styles available

Typical styles are decimal numbers, upper and lower case roman numerals and upper and lower case letters. Choose per range, so a preface, a body and appendices can each use their own.

## Using a prefix

A prefix comes before the number on every page in the range. With the prefix `A-` and decimal numbering, an appendix reads A-1, A-2, A-3. This suits legal exhibits, technical manuals with chapters and appendices.

## Does every reader show them?

Most desktop and browser PDF readers show labels in the page-number box and the thumbnail panel. A reader that does not support them falls back to counting 1, 2, 3 as normal, so nothing breaks; you only lose the custom names.

## What labels do not do

- They do not print anything. If you need numbers on the paper, use [Add page numbers](/add-page-numbers).
- They do not change page order. Reorder with [Organize PDF](/organize-pdf) first.
- They do not renumber existing printed numbers. If the printed number is wrong, redraw it with page numbers.

## Order of operations

1. Finish merging, deleting and reordering.
2. Add printed page numbers if you want them.
3. Set labels so the reader matches the printed numbers.
4. Check it in two readers.

## Check the result

Open the file, look at the thumbnail strip and try "go to page" with a label such as `iii`. Check the transition from front matter to body, which is where mistakes in the starting number show up.

## Summary

1. Labels change what the reader shows, not what is printed.
2. Use ranges for roman-numeral front matter and a restarted body.
3. Add prefixes for appendices.
4. Readers without support just show 1, 2, 3.
