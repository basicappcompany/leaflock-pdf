export default {
  title: 'Crop PDF',
  metaTitle: 'Crop PDF pages and trim margins, privately | LeafLock PDF',
  metaDescription:
    'Trim the margins of PDF pages by dragging a crop box. Apply it to every page or a few. Nothing is uploaded.',
  summary: 'Trim margins or cut pages down to the part you need.',
  howTo: [
    'Choose a PDF.',
    'Drag the edges of the crop box on the preview.',
    'Choose which pages to crop and download the result.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded when I crop it?',
      a: 'No. Cropping is done by your browser on your device, and the file never leaves it.',
    },
    {
      q: 'Does cropping delete what’s outside the box?',
      a: 'No. It hides it: the content is still in the file, and other PDF software can show it again. To remove sensitive information for good, use Redact PDF.',
    },
    {
      q: 'Can I crop only some pages?',
      a: 'Yes. Apply the crop to all pages, to the page you’re looking at, or to pages you choose by number.',
    },
    {
      q: 'Can I set exact margins?',
      a: 'Yes. Drag the box on the preview, or type how much to trim from each side as a percentage of the page. The same margins are used on every page you choose.',
    },
    {
      q: 'Will cropping make the file smaller?',
      a: 'No. Because the hidden content stays in the file, its size stays about the same. To make it smaller, use Compress PDF.',
    },
  ],
  instructions: 'Drag the box or its handles. Arrow keys move a focused handle; hold Shift for bigger steps.',
  cropArea: 'Crop area',
  handles: {
    move: 'Move crop area',
    top: 'Top edge',
    bottom: 'Bottom edge',
    left: 'Left edge',
    right: 'Right edge',
    topLeft: 'Top-left corner',
    topRight: 'Top-right corner',
    bottomLeft: 'Bottom-left corner',
    bottomRight: 'Bottom-right corner',
  },
  marginsHeading: 'Margins to trim',
  margins: {
    top: 'Top (%)',
    right: 'Right (%)',
    bottom: 'Bottom (%)',
    left: 'Left (%)',
  },
  applyLabel: 'Apply to',
  apply: {
    all: 'All pages',
    current: 'This page only',
    custom: 'Chosen pages',
  },
  reset: 'Reset crop',
  nothingToCrop: 'Move an edge of the crop box to trim the page.',
  note: 'Cropping hides what’s outside the box. It doesn’t delete it, so don’t use it to remove sensitive content; use Redact PDF instead.',
  action: 'Crop PDF',
  outputSuffix: 'cropped',
  errors: {},
};
