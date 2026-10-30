import type { PluralForms } from '../../format';

export default {
  title: 'Convert PDF to PDF/A',
  metaTitle: 'Convert a PDF to PDF/A-2b privately | LeafLock PDF',
  metaDescription:
    'Add the colour profile and PDF/A identification an archive or compliance system checks for, in your browser. Free, no sign-up, no upload.',
  summary: 'Prepare a PDF for long-term archiving: PDF/A-2b profile and metadata, added on your device.',
  howTo: ['Choose a PDF.', 'Select Convert to PDF/A.', 'Download the result.'],
  faq: [
    {
      q: 'Is my document uploaded to convert it?',
      a: 'No. Everything happens in your browser, on your device.',
    },
    {
      q: 'What does this actually do?',
      a: 'It embeds a colour profile (an ICC output intent) and writes the PDF/A-2b identification into the file’s metadata, and removes what PDF/A forbids outright: JavaScript, actions that run on open, and embedded files.',
    },
    {
      q: 'Does this guarantee the file passes PDF/A validation?',
      a: 'No, and no tool can honestly promise that for an arbitrary existing PDF. The one requirement this can’t fix is font embedding: PDF/A requires every font actually be embedded in the file, and if your PDF already references a font it never embedded, this tool reports that rather than silently claiming conformance. Check the result for a list of any such fonts.',
    },
    {
      q: 'My PDF is password-protected. Can I still convert it?',
      a: 'Unlock it first. PDF/A forbids encryption of any kind, including a restriction-only password that normally opens without being asked for one.',
    },
    {
      q: 'Why PDF/A-2b and not PDF/A-1b or PDF/A-3?',
      a: 'PDF/A-2b is the level most archive and compliance intake systems expect, and it allows things (transparency, JPEG2000) that PDF/A-1b rejects in real-world files. “b” means basic visual reproducibility, not the stricter “a” level, which also requires the document’s structure to be fully tagged.',
    },
  ],
  action: 'Convert to PDF/A',
  outputSuffix: 'pdfa',
  activeContentDone: {
    one: '{count} disallowed item removed (JavaScript, an open action, or an embedded file).',
    other: '{count} disallowed items removed (JavaScript, open actions, or embedded files).',
  } as PluralForms,
  nonEmbeddedFontsWarning: 'Not fully PDF/A-conformant: this font is referenced but not embedded — {fonts}.',
  nonEmbeddedFontsWarningPlural: 'Not fully PDF/A-conformant: these fonts are referenced but not embedded — {fonts}.',
  allFontsEmbedded: 'Every font in this document is embedded.',
  errors: {},
};
