import type { PluralForms } from '../../format';

export default {
  title: 'Remove PDF annotations',
  metaTitle: 'Remove comments and highlights from a PDF | LeafLock PDF',
  metaDescription:
    'Delete comments, highlights, stamps and drawings from a PDF. Form fields and links are kept. Runs on your device; nothing is uploaded.',
  summary: 'Delete comments, highlights, stamps and drawings from a PDF.',
  howTo: [
    'Choose a PDF with comments or markup.',
    'Decide whether to remove links too.',
    'Select Remove annotations, then download the clean copy.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded when I remove its annotations?',
      a: 'No. The file is read and rewritten in your browser on your device, and never sent anywhere.',
    },
    {
      q: 'What exactly is removed?',
      a: 'Comments and sticky notes, highlights, underlines and strikethroughs, stamps, shapes, freehand drawings and text boxes, together with the pop-up notes attached to them.',
    },
    {
      q: 'What is kept?',
      a: 'Form fields are always kept, because emptying a form is a different job — use Flatten PDF for that. Links are kept unless you ask for them to go, since a link is navigation rather than markup.',
    },
    {
      q: 'How is this different from flattening?',
      a: 'Flattening paints comments and highlights into the page so they stay visible but can no longer be edited. This removes them, so they are gone from the page entirely.',
    },
    {
      q: 'Is the comment text really gone from the file?',
      a: 'Yes. The clean copy is written from scratch and anything no longer referenced is dropped, so the comment text and its drawn appearance leave the file rather than lingering where a reader could still find them.',
    },
    {
      q: 'Will the file get smaller?',
      a: 'Usually, and sometimes by a lot. A heavily marked-up document carries a drawn appearance for every comment, and those go too.',
    },
  ],
  links: 'Also remove links',
  linksHint: 'Clickable links are kept by default, because a link is navigation rather than markup.',
  action: 'Remove annotations',
  outputSuffix: 'no-comments',
  annotationsDone: { one: '{count} annotation removed.', other: '{count} annotations removed.' } as PluralForms,
  linksDone: { one: '{count} link removed.', other: '{count} links removed.' } as PluralForms,
  pagesDone: { one: 'Cleaned {count} page.', other: 'Cleaned {count} pages.' } as PluralForms,
  errors: {
    'no-annotations': '{name} has no comments, highlights or drawings to remove.',
  },
};
