export default {
  title: 'Merge PDF',
  metaTitle: 'Merge PDF files privately, in your browser | LeafLock PDF',
  metaDescription:
    'Combine PDF files into one document without uploading them. Free, fast and private: everything runs on your device.',
  summary: 'Combine several PDFs into one, in the order you choose.',
  howTo: [
    'Choose the PDF files you want to combine.',
    'Put them in order with the arrow buttons.',
    'Select Merge PDFs and download the result.',
  ],
  faq: [
    {
      q: 'Is it safe to merge PDFs here?',
      a: 'Yes. Your files are combined by your own browser, on your device, and are never uploaded. The page is also blocked from sending them anywhere.',
    },
    {
      q: 'Can I merge PDFs on my phone?',
      a: 'Yes. It works in any modern browser on phones, tablets and computers. There’s nothing to install and no account to create.',
    },
    {
      q: 'Is there a limit on file size or the number of files?',
      a: 'There’s no fixed limit. Because the merging happens on your device, the practical limit is how much memory it has, so very large files go more smoothly on a computer.',
    },
    {
      q: 'Will the quality change?',
      a: 'No. Pages are copied as they are, without converting or recompressing anything, so text and images look exactly as before.',
    },
    {
      q: 'Are bookmarks kept?',
      a: 'Yes. Each file’s bookmarks are carried over into the merged PDF, nested and in order, and point at the right pages in the new document. A small number of unusual bookmark types — ones that jump to another document, for instance — aren’t supported yet and are dropped.',
    },
    {
      q: 'Can I merge password-protected PDFs?',
      a: 'If a file needs a password to open, remove it with Unlock PDF first, then merge. Files that only restrict printing or editing can be merged as they are.',
    },
  ],
  needTwo: 'Add at least two PDFs to merge.',
  action: 'Merge PDFs',
  outputName: 'merged.pdf',
};
