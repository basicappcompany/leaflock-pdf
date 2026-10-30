import type { PluralForms } from '../../format';

export default {
  title: 'Compare PDF',
  metaTitle: 'Compare two PDFs and see the differences, privately | LeafLock PDF',
  metaDescription:
    'Find what changed between two versions of a PDF: text differences and visual changes, page by page. No upload.',
  summary: 'See what changed between two versions of a document.',
  howTo: [
    'Choose the original PDF and the changed version.',
    'Switch between text differences and a visual overlay.',
    'Step through the pages to review every change.',
  ],
  faq: [
    {
      q: 'Are both documents kept private?',
      a: 'Yes. Both PDFs are opened and compared in your browser, and neither is uploaded.',
    },
    {
      q: 'What kinds of changes does it find?',
      a: 'Words that were added or removed, page by page, and a visual overlay that highlights areas that look different, such as images or layout. You can also view the pages side by side.',
    },
    {
      q: 'How are the pages matched?',
      a: 'Page 1 is compared with page 1, page 2 with page 2, and so on. If a page was added or removed, the pages after it shift and may show many changes.',
    },
    {
      q: 'Can it compare scanned PDFs?',
      a: 'The text comparison needs selectable text, which scans don’t have. The visual overlay still shows where scanned pages differ.',
    },
    {
      q: 'Does it notice formatting changes?',
      a: 'The text comparison only looks at the words, so changes in font, color or styling show up only in the visual overlay.',
    },
    {
      q: 'Is Compare PDF free?',
      a: 'It’s a Pro tool, and it’s free to use during early access.',
    },
  ],
  original: 'Original',
  changed: 'Changed version',
  analysing: 'Comparing the documents…',
  modeLabel: 'Show',
  modes: { text: 'Text changes', overlay: 'Visual overlay', sideBySide: 'Side by side' },
  summaryHeading: 'Pages',
  pageSummary: 'Page {number}',
  noChanges: 'No text changes',
  changes: { one: '{count} word changed', other: '{count} words changed' } as PluralForms,
  onlyInOriginal: 'Only in the original',
  onlyInChanged: 'Only in the changed version',
  identical: 'The text of both documents is identical. Use the visual overlay to check for changes in images or layout.',
  /** Joined as “{added}, {removed}”. */
  totalsJoin: '{added}, {removed}',
  added: { one: '{count} word added', other: '{count} words added' } as PluralForms,
  removed: { one: '{count} word removed', other: '{count} words removed' } as PluralForms,
  legendAdded: 'Added',
  legendRemoved: 'Removed',
  noText: 'No text on this page. It may be a scan; the visual overlay can still show changes.',
  visualChanged: '{percent}% of this page looks different.',
  visualSame: 'This page looks the same in both versions.',
  overlayHint: 'Highlighted areas look different between the two versions.',
  missingPage: 'This page only exists in one version.',
  originalPage: 'Original, page {number}',
  changedPage: 'Changed version, page {number}',
  overlayAlt: 'Differences on page {number}, highlighted',
  errors: {},
};
