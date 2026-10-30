export default {
  title: 'Remove pages',
  metaTitle: 'Delete pages from a PDF, privately | LeafLock PDF',
  metaDescription:
    'Remove unwanted pages from a PDF in your browser. Pick pages visually or by number. Files never leave your device.',
  summary: 'Delete the pages you don’t need from a PDF.',
  howTo: [
    'Choose a PDF.',
    'Select the pages to remove, or type their numbers.',
    'Select Remove pages and download the new PDF.',
  ],
  faq: [
    {
      q: 'Is it safe to delete pages from a PDF online?',
      a: 'Yes. The pages are removed by your browser on your device, and the document is never uploaded or seen by anyone else.',
    },
    {
      q: 'How do I choose the pages to remove?',
      a: 'Click the page thumbnails, or type page numbers and ranges such as 1-3, 5, 8- (page 8 to the end). The two stay in sync.',
    },
    {
      q: 'Can I undo it?',
      a: 'Your original file isn’t changed. You download a new copy without those pages, so keep the original if you might need them again.',
    },
    {
      q: 'Can I remove every page?',
      a: 'No, at least one page has to stay. If you only want to keep a few pages, Extract pages may be quicker.',
    },
    {
      q: 'Will the remaining pages lose quality?',
      a: 'No. They’re copied unchanged, so text stays selectable and images keep their quality.',
    },
    {
      q: 'Does it work on a phone?',
      a: 'Yes. It runs in any modern browser on phones, tablets and computers, with no app or account needed.',
    },
  ],
  rangeLabel: 'Pages to remove',
  instructions: 'Select the pages to remove.',
  cannotRemoveAll: 'You can’t remove every page. Leave at least one.',
  action: 'Remove pages',
  outputSuffix: 'pages-removed',
  errors: {},
};
