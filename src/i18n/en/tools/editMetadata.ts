export default {
  title: 'Edit PDF metadata',
  metaTitle: 'Edit PDF metadata — change title and author | LeafLock PDF',
  metaDescription:
    'Change the title, author, subject and keywords stored in a PDF. Runs in your browser; the file is never uploaded.',
  summary: 'Change the title, author, subject and keywords a PDF carries.',
  howTo: [
    'Choose a PDF to see the properties it carries.',
    'Edit any field, or clear it to remove it.',
    'Select Save properties, then download the result.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded to change its properties?',
      a: 'No. The file is read and rewritten in your browser on your device, and never sent anywhere.',
    },
    {
      q: 'Which properties can I change?',
      a: 'Title, author, subject and keywords — the four fields readers and search tools actually use. Leave a field empty and it is removed from the file rather than stored as a blank value.',
    },
    {
      q: 'Why does the result say an XMP packet was removed?',
      a: 'A PDF can state the same thing twice: once in its document information fields and once in an XMP metadata packet. Readers disagree about which of the two wins, so a file edited in one place can show the old author in one viewer and the new one in another. We remove the XMP copy, so what you typed is what every reader shows.',
    },
    {
      q: 'Does this change what the pages say?',
      a: 'No. Only the document properties change. Visible text and images are untouched.',
    },
    {
      q: 'How do I remove all of it at once instead?',
      a: 'Use Remove PDF metadata. That strips every field, the XMP packet, the document ID and the per-page editing leftovers in one step — and adds nothing of ours in their place.',
    },
    {
      q: 'Can I see a PDF’s metadata without changing it?',
      a: 'Yes. Choose a file and the current values are shown straight away. Nothing is written unless you save.',
    },
  ],
  fields: {
    title: 'Title',
    author: 'Author',
    subject: 'Subject',
    keywords: 'Keywords',
  },
  keywordsHint: 'Separate keywords with commas.',
  empty: 'This PDF carries no document properties yet. Anything you type will be added.',
  xmpNotice: 'This file also carries an XMP metadata packet. Saving removes it, so readers can’t show the old values.',
  action: 'Save properties',
  outputSuffix: 'properties',
  saved: 'Document properties saved.',
  xmpRemoved: 'The XMP metadata packet was removed, so every reader shows what you typed.',
  errors: {},
};
