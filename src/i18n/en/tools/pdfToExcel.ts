import type { PluralForms } from '../../format';

export default {
  title: 'PDF to Excel',
  metaTitle: 'Convert PDF to Excel without uploading | LeafLock PDF',
  metaDescription:
    'Turn a PDF table or price list into an editable spreadsheet. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a PDF table into an editable spreadsheet, on your device.',
  howTo: [
    'Choose a PDF with a table or tabular data.',
    'Select Convert to Excel.',
    'Download the .xlsx and check the columns landed where you expect.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded to convert it?',
      a: 'No. The text is read and the spreadsheet is built in your browser on your device, so a price list or a statement of account never leaves it.',
    },
    {
      q: 'How does it find the columns?',
      a: 'The same way Adobe’s own PDF-to-spreadsheet export does for a PDF with no tagged table: it looks for vertical bands of blank space that run all the way down the page. A PDF never records “this is a table” — only text at coordinates — so this is an educated guess based on alignment, not a read of real structure.',
    },
    {
      q: 'Why is everything in one column?',
      a: 'No consistent gap was found running down the page, so the tool could not tell where one column ends and the next begins — most often because the PDF is prose rather than a table, or the columns are too close together or too irregular to show a clear gap. Each page still becomes a sheet, with one row of text per line, so nothing is silently dropped.',
    },
    {
      q: 'One page split into columns oddly. What happened?',
      a: 'Tables with merged cells, multi-line entries, or a layout that leans on alignment rather than whitespace can produce an extra or a missing column break. Check the sheet for that page against the PDF — this is the one place an inferred layout is most likely to need a manual fix.',
    },
    {
      q: 'Why does each page get its own sheet?',
      a: 'Because a column gap on one page is not guaranteed to line up with the same table on the next — fonts, column widths and even tables can change page to page. Keeping pages separate keeps each sheet’s columns consistent with what was actually found on that page.',
    },
    {
      q: 'The PDF is a scan and nothing came out. Why?',
      a: 'A scan is a picture of a page, so there is no text in it to convert. Run OCR PDF over it first to add a text layer, then convert the result.',
    },
    {
      q: 'What about formulas, formatting or merged cells?',
      a: 'None of those come across. Every cell is written as plain text, exactly as it reads in the PDF.',
    },
  ],
  reading: 'Reading page {number} of {count}…',
  action: 'Convert to Excel',
  outputSuffix: 'converted',
  sheetsDone: { one: '{count} sheet.', other: '{count} sheets.' } as PluralForms,
  tablesFound: {
    one: 'A column layout was found on page {pages}.',
    other: 'A column layout was found on pages {pages}.',
  } as PluralForms,
  noTablesFound: 'No column layout was found on any page, so every sheet has one wide column.',
  errors: {
    'no-text': 'No text could be read from this PDF. If it is a scan, run OCR PDF over it first.',
  },
};
