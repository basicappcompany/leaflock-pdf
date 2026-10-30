import type { PluralForms } from '../../format';

export default {
  title: 'Flatten PDF',
  metaTitle: 'Flatten PDF form fields, privately | LeafLock PDF',
  metaDescription:
    'Turn fillable form fields into ordinary page content so answers can’t be changed. Free and private.',
  summary: 'Turn fillable fields into ordinary content so they can’t be changed.',
  howTo: [
    'Choose a PDF with form fields.',
    'Select Flatten PDF.',
    'Download the flattened copy.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded when I flatten it?',
      a: 'No. Flattening happens in your browser on your device, and the file is never sent anywhere.',
    },
    {
      q: 'What does flattening do?',
      a: 'It turns form fields into ordinary page content, so the answers stay visible but can’t be edited. By default, comments, highlights, stamps and drawings are flattened too.',
    },
    {
      q: 'What happens to links and comments?',
      a: 'Links keep working. Comment pop-up notes are removed, since their text can’t be shown on the page.',
    },
    {
      q: 'Can I undo flattening?',
      a: 'Not in the flattened copy. Your original file isn’t changed, so keep it if you may need to edit the fields again.',
    },
    {
      q: 'Does flattening remove sensitive information?',
      a: 'No. The content stays in the file as ordinary text and images. To remove information for good, use Redact PDF.',
    },
    {
      q: 'My form isn’t filled in yet. What should I do?',
      a: 'Fill it in with Fill PDF form first. That tool can also lock the answers in when you save.',
    },
  ],
  annotations: 'Also flatten comments, highlights, stamps and drawings',
  annotationsHint: 'Links keep working. Comment pop-up notes are removed, since their text can’t be shown on the page.',
  action: 'Flatten PDF',
  outputSuffix: 'flattened',
  fieldsDone: { one: '{count} form field flattened.', other: '{count} form fields flattened.' } as PluralForms,
  annotationsDone: { one: '{count} annotation flattened.', other: '{count} annotations flattened.' } as PluralForms,
  errors: {
    'nothing-to-flatten': '{name} has no form fields or annotations to flatten.',
  },
};
