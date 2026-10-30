import type { PluralForms } from '../../format';

export default {
  title: 'JPG to PDF',
  metaTitle: 'Convert JPG, PNG and other images to PDF, privately | LeafLock PDF',
  metaDescription:
    'Turn photos and images (JPG, PNG, WebP and more) into a PDF in your browser. Choose page size and margins. No upload.',
  summary: 'Turn photos and images into a PDF, one image per page.',
  howTo: [
    'Choose your images. JPG, PNG, WebP, GIF and BMP all work.',
    'Put them in order, and choose page size and margins.',
    'Select Convert to PDF and download the result.',
  ],
  faq: [
    {
      q: 'Are my photos uploaded?',
      a: 'No. Your images are turned into a PDF by your browser, so they never leave your device.',
    },
    {
      q: 'Which image formats can I use?',
      a: 'JPG, PNG, WebP, GIF and BMP, plus other formats your browser can open. If an image won’t open, save it as JPG or PNG and try again.',
    },
    {
      q: 'Will the image quality drop?',
      a: 'JPG and PNG images go into the PDF unchanged. Other formats are converted to JPG or PNG first, which can change them very slightly.',
    },
    {
      q: 'What page size will the PDF have?',
      a: 'By default each page takes the size and shape of its image. You can also choose A4 or US Letter, with each image scaled to fit and an optional margin.',
    },
    {
      q: 'Will phone photos come out the right way up?',
      a: 'Yes. The tool follows the orientation your camera saved with the photo, so sideways pictures are turned upright.',
    },
    {
      q: 'Is there a limit on how many images I can add?',
      a: 'There’s no fixed limit. The practical limit is your device’s memory, since every image is processed there.',
    },
  ],
  imageCount: { one: '{count} image', other: '{count} images' } as PluralForms,
  instructions: 'Drag images to reorder them, or use the arrows.',
  pageSizeLabel: 'Page size',
  pageSizes: { fit: 'Same as image', a4: 'A4', letter: 'US Letter' },
  orientationLabel: 'Orientation',
  orientations: { auto: 'Automatic', portrait: 'Portrait', landscape: 'Landscape' },
  orientationFitHint: 'With “Same as image”, each page takes the shape of its image.',
  marginLabel: 'Margin',
  margins: { none: 'None', small: 'Small', large: 'Large' },
  action: 'Convert to PDF',
  outputName: 'images.pdf',
  errors: {
    unreadableImage: '{name} could not be read. It may be damaged.',
    unsupportedImage: '{name} is in a format this browser can’t open. Save it as JPG or PNG, then try again.',
  },
};
