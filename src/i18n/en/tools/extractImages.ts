import type { PluralForms } from '../../format';

export default {
  title: 'Extract images from PDF',
  metaTitle: 'Extract images from a PDF, privately | LeafLock PDF',
  metaDescription:
    'Pull every embedded photo or picture out of a PDF as its own JPEG or PNG file. Runs on your device, never uploaded. Free, no sign-up.',
  summary: 'Pull every embedded photo out of a PDF, as its own file.',
  howTo: ['Choose a PDF.', 'Select Extract images.', 'Download the images, individually or as a zip.'],
  faq: [
    {
      q: 'Is my PDF uploaded to extract its images?',
      a: 'No. Everything happens in your browser, on your device.',
    },
    {
      q: 'How is this different from PDF to JPG?',
      a: 'PDF to JPG renders each whole page as a picture, text and all. This pulls out just the photos and pictures a PDF already has embedded in it, leaving text as text — for when the PDF is a brochure, report or scanbook and you want the original images back out, not a screenshot of the page.',
    },
    {
      q: 'What image formats come out?',
      a: 'A JPEG-compressed image in the PDF comes out as a .jpg, unchanged — the exact same compressed bytes the PDF already stored, not a re-compression. A losslessly-stored image comes out as a .png.',
    },
    {
      q: 'Some images were not extracted. Why?',
      a: 'A handful of storage methods are not decoded here: CMYK and indexed-color images, 16-bit images, fax-compressed scans (CCITT) and JPEG2000. The result says how many were skipped rather than pretending everything came out.',
    },
  ],
  action: 'Extract images',
  extractedDone: {
    one: '{count} image extracted.',
    other: '{count} images extracted.',
  } as PluralForms,
  skippedDone: {
    one: '{count} image was in a format this tool does not decode, and was skipped.',
    other: '{count} images were in a format this tool does not decode, and were skipped.',
  } as PluralForms,
  errors: {
    'no-images': '{name} has no embedded images, or none of them are in a format this tool can extract.',
  },
};
