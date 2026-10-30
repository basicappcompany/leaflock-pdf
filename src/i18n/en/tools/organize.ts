export default {
  title: 'Organize PDF',
  metaTitle: 'Reorder, rotate and delete PDF pages, privately | LeafLock PDF',
  metaDescription:
    'Rearrange PDF pages by dragging, rotate or delete them, and add blank pages. Runs entirely in your browser.',
  summary: 'Reorder, rotate, delete and add pages, all in one view.',
  howTo: [
    'Choose one or more PDFs.',
    'Drag pages into order, and rotate or remove the ones you need to.',
    'Select Save PDF and download the result.',
  ],
  faq: [
    {
      q: 'Are my pages uploaded while I rearrange them?',
      a: 'No. The page previews and the final PDF are both made in your browser, so your files stay on your device the whole time.',
    },
    {
      q: 'Can I combine pages from several PDFs?',
      a: 'Yes. Add more than one PDF and all their pages appear together, so you can mix and reorder them and save one file.',
    },
    {
      q: 'Can I reorder pages on a phone or tablet?',
      a: 'Yes. If dragging doesn’t work on your touch screen, use the arrow buttons under each page to move it earlier or later.',
    },
    {
      q: 'Can I undo my changes?',
      a: 'Yes. A removed page can be restored with the button under it, and Undo all changes puts every page back the way it was when you added the files.',
    },
    {
      q: 'Can I add blank pages?',
      a: 'Yes. Add blank page adds one at the end, the same size as the last page. Then move it wherever you need it.',
    },
    {
      q: 'Will the quality change?',
      a: 'No. Pages are copied as they are, and rotating only changes their orientation, so nothing is recompressed.',
    },
  ],
  instructions: 'Drag pages to reorder them, or use the buttons under each page.',
  pageFromFile: '{name}, page {number}',
  blankPage: 'Blank page',
  addBlank: 'Add blank page',
  reverse: 'Reverse order',
  reset: 'Undo all changes',
  removeBlank: 'Remove blank page',
  loadingFile: 'Opening {name}…',
  noPagesLeft: 'Every page is removed. Restore at least one to save.',
  action: 'Save PDF',
  outputName: 'organized.pdf',
  errors: {},
};
