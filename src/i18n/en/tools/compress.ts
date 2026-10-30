import type { PluralForms } from '../../format';

export default {
  title: 'Compress PDF',
  metaTitle: 'Compress a PDF and reduce its file size, privately | LeafLock PDF',
  metaDescription:
    'Make PDFs smaller by shrinking images and tidying the file, in your browser. See the size before and after. No upload.',
  summary: 'Make a PDF smaller, mostly by shrinking the images inside it.',
  howTo: [
    'Choose a PDF.',
    'Pick how strongly to compress it.',
    'Select Compress PDF, check the new size and download it.',
  ],
  faq: [
    {
      q: 'Is my PDF uploaded to be compressed?',
      a: 'No. Compression runs in your browser, so your PDF stays on your device from start to finish.',
    },
    {
      q: 'How much smaller will my PDF get?',
      a: 'It depends on what’s inside. PDFs with many photos or scanned pages shrink the most; files that are mostly text are usually small already. You see the size before and after before you download.',
    },
    {
      q: 'Will the quality drop?',
      a: 'Text and drawings stay sharp at every level. Photos and scanned images are scaled down and saved as JPG, so they can look softer, most of all with Strong.',
    },
    {
      q: 'Which level should I choose?',
      a: 'Light for printing, Recommended for reading on screen, and Strong when the smallest file matters more than photo detail.',
    },
    {
      q: 'Why couldn’t my PDF be made smaller?',
      a: 'It’s probably well compressed already, or mostly text. The tool never hands you a bigger file; try Strong to shrink images further.',
    },
    {
      q: 'Is there a file size limit?',
      a: 'There’s no fixed limit. Large files depend on your device’s memory, because the compression happens there.',
    },
  ],
  levelLabel: 'Compression',
  levels: {
    light: 'Light',
    recommended: 'Recommended',
    strong: 'Strong',
  },
  levelHints: {
    light: 'Smallest change in quality. Good for printing.',
    recommended: 'Good quality for reading on screen, much smaller.',
    strong: 'Smallest file. Photos look softer.',
  },
  textNote: 'Text and drawings stay sharp at every level; only photos and scanned images are reduced.',
  action: 'Compress PDF',
  outputSuffix: 'compressed',
  saved: 'From {before} to {after}: {percent}% smaller.',
  imagesShrunk: { one: '{count} image made smaller.', other: '{count} images made smaller.' } as PluralForms,
  alreadySmall: 'This PDF is already well compressed. We couldn’t make it any smaller, so there’s nothing to download.',
  tryStronger: 'Try Strong compression to shrink images further.',
  errors: {},
};
