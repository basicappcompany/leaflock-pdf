import type { PluralForms } from '../../format';

export default {
  title: 'Make a PDF booklet',
  metaTitle: 'Make a booklet from a PDF — fold and staple | LeafLock PDF',
  metaDescription:
    'Reorder a PDF for saddle-stitch printing: print double-sided, fold the stack in half, staple the spine, and the pages read in order. Nothing is uploaded.',
  summary: 'Reorder a PDF so printing double-sided and folding makes a booklet.',
  howTo: [
    'Choose a PDF.',
    'Pick the sheet size you will print on.',
    'Select Make booklet, print it double-sided (flip on the short edge), then fold and staple.',
  ],
  faq: [
    {
      q: 'What does this actually do?',
      a: 'It puts two pages side by side on each side of a sheet, in the order a folded stack needs. Page 1 and the last page share the first sheet, page 2 and the second-to-last share its back, and so on — so once the printed stack is folded in half and stapled on the spine, the pages read 1, 2, 3 and onward.',
    },
    {
      q: 'How do I print it?',
      a: 'Double-sided, flipping on the short edge, with scaling set to none or 100%. If your printer flips on the long edge instead, every other sheet comes out upside down — most print dialogs call this setting “flip on short edge” or “booklet”.',
    },
    {
      q: 'Why did it add blank pages?',
      a: 'A folded sheet always carries four pages, so the total has to be a multiple of four. Any shortfall becomes blank pages, placed at the end of the finished booklet where a reader expects them.',
    },
    {
      q: 'Does the order look wrong in a PDF viewer?',
      a: 'Yes, and that is correct. The file is the printer’s order, not the reader’s: the first sheet shows the last page next to the first. It reads properly once printed and folded.',
    },
    {
      q: 'Do links and form fields still work?',
      a: 'No. Each page is drawn onto the sheet as artwork, so links, comments and fillable fields are left behind — a booklet is made to be printed. Keep the original for reading on screen.',
    },
    {
      q: 'Is my PDF uploaded?',
      a: 'No. The booklet is built in your browser on your device and the file is never sent anywhere.',
    },
  ],
  sheetSize: 'Sheet size',
  sheetSizes: {
    a4Landscape: 'A4 landscape (two A5 pages)',
    letterLandscape: 'Letter landscape (two half-letter pages)',
    a3Landscape: 'A3 landscape (two A4 pages)',
  },
  margin: 'Margin (pt)',
  gutter: 'Space at the fold (pt)',
  border: 'Draw a thin line around each page',
  action: 'Make booklet',
  outputSuffix: 'booklet',
  sheetsDone: {
    one: '{count} printed side — one sheet, double-sided.',
    other: '{count} printed sides. Print double-sided, flipping on the short edge.',
  } as PluralForms,
  padded: {
    one: '{count} blank page was added at the end so the sheets fold evenly.',
    other: '{count} blank pages were added at the end so the sheets fold evenly.',
  } as PluralForms,
  errors: {
    'nothing-to-impose': '{name} has no pages that can be laid out.',
  },
};
