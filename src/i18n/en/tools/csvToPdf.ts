import type { PluralForms } from '../../format';

export default {
  title: 'CSV to PDF',
  metaTitle: 'Convert CSV to PDF privately, in your browser | LeafLock PDF',
  metaDescription:
    'Turn a comma-separated file into a PDF, as a plain bordered grid. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a comma-separated file into a PDF, on your device.',
  howTo: ['Choose a .csv file.', 'Select Convert to PDF.', 'Download the PDF.'],
  faq: [
    {
      q: 'Is my file uploaded to convert it?',
      a: 'No. It is read and the PDF is built in your browser on your device.',
    },
    {
      q: 'What does the PDF look like?',
      a: 'A plain bordered grid, one row per line of the file, drawn fresh in one typeface — not a copy of how any particular spreadsheet program would print it.',
    },
    {
      q: 'What delimiter does this expect?',
      a: 'A comma. A file exported with semicolons or tabs instead — common in some regions and from some spreadsheet programs — will not split into columns correctly; open it in a spreadsheet program and re-save it as comma-separated CSV first.',
    },
    {
      q: 'What happens with a file that has a lot of columns?',
      a: 'Every column gets an equal share of the page width, so a wide file ends up with narrow columns and more wrapped lines per row. Worth checking against the original for a very wide file.',
    },
    {
      q: 'Can I convert an Excel file the same way?',
      a: 'Yes — see Excel to PDF, which draws the same plain grid from a .xlsx workbook, one page per sheet.',
    },
  ],
  action: 'Convert to PDF',
  outputSuffix: 'converted',
  pagesDone: { one: '{count} page.', other: '{count} pages.' } as PluralForms,
  errors: {
    'no-text': 'No rows could be read from this file.',
  },
};
