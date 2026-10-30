import type { PluralForms } from '../../format';

export default {
  title: 'Remove PDF metadata',
  metaTitle: 'Remove PDF metadata, privately | LeafLock PDF',
  metaDescription:
    'Strip the author, title, dates and editing history a PDF carries, plus hidden JavaScript and embedded files. Runs on your device; nothing is uploaded.',
  summary: 'Strip the author, dates and editing history hidden in a PDF.',
  howTo: [
    'Choose a PDF.',
    'Decide whether to remove hidden and active content too.',
    'Select Remove metadata, then download the clean copy.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded when I remove its metadata?',
      a: 'No. The file is read and rewritten in your browser on your device, and never sent anywhere. A tool that uploaded your file to strip its metadata would have defeated the point.',
    },
    {
      q: 'Exactly what gets removed?',
      a: 'The document information fields (title, author, subject, keywords, creator, producer, creation and modification dates), the XMP metadata packet, the document ID that links copies of one file together, and the per-page leftovers editing software writes — private application data, page timestamps and page-level XMP.',
    },
    {
      q: 'Does LeafLock add its own name to the file?',
      a: 'No. Our other tools record that they produced a file, and this one deliberately does not: that would write new metadata into a file you asked to clean, and would tell anyone inspecting it which tool you used. Open the result in any metadata viewer and the producer field is empty, not ours.',
    },
    {
      q: 'What does removing hidden and active content do?',
      a: 'It removes JavaScript, embedded and attached files, actions that run when the document opens, and page-level actions. Links and bookmarks keep working, because named destinations are left alone. An ordinary link that also carried a Launch or JavaScript action keeps its appearance and loses only the part that runs.',
    },
    {
      q: 'Is the removed data really gone from the file?',
      a: 'Yes. Unlinking metadata is not the same as deleting it — some tools leave the old data sitting in the file where anyone can still read it. The clean copy is written from scratch and everything unreachable is dropped, so the bytes are gone, not just the reference to them.',
    },
    {
      q: 'Does this change what the pages say?',
      a: 'No. Visible text, images and comments are untouched. If a name appears in the text of the document, it is still there — use Redact PDF to remove information from the page itself.',
    },
    {
      q: 'What about comments and highlights?',
      a: 'They stay. Use Remove annotations to take out comments, highlights, stamps and drawings, or Flatten PDF to turn them into ordinary page content.',
    },
  ],
  activeContent: 'Also remove hidden and active content',
  activeContentHint:
    'JavaScript, embedded files, and actions that run when the file opens. Links and bookmarks keep working.',
  action: 'Remove metadata',
  outputSuffix: 'clean',
  infoFieldsDone: {
    one: '{count} document information field removed.',
    other: '{count} document information fields removed.',
  } as PluralForms,
  xmpDone: 'XMP metadata packet removed.',
  documentIdDone: 'Document ID removed.',
  pagesDone: {
    one: 'Editing leftovers removed from {count} page.',
    other: 'Editing leftovers removed from {count} pages.',
  } as PluralForms,
  activeItemsDone: {
    one: '{count} hidden or active item removed.',
    other: '{count} hidden or active items removed.',
  } as PluralForms,
  errors: {
    'no-metadata': '{name} has no metadata left to remove.',
  },
};
