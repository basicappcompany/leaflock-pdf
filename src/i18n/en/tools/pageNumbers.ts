export default {
  title: 'Add page numbers',
  metaTitle: 'Add page numbers to a PDF, privately | LeafLock PDF',
  metaDescription:
    'Number the pages of a PDF: choose position, style, starting number and which pages. Free, private, in your browser.',
  summary: 'Number your pages, with the position and style you choose.',
  howTo: [
    'Choose a PDF.',
    'Pick where the numbers go, how they look and where they start.',
    'Select Add page numbers and download the result.',
  ],
  faq: [
    {
      q: 'Is my document uploaded to add page numbers?',
      a: 'No. The numbers are written into the PDF by your browser, on your device.',
    },
    {
      q: 'Can I leave out the cover page?',
      a: 'Yes. Tick Skip the first page (cover). Page 2 then gets the first number, which is 1 unless you change it.',
    },
    {
      q: 'Can I start counting from a different number?',
      a: 'Yes. Set First number to the number the first numbered page should get.',
    },
    {
      q: 'Can I show “Page 1 of 10”?',
      a: 'Yes. Pick that style, or choose Custom and type your own text using the placeholders shown under the field. The total is the last number used, so it allows for skipped pages.',
    },
    {
      q: 'Can I number only some pages?',
      a: 'Yes. Choose Chosen pages and type the pages, for example 3-12. The numbers run in order across the pages you pick.',
    },
    {
      q: 'Can I choose where the numbers go?',
      a: 'Yes. Put them at the top or bottom, on the left, center or right, and set the text size, color and distance from the edge. The preview shows how they’ll look.',
    },
  ],
  previewLabel: 'Preview of page {number} with its page number',
  verticalLabel: 'Position',
  vertical: { top: 'Top', bottom: 'Bottom' },
  horizontalLabel: 'Alignment',
  horizontal: { left: 'Left', center: 'Center', right: 'Right' },
  styleLabel: 'Style',
  /** `{n}` is the page number and `{total}` the last number. Translate the words, keep the placeholders. */
  templates: {
    number: '{n}',
    page: 'Page {n}',
    pageOfTotal: 'Page {n} of {total}',
    slash: '{n} / {total}',
  },
  customStyle: 'Custom…',
  customLabel: 'Custom text',
  customHint: 'Use {n} for the page number and {total} for the last number.',
  customMissing: 'Include {n} where the number should go.',
  startLabel: 'First number',
  sizeLabel: 'Text size',
  marginLabel: 'Distance from edge',
  colorLabel: 'Color',
  pagesLabel: 'Pages to number',
  pagesMode: { all: 'All pages', custom: 'Chosen pages' },
  skipFirst: 'Skip the first page (cover)',
  nothingToNumber: 'Choose at least one page to number.',
  action: 'Add page numbers',
  outputSuffix: 'numbered',
  errors: {},
};
