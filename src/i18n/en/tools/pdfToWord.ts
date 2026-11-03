import type { PluralForms } from '../../format';

export default {
  title: 'PDF to Word',
  metaTitle: 'Convert PDF to Word (.docx) privately, in your browser | LeafLock PDF',
  metaDescription:
    'Turn a PDF into an editable Word document with headings, bold, italics and lists. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a PDF into an editable Word document, on your device.',
  howTo: [
    'Choose a PDF.',
    'Decide whether each PDF page should start a new page in Word.',
    'Select Convert to Word and download the .docx.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded to convert it?',
      a: 'No, and this is the part every other converter gets wrong. PDF to Word is normally done on a server, which means handing over the document — a contract, a payslip, a medical letter. Here the text is read and the Word file is built in your browser on your device. You can watch the network panel stay empty while it happens.',
    },
    {
      q: 'What comes across?',
      a: 'Paragraphs, headings, bold and italic text, and bulleted and numbered lists. Headings and lists are real Word styles, not characters typed to look like them, so you can keep editing and the numbering continues properly.',
    },
    {
      q: 'What does not come across?',
      a: 'Tables, images, exact fonts, colors and precise page layout. A PDF does not record any of those as structure — it records glyphs at coordinates — so a converter either infers them or invents them. We would rather tell you what you are getting. If the layout matters more than the text, keep the PDF.',
    },
    {
      q: 'How does it know what is a heading?',
      a: 'By size, measured against the rest of your document rather than against a fixed number of points. The size that covers the most text is treated as body copy, and anything meaningfully larger becomes a heading, so a document set in 10pt and one set in 14pt both come out sensibly.',
    },
    {
      q: 'Why does it warn about columns?',
      a: 'Text in two columns is stored as two blocks side by side, with nothing in the file saying they are columns. Read top to bottom, a line of the left column is followed by a line of the right. We look for the gutter between columns and tell you which pages have one, rather than quietly handing you shuffled text.',
    },
    {
      q: 'The PDF is a scan and nothing came out. Why?',
      a: 'A scan is a picture of a page, so there is no text in it to convert. Run OCR PDF over it first — that adds a text layer — then convert the result.',
    },
    {
      q: 'Can I convert the other way, Word to PDF?',
      a: 'Not yet. It is on the roadmap, and it will say plainly what it does and does not reproduce, the same way this page does.',
    },
  ],
  pageBreaks: 'Start a new Word page for each PDF page',
  pageBreaksHint: 'Turn this off to let the text reflow as one continuous document.',
  reading: 'Reading page {number} of {count}…',
  action: 'Convert to Word',
  outputSuffix: 'converted',
  blocksDone: {
    one: '{count} paragraph of text.',
    other: '{count} paragraphs of text.',
  } as PluralForms,
  headingsDone: { one: '{count} heading.', other: '{count} headings.' } as PluralForms,
  listItemsDone: { one: '{count} list item.', other: '{count} list items.' } as PluralForms,
  columnsWarning: {
    one: 'Page {pages} looks like it is laid out in columns, so its text may be out of order.',
    other: 'Pages {pages} look like they are laid out in columns, so their text may be out of order.',
  } as PluralForms,
  noTextHint: 'If this PDF is a scan, run OCR PDF over it first to add a text layer.',
  errors: {
    'no-text': 'No text could be read from this PDF. If it is a scan, run OCR PDF over it first.',
  },
};
