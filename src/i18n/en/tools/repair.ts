import type { PluralForms } from '../../format';

export default {
  title: 'Repair PDF',
  metaTitle: 'Repair a damaged PDF, privately | LeafLock PDF',
  metaDescription:
    'Try to recover a PDF that won’t open or shows errors, by rebuilding its structure in your browser.',
  summary: 'Try to rebuild a damaged PDF so it opens again.',
  howTo: [
    'Choose the damaged PDF.',
    'Select Repair PDF.',
    'Download the rebuilt copy and check its pages.',
  ],
  faq: [
    {
      q: 'Is my damaged PDF uploaded?',
      a: 'No. The repair runs in your browser, so the file stays on your device.',
    },
    {
      q: 'How does the repair work?',
      a: 'It first rebuilds the file’s structure, copying every page that can still be read into a new PDF. If that fails, it redraws each readable page as an image and builds a new PDF from those.',
    },
    {
      q: 'Can every PDF be repaired?',
      a: 'No. Pages that are too damaged can’t be recovered, and if no readable pages are found, the file can’t be repaired at all.',
    },
    {
      q: 'Why can’t I select text after the repair?',
      a: 'Pages recovered by redrawing are images. Run the repaired file through OCR PDF to make the text searchable again.',
    },
    {
      q: 'Is anything lost in the repaired copy?',
      a: 'The pages, title, author and subject are kept, but bookmarks aren’t carried over and form fields may stop working. Keep the original and check every page of the copy.',
    },
    {
      q: 'Can it repair a password-protected PDF?',
      a: 'If the file needs a password to open, remove it with Unlock PDF first, then repair it.',
    },
  ],
  explanation:
    'We rebuild the file’s structure from whatever can still be read. If that fails, we try once more by redrawing each page.',
  action: 'Repair PDF',
  outputSuffix: 'repaired',
  rebuilt: { one: 'Rebuilt {count} page.', other: 'Rebuilt {count} pages.' } as PluralForms,
  lost: {
    one: '{count} page was too damaged to recover.',
    other: '{count} pages were too damaged to recover.',
  } as PluralForms,
  fromImages: {
    one: 'Recovered {count} page by redrawing it. Its text can no longer be selected or searched; use OCR PDF to fix that.',
    other: 'Recovered {count} pages by redrawing them. Their text can no longer be selected or searched; use OCR PDF to fix that.',
  } as PluralForms,
  checkResult: 'Open the repaired file and check that every page looks right.',
  errors: {
    unrecoverable: '{name} is too damaged to recover. No readable pages were found.',
  },
};
