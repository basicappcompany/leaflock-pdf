import type { PluralForms } from '../../format';

export default {
  title: 'Fill PDF form',
  metaTitle: 'Fill in PDF forms online, privately | LeafLock PDF',
  metaDescription:
    'Fill in the fields of a PDF form, then save it as-is or lock the answers in. Nothing is uploaded.',
  summary: 'Type into a PDF form’s fields and save the filled-in copy.',
  howTo: [
    'Choose a PDF form.',
    'Fill in the fields listed on the page.',
    'Select Save PDF. Lock the answers in if you don’t want them changed.',
  ],
  faq: [
    {
      q: 'Are my form answers sent anywhere?',
      a: 'No. Your answers are written into the PDF by your browser on your device. Nothing you type is uploaded.',
    },
    {
      q: 'Why does it say the PDF has no fillable fields?',
      a: 'The PDF has no interactive form fields, which is common for scanned or printed forms. Use Edit PDF to type on top of the page instead.',
    },
    {
      q: 'What does locking the answers in do?',
      a: 'It turns the fields into ordinary page content, so the answers can no longer be changed in a PDF reader. Leave it off if you or someone else needs to edit them later.',
    },
    {
      q: 'Can I fill in dynamic (XFA) forms?',
      a: 'Forms that only exist as XFA can’t be filled here. If a form has a standard version as well, that version is filled and kept.',
    },
    {
      q: 'Can I type answers in other languages?',
      a: 'Yes. PDF readers show them, but answers that use characters outside the Latin alphabet can’t be locked in yet, so save those without locking.',
    },
    {
      q: 'Can I sign the form?',
      a: 'Signature fields can’t be filled here. Save the filled form, then use Sign PDF to place your signature on it.',
    },
  ],
  reading: 'Reading the form…',
  fieldCount: { one: 'This form has {count} field.', other: 'This form has {count} fields.' } as PluralForms,
  unsupported: {
    one: '{count} field (a button or digital signature) can’t be filled here.',
    other: '{count} fields (buttons or digital signatures) can’t be filled here.',
  } as PluralForms,
  xfaNote: 'This form also has a dynamic (XFA) version. Saving keeps the standard version, which every PDF reader shows.',
  readOnly: 'Read-only',
  fieldName: 'Field name: {name}',
  noChoice: 'No choice',
  yes: 'Yes',
  lockIn: 'Lock the answers in (they can’t be changed afterwards)',
  action: 'Save PDF',
  outputSuffix: 'filled',
  errors: {
    'no-fields': 'This PDF has no fillable fields. To write on it anyway, use Edit PDF.',
    'xfa-only':
      'This is a dynamic (XFA) form, which only Adobe Acrobat and Reader can fill. Open it there, or ask the sender for a standard PDF form.',
    'cannot-lock':
      'The answer in “{field}” uses characters we can’t lock in yet. Save without locking, or use Latin characters.',
  },
};
