import type { PluralForms } from '../../format';

export default {
  title: 'RTF to PDF',
  metaTitle: 'Convert RTF to PDF privately, in your browser | LeafLock PDF',
  metaDescription:
    'Turn a rich text (.rtf) document into a PDF, keeping bold and italic text. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a rich text (.rtf) document into a PDF, on your device.',
  howTo: ['Choose a .rtf file.', 'Select Convert to PDF.', 'Download the PDF.'],
  faq: [
    {
      q: 'Is my document uploaded to convert it?',
      a: 'No. It is read and the PDF is built in your browser on your device.',
    },
    {
      q: 'What comes across?',
      a: 'Paragraphs, and bold and italic text, laid out on plain A4 pages in a single typeface.',
    },
    {
      q: 'What does not come across?',
      a: 'Headings, lists, tables, images, fonts and colours. RTF has no reliable way to tell a heading from a styled paragraph without parsing the document’s full style sheet, so every paragraph is treated the same way here — a narrower scope than Word to PDF, stated plainly rather than guessed at.',
    },
    {
      q: 'Can I convert a Word document instead?',
      a: 'Yes — see Word to PDF, which keeps headings and lists as well, since .docx carries that structure in a form this product can read reliably.',
    },
  ],
  action: 'Convert to PDF',
  outputSuffix: 'converted',
  pagesDone: { one: '{count} page.', other: '{count} pages.' } as PluralForms,
  errors: {
    'no-text': 'No text could be read from this document.',
  },
};
