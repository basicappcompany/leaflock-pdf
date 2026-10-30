import type { PluralForms } from '../../format';

export default {
  title: 'OCR PDF',
  metaTitle: 'Make scanned PDFs searchable with OCR, privately | LeafLock PDF',
  metaDescription:
    'Recognize text in scanned PDFs and images, and make them searchable and copyable. OCR runs on your device, not on a server.',
  summary: 'Recognize text in scans so you can search, select and copy it.',
  howTo: [
    'Choose a scanned PDF or image.',
    'Select Recognize text. The first time, your browser loads the English text model (about 10 MB) from this site.',
    'Download the searchable PDF, or copy the recognized text.',
  ],
  faq: [
    {
      q: 'Is OCR done on a server?',
      a: 'No. Text recognition runs in your browser, on your device. The first time, your browser loads the English text model (about 10 MB) from this site; your pages are never uploaded.',
    },
    {
      q: 'Which languages does it recognize?',
      a: 'English only for now. Text in other languages may be recognized poorly or not at all.',
    },
    {
      q: 'Will my PDF look different?',
      a: 'No. The recognized text is laid invisibly over each page, so the pages look the same, but you can now search, select and copy the text.',
    },
    {
      q: 'Can I use photos or scanned images instead of a PDF?',
      a: 'Yes. Select Choose images under the file picker. The images are combined into one searchable PDF.',
    },
    {
      q: 'How accurate is it?',
      a: 'It depends on the scan. Clear, upright pages in good light give the best results, so check important text before you rely on it.',
    },
    {
      q: 'Why does it take a while?',
      a: 'Each page is recognized on your own device, so the speed depends on its processor. Long documents take longer, and you can follow the progress page by page.',
    },
  ],
  englishOnly: 'Recognizes English text. More languages are coming.',
  imagesInstead: 'Have photos or scanned images instead?',
  chooseImages: 'Choose images',
  backToPdf: 'Choose a PDF instead',
  imageCount: { one: '{count} image', other: '{count} images' } as PluralForms,
  alreadyHasText: 'This PDF already has selectable text. OCR is meant for scans and photos, but you can still run it.',
  stages: {
    model: 'Loading the text model…',
    preparing: 'Preparing the pages…',
    recognizing: 'Recognizing text on page {number} of {count}…',
    building: 'Building the searchable PDF…',
  },
  action: 'Recognize text',
  resultTextLabel: 'Recognized text',
  copy: 'Copy text',
  copied: 'Copied',
  copyFailed: 'Your browser blocked copying. Select the text and copy it yourself.',
  noTextFound: 'No text was recognized. Check that the scan is upright, in focus and in English.',
  outputSuffix: 'searchable',
  imagesOutputName: 'scan-searchable.pdf',
  errors: {
    unreadableImage: '{name} could not be read. It may be damaged.',
    unsupportedImage: '{name} is in a format this browser can’t open. Save it as JPG or PNG, then try again.',
    ocrUnavailable: 'Text recognition couldn’t start in this browser. Reload the page and try again.',
  },
};
