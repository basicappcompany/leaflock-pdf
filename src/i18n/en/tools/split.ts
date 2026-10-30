import type { PluralForms } from '../../format';

export default {
  title: 'Split PDF',
  metaTitle: 'Split a PDF into separate files, privately | LeafLock PDF',
  metaDescription:
    'Split a PDF by page ranges or into single pages, right in your browser. No upload, no sign-up, no watermark.',
  summary: 'Break a PDF into several files by page range, or one file per page.',
  howTo: [
    'Choose the PDF you want to split.',
    'Pick how to split it: by ranges you type, or every few pages.',
    'Select Split PDF and download the files, one by one or as a ZIP.',
  ],
  faq: [
    {
      q: 'Are my files uploaded when I split a PDF?',
      a: 'No. The PDF is split inside your browser and the new files are created on your device. Nothing is sent to a server.',
    },
    {
      q: 'How can I split a PDF?',
      a: 'Three ways: by page ranges you type, with one file per range; into files of a set number of pages; or into one file per page.',
    },
    {
      q: 'Can the same page go into more than one file?',
      a: 'Yes. Ranges may overlap, so a page can appear in several of the new files.',
    },
    {
      q: 'Can I download all the files at once?',
      a: 'Yes. When the split makes more than one file, select Download all as ZIP to get them in a single archive.',
    },
    {
      q: 'Does splitting change the original or its quality?',
      a: 'No. Your original file stays as it is, and the pages are copied into the new PDFs without any loss in quality.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'There’s no fixed limit. The practical limit is your device’s memory, since the whole PDF is processed there.',
    },
  ],
  modeLabel: 'How to split',
  modes: {
    ranges: 'By page ranges',
    every: 'Every few pages',
    single: 'Every page',
  },
  rangeLabel: 'File {number}',
  removeRange: 'Remove file {number}',
  addRange: 'Add another file',
  everyLabel: 'Pages per file',
  willCreate: { one: 'This makes {count} file.', other: 'This makes {count} files.' } as PluralForms,
  fixRanges: 'Type the pages for each file, like 1-3.',
  action: 'Split PDF',
  errors: {},
};
