export default {
  title: 'PDF to JPG',
  metaTitle: 'Convert PDF pages to JPG or PNG images, privately | LeafLock PDF',
  metaDescription:
    'Save every page of a PDF as a high-quality JPG or PNG image, right in your browser. No upload and no watermark.',
  summary: 'Save each page of a PDF as a JPG or PNG image.',
  howTo: [
    'Choose a PDF.',
    'Pick JPG or PNG and the image quality.',
    'Select Convert and download the images, one by one or as a ZIP.',
  ],
  faq: [
    {
      q: 'Is it safe to convert a PDF to JPG here?',
      a: 'Yes. Each page is drawn as an image by your browser on your device. Your PDF isn’t sent anywhere.',
    },
    {
      q: 'Should I choose JPG or PNG?',
      a: 'JPG makes smaller files and suits photos and scans. PNG keeps text and lines sharper, but the files are larger.',
    },
    {
      q: 'What resolution are the images?',
      a: 'You can choose 72 dpi for screens, 150 dpi as a standard, or 300 dpi for print. Very large pages may come out at a lower resolution to stay within browser limits.',
    },
    {
      q: 'Can I convert only some pages?',
      a: 'Yes. Choose Chosen pages and type the page numbers, for example 1-3, 5.',
    },
    {
      q: 'How do I download all the images?',
      a: 'Each page becomes its own image file. Select Download all as ZIP to get them in one archive.',
    },
    {
      q: 'Is there a page or file size limit?',
      a: 'There’s no fixed limit, but every image is made in your device’s memory. If a long document at 300 dpi is too much, convert fewer pages at a time.',
    },
  ],
  formatLabel: 'Image format',
  formats: { jpg: 'JPG', png: 'PNG' },
  formatHints: {
    jpg: 'Smaller files. Best for photos and scans.',
    png: 'Sharper text and lines, larger files.',
  },
  resolutionLabel: 'Resolution',
  resolutions: { screen: 'Screen (72 dpi)', standard: 'Standard (150 dpi)', print: 'Print (300 dpi)' },
  pagesLabel: 'Pages',
  pagesMode: { all: 'All pages', custom: 'Chosen pages' },
  rendering: 'Converting page {number} of {count}…',
  action: 'Convert to images',
  errors: {},
};
