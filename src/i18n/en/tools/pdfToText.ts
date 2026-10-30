import type { PluralForms } from '../../format';

export default {
  title: 'PDF to text',
  metaTitle: 'Extract text from a PDF, privately | LeafLock PDF',
  metaDescription:
    'Copy all the text out of a PDF into a plain text file, in your browser. For scanned PDFs, use OCR first.',
  summary: 'Pull all the text out of a PDF into a plain text file.',
  howTo: [
    'Choose a PDF.',
    'Read the text in the preview, or copy it.',
    'Download it as a .txt file.',
  ],
  faq: [
    {
      q: 'Is my PDF’s text sent anywhere?',
      a: 'No. The text is read out of the PDF by your browser and stays on your device, in the preview and in the file you download.',
    },
    {
      q: 'Why was no text found?',
      a: 'The PDF probably contains scans or photos of pages rather than real text. Run it through OCR PDF to recognize the text first.',
    },
    {
      q: 'Is the layout kept?',
      a: 'No. You get plain text with line breaks. Fonts, tables and images aren’t kept, and text in columns may not come out in reading order.',
    },
    {
      q: 'Can I tell which page the text came from?',
      a: 'Yes. Mark where each page starts is on by default and adds a line such as “--- Page 2 ---” before each page. Turn it off for continuous text.',
    },
    {
      q: 'What file do I get?',
      a: 'A plain .txt file in UTF-8, which opens in any text editor. You can also copy the text straight from the preview.',
    },
    {
      q: 'Does it work with password-protected PDFs?',
      a: 'If the PDF needs a password to open, remove it with Unlock PDF first, then extract the text.',
    },
  ],
  separators: 'Mark where each page starts',
  pageSeparator: '--- Page {number} ---',
  reading: 'Reading page {number} of {count}…',
  textLabel: 'Text from {name}',
  characterCount: { one: '{count} character', other: '{count} characters' } as PluralForms,
  copy: 'Copy text',
  copied: 'Copied',
  copyFailed: 'Your browser blocked copying. Select the text and copy it yourself.',
  noText: 'This PDF has no selectable text. It’s probably a scan or a photo.',
  tryOcr: 'Recognize the text with OCR PDF',
  action: 'Extract text',
  outputSuffix: 'text',
  errors: {},
};
