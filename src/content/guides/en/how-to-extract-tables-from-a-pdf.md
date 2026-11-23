---
title: How to extract tables from a PDF as CSV or Excel
description: Pull only the tables out of a PDF as CSV files or Excel sheets, skipping pages without one, and how to handle tables that run across pages.
published: 2026-11-22
tools: [extractTables]
updated: 2026-11-23
---

**Short answer:** [Extract tables](/extract-tables-from-pdf) finds tables by looking for vertical bands of blank space, keeps only the pages where one was found and gives you CSV or Excel. That is a guess from alignment, so check the result, and use [PDF to Excel](/pdf-to-excel) if you want every page.

If you only want the data from a PDF, not the commentary around it, converting the whole document gives you a lot to throw away. Extracting tables keeps the pages where a table was actually found and skips everything else. This guide explains how it differs from a full conversion, how tables are located and what to do with tables that continue over several pages.

## Extract tables or convert to Excel?

[PDF to Excel](/pdf-to-excel) keeps every page, prose included, one sheet each, so nothing from the document goes missing. [Extract tables](/extract-tables-from-pdf) keeps only the pages where a table was found and skips the rest entirely.

- Use **PDF to Excel** when you want everything and plan to decide what to keep.
- Use **Extract tables** when you want just the data, such as a statement's transactions or a price list, without cover pages and notes.

For a walkthrough of the full conversion, see [how to convert a PDF table to Excel](/guides/how-to-convert-a-pdf-to-excel).

## How tables are found

A PDF never records "this is a table", only text at coordinates. Extraction therefore looks for vertical bands of blank space that run down the whole page and treats them as column gaps. It is the same method PDF to Excel uses, and equally an educated guess based on alignment.

## How to extract tables with LeafLock

Extract tables works in your browser, so the PDF is not uploaded.

1. Open [Extract tables](/extract-tables-from-pdf) and choose your PDF.
2. Choose the output: **CSV** or **Excel**.
3. Run it, then download the files.
4. Open the result and compare it to the pages.

## CSV or Excel?

- **CSV** is the plainer choice when the data is headed into a script, a database import or another system.
- **Excel** is the one to open and check by eye, with each page's table on its own sheet.

Pick whichever the next step needs. You can run the tool again for the other format.

## Tables that span several pages

Each page becomes its own file (CSV) or sheet (Excel), in page order. They are not merged into one table. Telling where a continued table's repeated header ends and its data resumes is exactly the kind of guess this tool avoids making for you. Merging is quick to do by hand once you can see the pages: delete the repeated header rows and paste the sheets together.

## When no table is found

The tool says so rather than guessing. Check that the PDF really has a column layout. If it is a scan with no text layer, run [OCR PDF](/ocr-pdf) first; see [how to turn a scanned PDF into searchable text](/guides/scanned-pdf-to-searchable-text).

## Checking the output

1. Compare the row count on each sheet to the page.
2. Look for a column that has merged with its neighbor, or one split into two.
3. Check totals against the PDF.
4. Look at numbers: everything is text until you convert it in your spreadsheet.

## Limits to remember

Merged cells, formulas and formatting do not come across. Tables whose columns are very close together, or that rely on lines rather than spacing, are the most likely to need a manual fix.

## Related

- [PDF to Text](/pdf-to-text) for just the words.
- [Compare PDF](/compare-pdf) to check two versions of a statement for differences.
- [Remove pages](/remove-pages) if you want to prune the PDF before extracting.

## Summary

1. Only pages with a table are kept; the rest are skipped.
2. Tables are found by column gaps, which is a guess.
3. Choose CSV for systems, Excel for checking.
4. Multi-page tables are not merged for you.
