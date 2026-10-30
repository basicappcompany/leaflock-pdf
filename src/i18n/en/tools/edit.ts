import type { PluralForms } from '../../format';

export default {
  title: 'Edit PDF',
  metaTitle: 'Edit a PDF: add text, images and shapes, privately | LeafLock PDF',
  metaDescription:
    'Add text, images, shapes and highlights to a PDF, or white out mistakes. Edit in your browser without uploading.',
  summary: 'Add text, images, shapes and highlights, or white out mistakes.',
  howTo: [
    'Choose a PDF.',
    'Pick a tool, then click on the page to add text, an image or a shape.',
    'Select Save PDF and download the result.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded when I edit it?',
      a: 'No. All the editing happens in your browser, so the file stays on your device.',
    },
    {
      q: 'Can I change the text that’s already in the PDF?',
      a: 'No. Edit PDF adds new content on top of the page. To replace a word, cover it with White-out and type the new text over it.',
    },
    {
      q: 'Does White-out remove the text underneath?',
      a: 'No. It covers the text with a white box, but the original is still in the file and can be copied or found by search. To remove information for good, use Redact PDF.',
    },
    {
      q: 'What can I add?',
      a: 'Text, images, rectangles, highlights and white-out boxes, on any page. Select an item to move, resize, restyle or remove it.',
    },
    {
      q: 'Which fonts can I use for text?',
      a: 'Text is added in a standard sans-serif font, in the size and color you choose. Text in other alphabets, such as Cyrillic or Chinese, is added as an image, so it shows correctly but can’t be selected or searched.',
    },
    {
      q: 'Can I undo a change?',
      a: 'Before you save, you can select any item and remove it. Saving makes a new copy, so your original file stays unchanged.',
    },
  ],
  honesty:
    'This adds new content on top of the page. It can’t change text that’s already in the PDF, but White-out can cover it so you can type over it. Covered text can still be copied or found by search, so use Redact PDF to remove anything confidential.',
  toolLabel: 'Tool',
  tools: {
    select: 'Select',
    text: 'Text',
    image: 'Image',
    rect: 'Rectangle',
    highlight: 'Highlight',
    whiteout: 'White-out',
  },
  toolHints: {
    select: 'Select an item to change it. Drag to move, drag the corner to resize.',
    text: 'Click on the page where the text should start.',
    image: 'Choose an image, then drag it into place.',
    rect: 'Drag on the page to draw a rectangle.',
    highlight: 'Drag over the text you want to highlight.',
    whiteout: 'Drag over what you want to cover with white.',
  },
  chooseImage: 'Choose an image',
  defaultText: 'Type here',
  propertiesHeading: 'Selected item',
  textLabel: 'Text to add',
  sizeLabel: 'Text size',
  colorLabel: 'Color',
  strokeLabel: 'Border color',
  strokeWidthLabel: 'Border width',
  fillLabel: 'Fill',
  noFill: 'No fill',
  fillColorLabel: 'Fill color',
  highlightColors: { yellow: 'Yellow', green: 'Green', pink: 'Pink', blue: 'Blue' },
  remove: 'Remove item',
  itemLabel: {
    text: 'Text on page {page}: {text}',
    image: 'Image on page {page}',
    rect: 'Rectangle on page {page}',
    highlight: 'Highlight on page {page}',
    whiteout: 'White-out on page {page}',
  },
  editCount: { one: '{count} change', other: '{count} changes' } as PluralForms,
  noEdits: 'Add something to the page first.',
  action: 'Save PDF',
  outputSuffix: 'edited',
  errors: {
    'nothing-placed': 'Add something to the page first.',
    'bad-image': 'That image couldn’t be read. Try a PNG or JPG file.',
  },
};
