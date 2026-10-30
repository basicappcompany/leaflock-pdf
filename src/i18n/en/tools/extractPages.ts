export default {
  title: 'Extract pages',
  metaTitle: 'Extract pages from a PDF, privately | LeafLock PDF',
  metaDescription:
    'Pull selected pages out of a PDF into a new file, in your browser. No upload and no account needed.',
  summary: 'Copy selected pages into a new PDF, or one PDF per page.',
  howTo: [
    'Choose a PDF.',
    'Select the pages you want to keep, or type their numbers.',
    'Select Extract pages and download the result.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded when I extract pages?',
      a: 'No. Copying the pages into a new file happens in your browser, on your device. Your document isn’t sent anywhere.',
    },
    {
      q: 'Can I save each page as its own file?',
      a: 'Yes. Under Save as, choose One PDF per page. You can then download the files one by one or all together as a ZIP.',
    },
    {
      q: 'Are the pages kept in the order I select them?',
      a: 'No. Extracted pages keep the order they have in the original. To change the order, use Organize PDF on the result.',
    },
    {
      q: 'Does the original file change?',
      a: 'No. Extracting copies the pages into a new PDF; the original stays complete.',
    },
    {
      q: 'Will the quality change?',
      a: 'No. Pages are copied as they are, not turned into images, so text stays sharp and selectable.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'There’s no fixed limit. Very large files depend on how much memory your device has, because everything is processed there.',
    },
  ],
  rangeLabel: 'Pages to extract',
  instructions: 'Select the pages to extract.',
  outputLabel: 'Save as',
  outputs: {
    one: 'One PDF',
    separate: 'One PDF per page',
  },
  action: 'Extract pages',
  outputSuffix: 'extract',
  errors: {},
};
