export default {
  title: 'Scan to PDF',
  metaTitle: 'Scan documents to PDF in your browser | LeafLock PDF',
  metaDescription:
    'Use your phone or laptop camera to scan paper documents into a PDF. Pictures stay on your device.',
  summary: 'Photograph paper documents with your camera and save them as a PDF.',
  howTo: [
    'Allow camera access, or take photos with your phone’s camera.',
    'Capture each page. Retake any that came out blurry.',
    'Select Save PDF and download the result.',
  ],
  faq: [
    {
      q: 'Are my scans uploaded?',
      a: 'No. The camera pictures are turned into a PDF by your browser on your device. They aren’t stored anywhere unless you download the PDF.',
    },
    {
      q: 'Do I need an app?',
      a: 'No. It works in a modern browser on a phone, tablet or laptop with a camera. Allow camera access when your browser asks.',
    },
    {
      q: 'What if the camera doesn’t start?',
      a: 'Check that camera access is allowed for this site in your browser’s settings. You can also use Take photos or choose images instead.',
    },
    {
      q: 'Can I retake a blurry page?',
      a: 'Yes. While the camera is on, select the retake button under the page, then capture it again. You can also reorder or remove pages before saving.',
    },
    {
      q: 'Does it straighten pages or make the text searchable?',
      a: 'No. Each picture is saved as it was taken, so lay the page flat and fill the frame with it. To make the text searchable, run the PDF through OCR PDF.',
    },
  ],
  startCamera: 'Start camera',
  stopCamera: 'Stop camera',
  starting: 'Starting the camera…',
  previewLabel: 'Camera preview',
  capture: 'Capture page',
  replace: 'Replace page {number}',
  retake: 'Retake page {number}',
  retaking: 'Capture again to replace page {number}.',
  cancelRetake: 'Cancel retake',
  tip: 'Lay the page flat in good light and fill the frame with it.',
  denied: 'Camera access is blocked. Allow it in your browser’s site settings, or take photos instead.',
  noCamera: 'No camera was found. Take photos with your phone’s camera, or choose images.',
  cameraFailed: 'The camera couldn’t start. Take photos or choose images instead.',
  photosInstead: 'Take photos or choose images',
  pageSizeLabel: 'Page size',
  pageSizes: { fit: 'Same as photo', a4: 'A4', letter: 'US Letter' },
  marginLabel: 'Margin',
  margins: { none: 'None', small: 'Small', large: 'Large' },
  needPage: 'Capture at least one page.',
  action: 'Save PDF',
  outputName: 'scan.pdf',
  errors: {
    unreadableImage: '{name} could not be read. It may be damaged.',
    unsupportedImage: '{name} is in a format this browser can’t open. Save it as JPG or PNG, then try again.',
  },
};
