export default {
  title: 'Alternate & mix PDF pages',
  metaTitle: 'Alternate and mix PDF pages — combine two scans | LeafLock PDF',
  metaDescription:
    'Interleave two PDFs page by page, the way you rejoin a stack scanned front-side then back-side. Runs in your browser; nothing is uploaded.',
  summary: 'Interleave two PDFs page by page — ideal for two-pass scans.',
  howTo: [
    'Choose the PDF with the first pages — usually the fronts.',
    'Choose the second PDF, and say whether its pages are in reverse order.',
    'Select Mix pages and download the combined PDF.',
  ],
  faq: [
    {
      q: 'What is this for?',
      a: 'Rejoining a document scanned in two passes. A sheet-fed scanner without a duplex feeder gives you one PDF of all the fronts and another of all the backs; mixing them puts page 2 between page 1 and page 3, so the document reads properly again.',
    },
    {
      q: 'The backs came out in the wrong order. Can you fix that?',
      a: 'Yes, and it is the normal case: when you flip the stack over and feed it again, the backs are scanned from the last sheet to the first. Leave “the second PDF is in reverse order” switched on and they are matched up correctly.',
    },
    {
      q: 'What if the two PDFs have different numbers of pages?',
      a: 'Nothing is dropped. Pages alternate until one file runs out, and the rest of the longer file follows on the end.',
    },
    {
      q: 'Can I take more than one page at a time from each file?',
      a: 'Yes. Raise the pages-at-a-time setting to take two or more from each file before switching — useful for documents scanned two sheets at a time, or for interleaving chapters rather than single pages.',
    },
    {
      q: 'Are my scans uploaded?',
      a: 'No. Both files are read in your browser and the combined PDF is built on your device, so scanned contracts, records and statements never leave it.',
    },
    {
      q: 'How is this different from merging?',
      a: 'Merge PDF puts one document after the other. This one weaves them together page by page.',
    },
  ],
  firstFile: 'First PDF',
  firstFileHint: 'Usually the front of each sheet: pages 1, 3, 5 and so on.',
  secondFile: 'Second PDF',
  secondFileHint: 'Usually the back of each sheet: pages 2, 4, 6 and so on.',
  reverseSecond: 'The second PDF is in reverse order',
  reverseSecondHint: 'Leave this on if the backs were scanned by flipping the whole stack over.',
  step: 'Pages at a time from each file',
  action: 'Mix pages',
  outputName: 'mixed.pdf',
  errors: {},
};
