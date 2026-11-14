import type { PluralForms } from '../../format';

export default {
  title: 'Extract tables from PDF',
  metaTitle: 'Extract PDF tables to CSV or Excel privately | LeafLock PDF',
  metaDescription:
    'Pull just the tables out of a PDF, as CSV or .xlsx — the rest of the document is skipped. Runs on your device, never uploaded. Free, no sign-up.',
  summary: 'Pull just the tables out of a PDF, as CSV or Excel — nothing else.',
  howTo: [
    'Choose a PDF containing one or more tables.',
    'Pick CSV or Excel as the output.',
    'Select Extract tables and download the result.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded to extract its tables?',
      a: 'No. It is read and the files are built in your browser, on your device.',
    },
    {
      q: 'How is this different from PDF to Excel?',
      a: 'PDF to Excel keeps every page, prose included, one sheet each, so nothing from the document goes missing. This tool keeps only the pages where a table was actually found, and skips the rest entirely — for when you want just the data.',
    },
    {
      q: 'How does it find the tables?',
      a: 'The same way PDF to Excel does: by looking for vertical bands of blank space that run down the whole page. A PDF never records “this is a table”, only text at coordinates, so this is an educated guess based on alignment.',
    },
    {
      q: 'What if no table is found?',
      a: 'The tool says so rather than guessing — check that the PDF has a real column layout, or that it isn’t a scan with no text layer (run OCR PDF first).',
    },
    {
      q: 'A table spans several pages. What happens?',
      a: 'Each page becomes its own file (CSV) or sheet (Excel), in page order. They are not merged into one table, since telling where a continued table’s header ends and its data resumes is exactly the kind of guess this tool avoids making for you.',
    },
    {
      q: 'Why CSV as well as Excel?',
      a: 'CSV is the plainer choice when the data is headed into a script or another system; Excel is the one to open and check by eye. Pick whichever the next step needs.',
    },
  ],
  formatLabel: 'Output as',
  format: { csv: 'CSV', xlsx: 'Excel (.xlsx)' },
  reading: 'Reading page {number} of {count}…',
  action: 'Extract tables',
  tablesFoundDone: {
    one: 'Found a table on {count} page.',
    other: 'Found tables on {count} pages.',
  } as PluralForms,
  errors: {
    'no-tables': 'No table was found on any page of {name}. If it is a scan, run OCR PDF over it first.',
  },
};
