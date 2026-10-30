import type { PluralForms } from '../../format';

export default {
  title: 'Excel to PDF',
  metaTitle: 'Convert Excel (.xlsx) to PDF privately, in your browser | LeafLock PDF',
  metaDescription:
    'Turn a spreadsheet into a PDF, one sheet per page, as a plain bordered grid. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a spreadsheet into a PDF, on your device.',
  howTo: ['Choose a .xlsx file.', 'Select Convert to PDF.', 'Download the PDF.'],
  faq: [
    {
      q: 'Is my spreadsheet uploaded to convert it?',
      a: 'No. It is read and the PDF is built in your browser on your device, so figures that matter stay off any server.',
    },
    {
      q: 'What does the PDF look like?',
      a: 'Every sheet becomes its own page or pages, named by the sheet name, drawn as a plain bordered grid in one typeface. It is built fresh, not a faithful copy of the spreadsheet’s own formatting.',
    },
    {
      q: 'What does not come across?',
      a: 'Cell colours, fonts, column widths, conditional formatting, charts and formulas — only the calculated value of a formula is shown, as plain text, the same way a printed spreadsheet shows a number rather than the formula behind it.',
    },
    {
      q: 'What happens with a sheet that has a lot of columns?',
      a: 'Every column gets an equal share of the page width, so a wide sheet ends up with narrow columns and more wrapped lines per row rather than text running off the page. Very wide sheets are the one case most worth checking against the original before relying on the PDF.',
    },
    {
      q: 'Can I convert a CSV file the same way?',
      a: 'Yes — see CSV to PDF, which draws the same plain grid from a comma-separated file.',
    },
    {
      q: 'Can I convert the other way, PDF to Excel?',
      a: 'Yes — see PDF to Excel, which keeps the same honesty about what does and doesn’t come across, just in the other direction.',
    },
  ],
  action: 'Convert to PDF',
  outputSuffix: 'converted',
  pagesDone: { one: '{count} page.', other: '{count} pages.' } as PluralForms,
  sheetsDone: { one: '{count} sheet.', other: '{count} sheets.' } as PluralForms,
  errors: {
    'no-text': 'No rows could be read from this spreadsheet.',
  },
};
