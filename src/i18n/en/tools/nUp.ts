import type { PluralForms } from '../../format';

export default {
  title: 'Multiple pages per sheet',
  metaTitle: 'Print multiple PDF pages per sheet (N-up) | LeafLock PDF',
  metaDescription:
    'Put 2, 4, 6, 9 or 16 PDF pages on one sheet to save paper, or to make a handout or contact sheet. Runs in your browser; nothing is uploaded.',
  summary: 'Put 2, 4 or more pages on each sheet to save paper.',
  howTo: [
    'Choose a PDF.',
    'Pick how many pages go on each sheet, and the sheet size.',
    'Select Combine onto sheets and download the result.',
  ],
  faq: [
    {
      q: 'What is N-up?',
      a: 'Printing several pages of a document side by side on one sheet of paper — two-up, four-up and so on. It is the usual way to save paper, hand out slides, or print a long document for review.',
    },
    {
      q: 'Why not just use my printer’s settings?',
      a: 'You can, when the printer offers it. Making the file instead means the layout is fixed in the PDF itself, so it looks the same on any printer, can be checked before you print, and can be emailed to someone else to print.',
    },
    {
      q: 'Will the pages be squashed?',
      a: 'No. Each page is scaled to fit its cell while keeping its shape, and centred. Pages of different sizes in the same document are each scaled to fit on their own.',
    },
    {
      q: 'What happens to sideways pages?',
      a: 'They stay the way they look now. A page that a viewer shows in landscape because it is rotated is laid out as landscape, not turned on its side — which is a thing that quietly goes wrong in other tools, since a PDF stores the rotation separately from the page size.',
    },
    {
      q: 'Do links and form fields still work?',
      a: 'No, and this is the one real trade-off. Each page is drawn onto the sheet as artwork, so links, comments and fillable fields are left behind. Several pages now share one sheet, so a link’s position no longer means what it did. Keep the original if you need those.',
    },
    {
      q: 'Is my PDF uploaded?',
      a: 'No. The sheets are drawn in your browser on your device and the file is never sent anywhere.',
    },
  ],
  layout: 'Pages per sheet',
  layouts: {
    '2': '2 (side by side)',
    '4': '4 (2 × 2)',
    '6': '6 (3 × 2)',
    '9': '9 (3 × 3)',
    '16': '16 (4 × 4)',
  },
  sheetSize: 'Sheet size',
  sheetSizes: {
    a4: 'A4',
    a4Landscape: 'A4 landscape',
    letter: 'Letter',
    letterLandscape: 'Letter landscape',
  },
  margin: 'Margin (pt)',
  gutter: 'Space between pages (pt)',
  border: 'Draw a thin line around each page',
  action: 'Combine onto sheets',
  outputSuffix: 'sheets',
  sheetsDone: { one: '{count} sheet.', other: '{count} sheets.' } as PluralForms,
  skippedDone: {
    one: '{count} empty page was left out.',
    other: '{count} empty pages were left out.',
  } as PluralForms,
  errors: {
    'nothing-to-impose': '{name} has no pages that can be laid out.',
  },
};
