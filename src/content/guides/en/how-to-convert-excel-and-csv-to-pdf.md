---
title: How to convert Excel and CSV files to PDF
description: Turn a spreadsheet or comma-separated file into a PDF grid on your device, what the result looks like and how to handle wide sheets.
published: 2026-11-22
tools: [excelToPdf, csvToPdf]
updated: 2026-11-23
---

**Short answer:** [Excel to PDF](/excel-to-pdf) and [CSV to PDF](/csv-to-pdf) draw your data as a plain bordered table: each Excel sheet gets its own page or pages, and a CSV gets one row per line. Colors, fonts, column widths, conditional formatting and charts are not reproduced, and formulas appear as their calculated values.

Sending a spreadsheet as a PDF freezes the numbers: nobody can change a cell, and everyone sees the same thing. That is why finance teams, schools and small businesses convert price lists, schedules and statements before sending them. This guide covers converting an Excel workbook or a CSV file to PDF on your own device, and the limits to know about before you rely on the result.

## What the PDF looks like

Both tools draw a plain bordered grid in one typeface. They build the PDF fresh; they do not copy the look of the spreadsheet program.

- **[Excel to PDF](/excel-to-pdf)** turns every sheet in the workbook into its own page or pages, named by the sheet name.
- **[CSV to PDF](/csv-to-pdf)** draws one row per line of the file.

Because the layout is built from the data, what you get is a clean table, not a styled report.

## What does not come across

For Excel files, the following are not reproduced:

- Cell colors and fonts
- Column widths
- Conditional formatting
- Charts
- Formulas

Formulas are replaced by their calculated value, shown as plain text. That is the same as a printed spreadsheet, which shows the number and not the formula behind it. If your recipient needs to see how a figure was calculated, send the workbook, or add a column that explains it.

## How to convert with LeafLock

Both conversions run in your browser, so the file is never uploaded. That matters for payroll, invoices, customer lists and other figures you would rather keep off a server.

1. Open [Excel to PDF](/excel-to-pdf) or [CSV to PDF](/csv-to-pdf).
2. Choose your file.
3. Convert and download the PDF.
4. Open it and compare the first few rows against the original.

## Wide sheets

Every column gets an equal share of the page width. A sheet with many columns therefore ends up with narrow columns and more wrapped lines per row, rather than text running off the page. This keeps everything on the page, but a very wide sheet can become hard to read. It is the case most worth checking against the original.

Ways to improve a wide sheet before converting:

- Delete columns the reader does not need.
- Split the sheet into two, one for each group of columns.
- Shorten long text in cells.

## CSV delimiter: commas only

The CSV tool expects a comma between columns. A file exported with semicolons or tabs, which is common in some regions and from some programs, will not split into columns correctly. Open it in a spreadsheet program and save it again as comma-separated CSV, then convert.

## Which one should I choose?

- You have an **.xlsx workbook** with several sheets: use Excel to PDF, and each sheet becomes its own section.
- You have a **.csv export** from a database, accounting package or form tool: use CSV to PDF.
- You have a **PDF** and want the data back in a spreadsheet: that is the reverse job, covered in [how to convert a PDF to Excel](/guides/how-to-convert-a-pdf-to-excel).

## Checking before you send

1. Check the number of rows against the source, especially the last one.
2. Check that leading zeros, dates and long numbers look right. They are drawn as the text the file holds.
3. For anything with a total, compare it with the original.
4. Add page numbers if the table runs to several pages: [Add page numbers](/add-page-numbers).

## When to use your spreadsheet program instead

If you need colors, column widths, headers repeated on every page or a chart, use the spreadsheet program's own Save as PDF. It reproduces the formatting because it has it. Use LeafLock when the data is the point, and a plain grid is enough, or when you would rather not upload the file.

## Summary

1. Excel gives one section per sheet; CSV gives one grid.
2. Formulas become values; colors, charts and widths are not carried over.
3. Wide files get narrow columns; check them.
4. CSV needs commas, not semicolons or tabs.
