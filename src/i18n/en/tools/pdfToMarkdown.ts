import type { PluralForms } from '../../format';

export default {
  title: 'PDF to Markdown',
  metaTitle: 'Convert PDF to Markdown (.md) privately, in your browser | LeafLock PDF',
  metaDescription:
    'Turn a PDF into plain-text Markdown with real headings, bold, italics and lists. Runs on your device — the file is never uploaded. Free, no sign-up.',
  summary: 'Turn a PDF into Markdown, on your device.',
  howTo: ['Choose a PDF.', 'Select Convert to Markdown.', 'Download the .md file.'],
  faq: [
    {
      q: 'Is my PDF uploaded to convert it?',
      a: 'No. The text is read and the Markdown file is built in your browser, on your device.',
    },
    {
      q: 'What comes across?',
      a: 'Paragraphs, headings (as #, ##, ###), bold and italic text, and bulleted and numbered lists, in plain CommonMark — the dialect every static-site generator, README renderer and chat tool reads.',
    },
    {
      q: 'What does not come across?',
      a: 'Tables, images, exact fonts, colours and precise page layout — a PDF records glyphs at coordinates, not structure, so this is the same inferred outline PDF to Word uses, written out differently rather than a second analysis.',
    },
    {
      q: 'How is this different from PDF to Text?',
      a: 'PDF to Text gives you the words. This also gives you the structure those words had — which line was a heading, which were a list — as Markdown syntax, so the result still has shape when it lands in a notes app, a wiki or a commit.',
    },
    {
      q: 'Why does it warn about columns?',
      a: 'Text in two columns is stored as two blocks side by side, with nothing in the file saying they are columns. We look for the gutter between them and tell you which pages have one, rather than quietly handing you shuffled text.',
    },
    {
      q: 'The PDF is a scan and nothing came out. Why?',
      a: 'A scan is a picture of a page, so there is no text in it to convert. Run OCR PDF over it first — that adds a text layer — then convert the result.',
    },
  ],
  reading: 'Reading page {number} of {count}…',
  action: 'Convert to Markdown',
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
  errors: {
    'no-text': 'No text could be read from this PDF. If it is a scan, run OCR PDF over it first.',
  },
};
