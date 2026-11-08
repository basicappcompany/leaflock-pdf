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
  combinePdf: {
    title: 'Combine PDF files',
    metaTitle: 'Combine PDF files into one, privately | LeafLock PDF',
    metaDescription:
      'Combine several PDFs into a single file in the order you choose. It runs in your browser, so nothing is uploaded. No watermark, no sign-up.',
    summary: 'Combine several PDFs into one file, in the order you choose.',
    howTo: [
      'Choose the PDF files you want to combine, two or more.',
      'Put them in order with the arrow buttons.',
      'Select Merge PDFs and download the combined file.',
    ],
    faq: [
      {
        q: 'Is combining PDFs the same as merging them?',
        a: 'Yes. Combine and merge are two names for the same thing: the pages of each file are joined, in your order, into one new PDF.',
      },
      {
        q: 'Can I combine a PDF with a photo or a Word document?',
        a: 'Not in this step, which takes PDFs. Turn a photo into a PDF with JPG to PDF, or a Word file with Word to PDF, then combine the results.',
      },
      {
        q: 'Can I combine only some pages of each file?',
        a: 'Yes, with Organize PDF: add all the files, remove the pages you do not want, drag the rest into order and save one file.',
      },
      {
        q: 'Will quality and bookmarks survive?',
        a: 'Pages are copied without recompressing, so text and images look exactly as before. Bookmarks carry over, nested and in order. A few unusual kinds, such as ones that jump to another document, are dropped.',
      },
      {
        q: 'Are my files uploaded to be combined?',
        a: 'No. Your browser joins them on your device, so contracts or ID scans never leave it.',
      },
    ],
  },
  deletePdfPages: {
    title: 'Delete pages from a PDF',
    metaTitle: 'Delete pages from a PDF, privately | LeafLock PDF',
    metaDescription:
      'Delete the pages you do not need from a PDF by clicking them or typing page numbers. It runs in your browser, nothing is uploaded, and there is no watermark.',
    summary: 'Delete the pages you do not need from a PDF.',
    howTo: [
      'Choose a PDF.',
      'Click the pages to delete, or type their numbers and ranges such as 1-3, 5, 8-.',
      'Select Remove pages and download the new PDF.',
    ],
    faq: [
      {
        q: 'Is it quicker to delete pages or to extract the ones I want?',
        a: 'If you are removing a few pages, delete them here. If you only want to keep a few, Extract pages is quicker.',
      },
      {
        q: 'How do I delete the last pages without counting them?',
        a: 'Type an open range such as 8-, which means page 8 to the end.',
      },
      {
        q: 'Will my original file change?',
        a: 'No. You download a new copy without those pages, so keep the original if you might need them again.',
      },
      {
        q: 'Can I delete every page?',
        a: 'No. At least one page has to stay.',
      },
      {
        q: 'Is this the way to hide sensitive text?',
        a: 'Deleting removes a whole page. To black out only part of a page, use Redact PDF instead.',
      },
    ],
  },
  pdfPasswordRemover: {
    title: 'PDF password remover',
    metaTitle: 'Remove a password from a PDF you own, privately | LeafLock PDF',
    metaDescription:
      'Remove the password from a PDF you are allowed to open. The password and the file stay in your browser; nothing is uploaded.',
    summary: 'Remove the password from a PDF you are allowed to open.',
    howTo: [
      'Choose the password-protected PDF.',
      'Type its password.',
      'Select Unlock PDF and download a copy without the password.',
    ],
    faq: [
      {
        q: 'Can it remove a password I have forgotten?',
        a: 'No. If the PDF needs a password to open, you need that password. This tool cannot guess or crack it. It is for taking the password off a file you can already open.',
      },
      {
        q: 'What if the PDF only blocks printing or copying?',
        a: 'A PDF that opens freely but limits printing, copying or editing can be unlocked without typing anything.',
      },
      {
        q: 'Is it safe to type a password into a website?',
        a: 'Here, yes. The password is only used by your browser to decrypt the file on your device, and neither the password nor the PDF is uploaded.',
      },
      {
        q: 'Does the content change?',
        a: 'No. You get a copy with the same pages, text and images, without the password.',
      },
      {
        q: 'Is it legal to unlock a PDF?',
        a: 'Only unlock files you own or have permission to change.',
      },
    ],
  },
  rearrangePdfPages: {
    title: 'Rearrange PDF pages',
    metaTitle: 'Rearrange, reorder and rotate PDF pages privately | LeafLock PDF',
    metaDescription:
      'Drag PDF pages into a new order, rotate or remove pages, even mix pages from several files. It runs in your browser, so nothing is uploaded.',
    summary: 'Drag the pages of a PDF into a new order, and rotate or remove the ones you need to.',
    howTo: [
      'Choose one or more PDFs.',
      'Drag pages into order, and rotate or remove the ones you need to.',
      'Select Save PDF and download the result.',
    ],
    faq: [
      {
        q: 'Can I rearrange pages on a phone or tablet?',
        a: 'Yes. If dragging does not work on your touch screen, use the arrow buttons under each page to move it earlier or later.',
      },
      {
        q: 'Can I mix pages from different PDFs?',
        a: 'Yes. Add more than one PDF and all their pages appear together, so you can mix and reorder them and save one file.',
      },
      {
        q: 'Can I undo a mistake?',
        a: 'Yes. A removed page can be restored with the button under it, and Undo all changes puts every page back the way it was when you added the files.',
      },
      {
        q: 'Does rearranging change the quality?',
        a: 'No. Pages are copied as they are, and rotating only changes their orientation, so nothing is recompressed.',
      },
      {
        q: 'Are my pages uploaded while I rearrange them?',
        a: 'No. The page previews and the final PDF are both made in your browser, so your files stay on your device the whole time.',
      },
    ],
  },
  reducePdfSize: {
    title: 'Reduce PDF size',
    metaTitle: 'Reduce PDF file size without uploading it | LeafLock PDF',
    metaDescription:
      'Make a PDF smaller by shrinking the images inside it. You see the size before and after, and nothing is uploaded. Free, no watermark.',
    summary: 'Make a PDF smaller, mostly by shrinking the images inside it.',
    howTo: [
      'Choose a PDF.',
      'Pick how strongly to compress it, or enter a size to reach.',
      'Select Compress PDF, check the new size and download it.',
    ],
    faq: [
      {
        q: 'Can I choose the exact size I want?',
        a: 'Yes, as long as it is within reach. Choose To a size and enter it, for example 200 KB. We use the gentlest settings that get under it. If the file cannot get that small, you get the smallest we could make it, and we say so.',
      },
      {
        q: 'What shrinks the most?',
        a: 'PDFs full of photos or scanned pages. A file that is mostly text is usually small already.',
      },
      {
        q: 'Does the text get blurry?',
        a: 'No. Text and drawings stay sharp at every level. Photos and scans are scaled down and saved as JPG, so they can look softer, most of all with Strong.',
      },
      {
        q: 'Why did my PDF not get smaller?',
        a: 'It is probably well compressed already, or mostly text. The tool never hands you a bigger file; try Strong to shrink images further.',
      },
      {
        q: 'Is my PDF uploaded to be compressed?',
        a: 'No. Compression runs in your browser, so your PDF stays on your device from start to finish.',
      },
    ],
  },
  compressPdfTo200kb: {
    title: 'Compress PDF to 200 KB',
    metaTitle: 'Compress a PDF to 200 KB without uploading it | LeafLock PDF',
    metaDescription:
      'Shrink a PDF to 200 KB or less by reducing the images inside it. Nothing is uploaded, and you are told plainly if the file cannot get that small. Free, no watermark.',
    summary: 'Get a PDF under 200 KB, mostly by shrinking the images inside it.',
    howTo: [
      'Choose a PDF.',
      'The size is already set to 200 KB. Change it if you need a different one.',
      'Select Compress PDF, check the new size and download it.',
    ],
    faq: [
      {
        q: 'Will my PDF definitely get under 200 KB?',
        a: 'Not always. PDFs full of photos or scans usually can. A file that is mostly text is often small already, and one with large embedded files may not shrink that far. If it cannot reach 200 KB, you get the smallest we could make it, and we say so.',
      },
      {
        q: 'Will the photos be ruined?',
        a: 'We try the gentlest image settings first and only go further if the size needs it, so photos keep as much detail as 200 KB allows. Text and drawings stay sharp.',
      },
      {
        q: 'Is my PDF uploaded to be compressed?',
        a: 'No. Compression runs in your browser, so your PDF stays on your device from start to finish.',
      },
    ],
  },
  compressPdfTo1mb: {
    title: 'Compress PDF to 1 MB',
    metaTitle: 'Compress a PDF to 1 MB without uploading it | LeafLock PDF',
    metaDescription:
      'Shrink a PDF to 1 MB or less by reducing the images inside it. Nothing is uploaded, and you are told plainly if the file cannot get that small. Free, no watermark.',
    summary: 'Get a PDF under 1 MB, mostly by shrinking the images inside it.',
    howTo: [
      'Choose a PDF.',
      'The size is already set to 1 MB. Change it if you need a different one.',
      'Select Compress PDF, check the new size and download it.',
    ],
    faq: [
      {
        q: 'Will my PDF definitely get under 1 MB?',
        a: 'Not always. PDFs full of photos or scans usually can. A file that is mostly text is often small already, and one with large embedded files may not shrink that far. If it cannot reach 1 MB, you get the smallest we could make it, and we say so.',
      },
      {
        q: 'Will the photos be ruined?',
        a: 'We try the gentlest image settings first and only go further if the size needs it, so photos keep as much detail as 1 MB allows. Text and drawings stay sharp.',
      },
      {
        q: 'Is my PDF uploaded to be compressed?',
        a: 'No. Compression runs in your browser, so your PDF stays on your device from start to finish.',
      },
    ],
  },
};
