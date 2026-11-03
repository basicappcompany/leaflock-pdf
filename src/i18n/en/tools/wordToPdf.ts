import type { PluralForms } from '../../format';

export default {
  title: 'Word to PDF',
  metaTitle: 'Convert Word (.docx) to PDF privately, in your browser | LeafLock PDF',
  metaDescription:
    'Turn a .docx document into a PDF, with headings, bold, italics and lists. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a .docx document into a PDF, on your device.',
  howTo: ['Choose a .docx file.', 'Select Convert to PDF.', 'Download the PDF.'],
  faq: [
    {
      q: 'Is my document uploaded to convert it?',
      a: 'No. The file is read and the PDF is built in your browser on your device, so a contract or a draft never leaves it.',
    },
    {
      q: 'What comes across?',
      a: 'Paragraphs, headings, bold and italic text, and bulleted and numbered lists, laid out on A4 pages.',
    },
    {
      q: 'What does not come across?',
      a: 'Tables, images, your original fonts, colors, page size and margins. The PDF is built fresh on plain A4 pages in a single typeface, not a faithful copy of the document’s appearance — if the exact layout matters, this tool is not the right one yet.',
    },
    {
      q: 'Why is a heading bold even though it wasn’t bold in my document?',
      a: 'A heading style is usually bold by design even when the text itself isn’t separately marked bold in the file, so headings are always drawn bold here to look like headings.',
    },
    {
      q: 'What happens to tables and images in my document?',
      a: 'They are left out, and the result tells you how many of each were skipped. Nothing is approximated in their place.',
    },
    {
      q: 'Can I convert the other way, PDF to Word?',
      a: 'Yes — see PDF to Word, which keeps the same honesty about what does and doesn’t come across, just in the other direction.',
    },
  ],
  action: 'Convert to PDF',
  outputSuffix: 'converted',
  pagesDone: { one: '{count} page.', other: '{count} pages.' } as PluralForms,
  tablesSkipped: { one: '{count} table was dropped.', other: '{count} tables were dropped.' } as PluralForms,
  imagesSkipped: { one: '{count} image was dropped.', other: '{count} images were dropped.' } as PluralForms,
  errors: {
    'no-text': 'No text could be read from this document.',
  },
};
