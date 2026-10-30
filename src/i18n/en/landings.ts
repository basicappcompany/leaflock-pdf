/**
 * Page text for search landing pages: a tool under another name people search for,
 * sometimes with options preset. Only add one when the page is genuinely useful on its own.
 */
export const landings = {
  pngToPdf: {
    title: 'PNG to PDF',
    metaTitle: 'Convert PNG to PDF privately, in your browser | LeafLock PDF',
    metaDescription:
      'Turn PNG screenshots, diagrams and graphics into a PDF without uploading them. Transparent areas stay clean. Free, no sign-up.',
    summary: 'Turn PNG screenshots and graphics into a PDF, one image per page.',
    howTo: [
      'Choose your PNG files. You can mix in JPG, WebP and other images too.',
      'Put them in order, and choose page size and margins.',
      'Select Convert to PDF and download the result.',
    ],
    faq: [
      {
        q: 'Does converting PNG to PDF reduce quality?',
        a: 'No. PNG images are stored in the PDF without any loss, so sharp text and lines in screenshots stay sharp.',
      },
      {
        q: 'What happens to transparent parts of a PNG?',
        a: 'They show the white page behind them, as they would when printed.',
      },
      {
        q: 'Are my screenshots uploaded anywhere?',
        a: 'No. The conversion happens in your browser, so screenshots of private chats, invoices or dashboards stay on your device.',
      },
    ],
  },
  webpToPdf: {
    title: 'WebP to PDF',
    metaTitle: 'Convert WebP images to PDF privately | LeafLock PDF',
    metaDescription:
      'Convert WebP images saved from websites into a PDF, right in your browser. No upload, no account, no watermark.',
    summary: 'Turn WebP images saved from the web into a PDF.',
    howTo: [
      'Choose your WebP files. JPG, PNG and other images work too.',
      'Put them in order, and choose page size and margins.',
      'Select Convert to PDF and download the result.',
    ],
    faq: [
      {
        q: 'Why do images I save from websites end up as WebP?',
        a: 'Many websites serve WebP because the files are smaller. Most PDF tools and printers expect JPG or PNG, so converting to PDF makes them easy to share and print.',
      },
      {
        q: 'Do I need to convert WebP to JPG first?',
        a: 'No. Choose the WebP files directly; they are converted inside your browser as part of making the PDF.',
      },
      {
        q: 'Does it work with animated WebP?',
        a: 'Only the first frame of an animated image is used.',
      },
    ],
  },
  pdfToPng: {
    title: 'PDF to PNG',
    metaTitle: 'Convert PDF pages to PNG images privately | LeafLock PDF',
    metaDescription:
      'Save PDF pages as sharp PNG images, ideal for slides, documents and websites. Runs in your browser; nothing is uploaded.',
    summary: 'Save each page of a PDF as a sharp PNG image.',
    howTo: [
      'Choose a PDF.',
      'PNG is already selected. Pick a resolution and which pages to convert.',
      'Select Convert and download the images, one by one or as a ZIP.',
    ],
    faq: [
      {
        q: 'Should I choose PNG or JPG?',
        a: 'PNG keeps text and lines crisp and is best for documents, diagrams and slides. JPG makes smaller files and suits photos and scans.',
      },
      {
        q: 'What resolution should I use?',
        a: '150 dpi is fine for screens and most documents; choose 300 dpi if you will print the images or need to zoom in.',
      },
      {
        q: 'Is the PDF uploaded to convert it?',
        a: 'No. Each page is drawn in your browser and saved as an image on your device.',
      },
    ],
  },
  reversePages: {
    title: 'Reverse PDF pages',
    metaTitle: 'Reverse the page order of a PDF, privately | LeafLock PDF',
    metaDescription:
      'Flip a PDF so the last page comes first — useful for documents scanned back to front. Runs in your browser; nothing is uploaded.',
    summary: 'Flip a PDF so the last page comes first.',
    howTo: [
      'Choose a PDF. The pages appear already reversed.',
      'Check the order, and adjust any page by dragging if you need to.',
      'Select Save PDF and download the result.',
    ],
    faq: [
      {
        q: 'Why would I reverse a PDF?',
        a: 'Most often because a stack of paper went through a scanner or fax the wrong way round, so the document arrives back to front. Reversing it puts the pages in reading order without re-scanning anything.',
      },
      {
        q: 'Do I have to drag every page?',
        a: 'No. The whole document is reversed as soon as you open it. Dragging is there only if you want to adjust something afterwards.',
      },
      {
        q: 'Can I put it back?',
        a: 'Yes. Undo all changes restores the original order, and your own file is never modified either way.',
      },
      {
        q: 'Is my PDF uploaded to reverse it?',
        a: 'No. The pages are reordered in your browser on your device, so a scanned contract or medical record is never sent anywhere.',
      },
    ],
  },
  addBlankPage: {
    title: 'Add a blank page to a PDF',
    metaTitle: 'Add blank pages to a PDF, privately | LeafLock PDF',
    metaDescription:
      'Insert blank pages anywhere in a PDF — for printing, note-taking or double-sided layout. Free, no sign-up, nothing uploaded.',
    summary: 'Insert blank pages anywhere in a PDF.',
    howTo: [
      'Choose a PDF.',
      'Select Add blank page, then drag the new page where you want it.',
      'Select Save PDF and download the result.',
    ],
    faq: [
      {
        q: 'What size is the blank page?',
        a: 'The same size as the page before it, so it fits the document rather than standing out when printed.',
      },
      {
        q: 'Can I add more than one?',
        a: 'Yes. Add as many as you need and drag each one into place.',
      },
      {
        q: 'Why add a blank page at all?',
        a: 'Usually for printing: a blank page at the right spot keeps chapters starting on a right-hand page when printed double-sided. It is also useful as a cover sheet, or to leave room for notes or a signature.',
      },
      {
        q: 'Is my PDF uploaded?',
        a: 'No. The page is added in your browser on your device, and the file is never sent anywhere.',
      },
    ],
  },
};
