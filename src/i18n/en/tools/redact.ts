import type { PluralForms } from '../../format';

export default {
  title: 'Redact PDF',
  metaTitle: 'Redact a PDF permanently, privately | LeafLock PDF',
  metaDescription:
    'Black out sensitive text and images in a PDF so they can’t be recovered. Redaction happens on your device.',
  summary: 'Black out sensitive information so it can’t be recovered.',
  howTo: [
    'Choose a PDF.',
    'Draw boxes over everything that must be hidden.',
    'Select Redact. Pages with redactions become images, so the hidden text is gone for good.',
  ],
  faq: [
    {
      q: 'Is it safe to redact sensitive documents here?',
      a: 'Yes. Redaction happens in your browser and the document is never uploaded, so the information you’re hiding never reaches a server.',
    },
    {
      q: 'Can the redacted information be recovered?',
      a: 'No. Each page with a box is replaced by a picture with the black boxes burned in, and that page’s original text, images and links are removed from the file.',
    },
    {
      q: 'What happens to pages I redact?',
      a: 'They become images, so their text can no longer be selected or searched, and the file may get larger. Pages without boxes are kept as they are.',
    },
    {
      q: 'Can it find and redact words automatically?',
      a: 'No. You draw each box yourself, so check every page before you share the result. Anything you don’t cover stays readable.',
    },
    {
      q: 'Is the document’s metadata removed?',
      a: 'Yes. The title, author and other document details are removed from the redacted file.',
    },
    {
      q: 'Is Redact PDF free?',
      a: 'It’s a Practice tool, and it’s free to use during early access.',
    },
  ],
  drawHint: 'Drag on the page to cover what must be hidden. Drag a box to move it, or its corner to resize it.',
  howItWorksHeading: 'What happens to your file',
  howItWorks: [
    'Each page with a box is turned into a picture, with the boxes burned in.',
    'The text, images and links on those pages are removed from the file, so nothing can be copied or uncovered.',
    'Text on those pages can no longer be selected or searched. Other pages are kept as they are.',
    'The document’s title, author and other details are removed too.',
  ],
  checkNote: 'Check every page before you share the result. Anything you don’t cover stays readable.',
  boxLabel: 'Redaction on page {page}',
  removeBox: 'Remove selected box',
  clearPage: 'Remove boxes on this page',
  summaryCount: {
    one: '{count} box',
    other: '{count} boxes',
  } as PluralForms,
  pagesAffected: {
    one: 'on {count} page',
    other: 'on {count} pages',
  } as PluralForms,
  noBoxes: 'Draw at least one box over what must be hidden.',
  action: 'Redact and download',
  outputSuffix: 'redacted',
  errors: {},
};
