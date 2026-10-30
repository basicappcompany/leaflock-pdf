export default {
  title: 'Add page labels',
  metaTitle: 'Add PDF page labels (i, ii, A-1…) privately | LeafLock PDF',
  metaDescription:
    'Set what a PDF reader shows as each page number — roman numerals for a preface, a custom prefix, a different start — without drawing anything on the page. Free, private, in your browser.',
  summary: 'Set what your PDF reader shows as the page number, for one or more ranges.',
  howTo: [
    'Choose a PDF.',
    'Add a range for each part that should count differently, in page order.',
    'Select Add page labels and download the result.',
  ],
  faq: [
    {
      q: 'Is my document uploaded to add labels?',
      a: 'No. The label is written into the PDF by your browser, on your device.',
    },
    {
      q: 'How is this different from Add page numbers?',
      a: 'Add page numbers draws visible text onto the page itself. This sets the number your PDF reader shows in its own page box, thumbnail strip and “go to page” dialog — the page’s content is untouched. Many PDFs use both: a printed “i” on the cover and a reader that also says “i” in its own interface, because this tool told it to.',
    },
    {
      q: 'Can I number a preface with roman numerals, then switch to normal numbers?',
      a: 'Yes. Add a range starting at page 1 with roman numerals, then a second range starting where the body begins, with decimal numbers restarting at 1 — the common case this tool is built around.',
    },
    {
      q: 'Can I add a prefix, like "A-1"?',
      a: 'Yes. Set the prefix on a range and it comes before the number on every page in that range.',
    },
    {
      q: 'Does every PDF reader show these labels?',
      a: 'Most desktop and browser PDF readers do, in the page-number box and the thumbnail panel. A reader that does not support them simply falls back to counting pages 1, 2, 3 as normal.',
    },
  ],
  fromPageLabel: 'From page',
  styleLabel: 'Style',
  style: {
    decimal: '1, 2, 3',
    upperRoman: 'I, II, III',
    lowerRoman: 'i, ii, iii',
    upperLetters: 'A, B, C',
    lowerLetters: 'a, b, c',
    none: 'No number',
  },
  prefixLabel: 'Prefix',
  startAtLabel: 'Start at',
  previewLabel: 'Page {page}: {label}',
  addRange: 'Add a range',
  removeRange: 'Remove this range',
  problems: {
    empty: 'Add at least one range.',
    mustStartAtFirstPage: 'The first range must start at page 1.',
    outOfOrder: 'Each range must start after the one before it.',
    outOfRange: 'A range starts past the last page of this document.',
  },
  action: 'Add page labels',
  outputSuffix: 'labelled',
  errors: {},
};
