---
title: How to convert a PDF table to Excel
description: Turn a PDF price list or statement into an editable spreadsheet on your device, how columns are found and what to check when they come out wrong.
published: 2026-11-22
tools: [pdfToExcel]
---

Price lists, bank statements, timetables and reports often arrive as PDFs, and then somebody retypes them into a spreadsheet. Converting directly saves hours, but only if you know what the conversion is doing, because tables are the hardest thing to recover from a PDF. This guide explains how it works, how to check the result and what to do when columns land in the wrong place.

## Why tables are hard

A PDF never records "this is a table". It records text at coordinates. Rows and columns are only visible because the text is aligned. A converter has to guess where one column ends and the next begins.

[PDF to Excel](/pdf-to-excel) guesses the way Adobe's own export does for a PDF with no tagged table: it looks for vertical bands of blank space that run all the way down the page. Those gaps are treated as column boundaries. It is an educated guess based on alignment, not a read of real structure.

## How to convert with LeafLock

The text is read and the spreadsheet built in your browser, on your device. A price list or a statement of account never leaves it.

1. Open [PDF to Excel](/pdf-to-excel) and choose your PDF.
2. Convert.
3. Open the downloaded workbook and compare each sheet to the matching page.

## One sheet per page

Each PDF page becomes its own sheet. A column gap on one page is not guaranteed to line up with the same table on the next, because fonts, column widths and even the tables themselves change between pages. Keeping pages separate keeps each sheet's columns consistent with what was found on that page. If you want one long table, copy the sheets into one yourself after checking them.

## Everything lands in one column

If no consistent gap runs down the page, the tool cannot tell where columns end. That happens most often when the page is prose rather than a table, or the columns are too close together or irregular. Each page still becomes a sheet, with one row of text per line, so nothing is silently dropped. If you only wanted the tables, [Extract tables](/extract-tables-from-pdf) skips pages without one.

## One page split oddly

Tables with merged cells, entries that wrap onto several lines or layouts that rely on alignment rather than whitespace can produce an extra or a missing column break. Check that page's sheet against the PDF. It is the place where an inferred layout is most likely to need a manual fix.

## What does not come across

Formulas, formatting and merged cells. Every cell is written as plain text, exactly as it reads in the PDF. Numbers may therefore need converting to number cells in Excel before you can sum them: select the column and use the number-conversion option in your spreadsheet program.

## Scanned PDFs

A scan is a picture, so nothing is found. Run [OCR PDF](/ocr-pdf) first to add a text layer, then convert. Accuracy depends on scan quality, so check every figure that matters.

## Checking a conversion properly

1. Compare row counts per page.
2. Compare the totals with the printed ones.
3. Look at the first and last column on each sheet for shifted data.
4. Check dates and long numbers for stray spaces.

## Other routes

- If you want just the table data in a plainer form, [Extract tables](/extract-tables-from-pdf) offers CSV or Excel.
- If you want the words only: [PDF to Text](/pdf-to-text).
- To go the other way, see [how to convert Excel and CSV to PDF](/guides/how-to-convert-excel-and-csv-to-pdf).

## Summary

1. Column positions are guessed from vertical gaps.
2. Every page becomes a sheet; everything is plain text.
3. One-column output usually means prose or tight columns.
4. Always verify totals against the PDF.
