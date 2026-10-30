import type { PluralForms } from '../../format';

export default {
  title: 'Sign PDF',
  metaTitle: 'Sign a PDF online, privately and for free | LeafLock PDF',
  metaDescription:
    'Draw, type or upload your signature and place it on a PDF. Your document and signature never leave your device.',
  summary: 'Draw, type or upload your signature and place it on the page.',
  howTo: [
    'Choose a PDF.',
    'Create your signature by drawing, typing or uploading an image.',
    'Drag it into place, resize it, then download the signed PDF.',
  ],
  faq: [
    {
      q: 'Is my signature stored or uploaded?',
      a: 'No. Your signature and your document stay in your browser. The signature is kept only while this page is open and is never saved or sent anywhere.',
    },
    {
      q: 'How can I create my signature?',
      a: 'Draw it with a mouse, finger or pen, type your name and pick a handwriting style, or upload a photo or scan of your signature. For an upload, you can make the white background transparent.',
    },
    {
      q: 'Is this a legally binding signature?',
      a: 'The tool places an image of your signature on the page, like signing a printout. It doesn’t add a certificate-based digital signature, so check what the person asking for your signature accepts.',
    },
    {
      q: 'Can I sign on several pages, or add the date?',
      a: 'Yes. Go to each page and select Add to this page. Add today’s date places the date as text you can move like the signature.',
    },
    {
      q: 'Can I sign on my phone?',
      a: 'Yes. Draw your signature with your finger in a mobile browser. There’s no app to install.',
    },
  ],
  createHeading: 'Create your signature',
  methodLabel: 'How to sign',
  methods: { draw: 'Draw', type: 'Type', upload: 'Upload' },
  drawHint: 'Sign in the box with your mouse, finger or pen.',
  padLabel: 'Signature drawing area',
  clear: 'Clear',
  inkLabel: 'Ink',
  inks: { black: 'Black', blue: 'Blue', red: 'Red' },
  nameLabel: 'Your name',
  styleLabel: 'Style',
  styleOption: 'Style {number}',
  uploadHint: 'A photo or scan of your signature on white paper, as PNG or JPG.',
  chooseImage: 'Choose an image',
  removeBackground: 'Make the white background transparent',
  useSignature: 'Use this signature',
  emptySignature: 'Draw, type or upload a signature first.',
  yourSignature: 'Your signature',
  signatureImage: 'Your signature',
  placeOnPage: 'Add to this page',
  newSignature: 'Create a different signature',
  addDate: 'Add today’s date',
  placeHint: 'Drag a signature to move it, and drag its corner to resize it. Arrow keys move the selected item; Delete removes it.',
  itemLabel: { signature: 'Signature on page {page}', date: 'Date on page {page}' },
  removeItem: 'Remove selected item',
  placedCount: { one: '{count} item placed', other: '{count} items placed' } as PluralForms,
  memoryNote: 'Your signature is only kept while this page is open. It’s never stored or sent anywhere.',
  action: 'Sign and download',
  outputSuffix: 'signed',
  errors: {
    'nothing-placed': 'Add your signature to a page first.',
  },
};
