export default {
  title: 'Bates numbering',
  metaTitle: 'Bates number a set of PDFs privately | LeafLock PDF',
  metaDescription:
    'Stamp a running Bates number — a prefix and a zero-padded sequence like ABC000001 — across a whole set of PDFs, in your browser. Free, no sign-up.',
  summary: 'Stamp a continuous, zero-padded sequence number across a set of PDFs.',
  howTo: [
    'Add the files, in the order the sequence should run.',
    'Set the prefix, digit count and starting number.',
    'Select Add Bates numbers and download the stamped files.',
  ],
  faq: [
    {
      q: 'Is my document uploaded to add the numbers?',
      a: 'No. Every file is stamped in your browser, on your device, and never leaves it.',
    },
    {
      q: 'What is a Bates number?',
      a: 'A unique label stamped on every page of a document set — usually a short prefix followed by a zero-padded number, such as ABC000001 — so any page can be cited and found again regardless of which file it is in.',
    },
    {
      q: 'Does the number keep counting across files, or restart each time?',
      a: 'It keeps counting. The order the files are listed in is the order they are numbered in, continuing from one file into the next.',
    },
    {
      q: 'Can I change how many digits the number has?',
      a: 'Yes. Set the digit count — 6 is common for case files — and the number is padded with leading zeros to that width.',
    },
    {
      q: 'Can I add a prefix or suffix?',
      a: 'Yes. The prefix comes before the number (a matter or case code, for example) and the suffix after it (such as -CONF for confidential pages).',
    },
    {
      q: 'Can I choose where the stamp goes on the page?',
      a: 'Yes. Pick the corner or edge, the text size, color and distance from the edge.',
    },
  ],
  filesLabel: 'Files, in sequence order',
  prefixLabel: 'Prefix',
  suffixLabel: 'Suffix',
  digitsLabel: 'Digits',
  startLabel: 'First number',
  sizeLabel: 'Text size',
  marginLabel: 'Distance from edge',
  colorLabel: 'Color',
  verticalLabel: 'Position',
  vertical: { top: 'Top', bottom: 'Bottom' },
  horizontalLabel: 'Alignment',
  horizontal: { left: 'Left', center: 'Center', right: 'Right' },
  preview: 'First stamp: {label}',
  needOne: 'Add at least one file.',
  action: 'Add Bates numbers',
  outputSuffix: 'bates',
  errors: {},
};
