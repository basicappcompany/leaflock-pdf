/**
 * Page text for the English-only landing pages (registry entries marked `enOnly`).
 *
 * Deliberately outside `en` in ./index.ts: every translated locale must mirror that object key for key, and these pages
 * are not translated (a non-English URL serves this English text and is noindex). Same rules as ./landings.ts: a
 * landing exists only when its query is genuinely different, and every claim is one the tool's own FAQ already makes
 * (src/i18n/en/tools/<id>.ts), so a landing cannot promise more than the tool does.
 */
export const landingsMore = {
  // ---- Privacy intent ----
  mergePdfWithoutUpload: {
    title: 'Merge PDF without uploading',
    metaTitle: 'Merge PDF files without uploading them | LeafLock PDF',
    metaDescription:
      'Combine PDFs into one file without sending them to a server. The merge runs in your browser, so contracts and records stay on your device.',
    summary: 'Combine PDFs into one file without sending them anywhere.',
    howTo: [
      'Choose the PDFs you want to combine. They are read by your browser, not sent to a server.',
      'Put them in the order you want.',
      'Select Merge PDF and download the combined file.',
    ],
    faq: [
      {
        q: 'How can I merge PDFs without uploading them?',
        a: 'Use a tool that does the work in your browser. Here the files are combined by your own device and never uploaded, and the page is also blocked from sending them anywhere.',
      },
      {
        q: 'Does merging without upload change the quality?',
        a: 'No. Pages are copied as they are, without converting or recompressing anything, so text and images look exactly as before.',
      },
      {
        q: 'Are bookmarks kept when I merge?',
        a: 'Yes. Each file’s bookmarks are carried into the merged PDF, nested and in order. A small number of unusual bookmark types, such as ones that jump to another document, are dropped.',
      },
    ],
  },
  compressPdfWithoutUpload: {
    title: 'Compress PDF without uploading',
    metaTitle: 'Compress a PDF without uploading it | LeafLock PDF',
    metaDescription:
      'Make a PDF smaller without sending it to a server. Compression runs in your browser, so scans, statements and contracts never leave your device.',
    summary: 'Make a PDF smaller without sending it anywhere.',
    howTo: [
      'Choose your PDF. It is read by your browser, not uploaded.',
      'Pick Light, Recommended or Strong, or compress to a size you enter.',
      'Select Compress PDF, check the size before and after, and download.',
    ],
    faq: [
      {
        q: 'Is my PDF uploaded to be compressed?',
        a: 'No. Compression runs in your browser, so your PDF stays on your device from start to finish.',
      },
      {
        q: 'Which level should I choose?',
        a: 'Light for printing, Recommended for reading on screen, and Strong when the smallest file matters more than photo detail.',
      },
      {
        q: 'Why couldn’t my PDF be made smaller?',
        a: 'It is probably well compressed already, or mostly text. The tool never hands you a bigger file; try Strong to shrink images further.',
      },
    ],
  },
  splitPdfWithoutUpload: {
    title: 'Split PDF without uploading',
    metaTitle: 'Split a PDF without uploading it | LeafLock PDF',
    metaDescription:
      'Split a PDF by page range, page count or one file per page without sending it to a server. Everything happens in your browser.',
    summary: 'Split a PDF into several files without sending it anywhere.',
    howTo: [
      'Choose your PDF. It is read by your browser, not uploaded.',
      'Pick how to split: by page ranges, by a set number of pages or one file per page.',
      'Select Split PDF and download the files, or all of them as a ZIP.',
    ],
    faq: [
      {
        q: 'Are my files uploaded when I split a PDF?',
        a: 'No. The PDF is split inside your browser and the new files are created on your device. Nothing is sent to a server.',
      },
      {
        q: 'Does splitting change the original or its quality?',
        a: 'No. Your original file stays as it is, and the pages are copied into the new PDFs without any loss in quality.',
      },
      {
        q: 'Can the same page go into more than one file?',
        a: 'Yes. Ranges may overlap, so a page can appear in several of the new files.',
      },
    ],
  },
  pdfToWordWithoutUpload: {
    title: 'PDF to Word without uploading',
    metaTitle: 'Convert PDF to Word without uploading it | LeafLock PDF',
    metaDescription:
      'Turn a PDF into an editable Word file without sending it to a server. The conversion runs in your browser; contracts and letters stay on your device.',
    summary: 'Turn a PDF into an editable Word document without sending it anywhere.',
    howTo: [
      'Choose your PDF. The text is read by your browser, not uploaded.',
      'Select Convert to Word.',
      'Download the .docx and check the result against your PDF.',
    ],
    faq: [
      {
        q: 'Why is PDF to Word usually done on a server?',
        a: 'Most converters do it remotely, which means handing over the document, such as a contract, a payslip or a medical letter. Here the Word file is built in your browser on your device, and you can watch the network panel stay empty while it happens.',
      },
      {
        q: 'What comes across?',
        a: 'Paragraphs, headings, bold and italic text, and bulleted and numbered lists. Headings and lists are real Word styles. Tables, images, exact fonts and precise page layout do not come across.',
      },
      {
        q: 'The PDF is a scan and nothing came out. Why?',
        a: 'A scan is a picture of a page, so there is no text in it to convert. Run OCR PDF over it first to add a text layer, then convert the result.',
      },
    ],
  },
  signPdfWithoutUpload: {
    title: 'Sign PDF without uploading',
    metaTitle: 'Sign a PDF without uploading it or your signature | LeafLock PDF',
    metaDescription:
      'Draw, type or upload your signature and place it on a PDF without sending the document or the signature to a server.',
    summary: 'Sign a PDF without sending the document or your signature anywhere.',
    howTo: [
      'Choose the PDF to sign. It is read by your browser, not uploaded.',
      'Draw, type or upload your signature, then place it on the page.',
      'Select Save and download the signed copy.',
    ],
    faq: [
      {
        q: 'Is my signature stored or uploaded?',
        a: 'No. Your signature and your document stay in your browser. The signature is kept only while the page is open and is never saved or sent anywhere.',
      },
      {
        q: 'Is this a legally binding signature?',
        a: 'The tool places an image of your signature on the page, like signing a printout. It does not add a certificate-based digital signature, so check what the person asking for your signature accepts.',
      },
      {
        q: 'Can I sign on my phone?',
        a: 'Yes. Draw your signature with your finger in a mobile browser. There is no app to install.',
      },
    ],
  },
  ocrPdfWithoutUpload: {
    title: 'OCR PDF without uploading',
    metaTitle: 'OCR a scanned PDF without uploading it | LeafLock PDF',
    metaDescription:
      'Make a scanned PDF searchable without sending it to a server. Text recognition runs in your browser on your own device.',
    summary: 'Recognize the text in scanned pages without sending them anywhere.',
    howTo: [
      'Choose your scanned PDF, or choose images of the pages.',
      'Select Make searchable. Recognition runs page by page on your device.',
      'Download the PDF. It looks the same, and the text can now be searched and copied.',
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
        q: 'Why does it take a while?',
        a: 'Each page is recognized on your own device, so the speed depends on its processor. Long documents take longer, and you can follow the progress page by page.',
      },
    ],
  },

  // ---- A size the file has to fit under ----
  compressPdfTo100kb: {
    title: 'Compress PDF to 100 KB',
    metaTitle: 'Compress a PDF to under 100 KB, privately | LeafLock PDF',
    metaDescription:
      'Shrink a PDF toward 100 KB for a strict upload limit. The size is preset; the gentlest settings that fit are used, and nothing is uploaded.',
    summary: 'Shrink a PDF toward 100 KB, using the gentlest settings that fit.',
    howTo: [
      'Choose your PDF.',
      'The target is already set to 100 KB. Change it if the form allows more.',
      'Select Compress PDF and download the smallest file that fits.',
    ],
    faq: [
      {
        q: 'Can every PDF reach 100 KB?',
        a: 'No. Photos and scanned pages are what make a PDF large, and a long scan may not get that small. If the file cannot reach the target, you get the smallest file we could make and we say so.',
      },
      {
        q: 'Will my text still be readable at 100 KB?',
        a: 'Text and drawings stay sharp. Photos and scanned images are scaled down and saved as JPG, so they can look softer.',
      },
      {
        q: 'Is the PDF uploaded to be compressed?',
        a: 'No. Compression runs in your browser, so your PDF stays on your device from start to finish.',
      },
    ],
  },
  compressPdfTo500kb: {
    title: 'Compress PDF to 500 KB',
    metaTitle: 'Compress a PDF to under 500 KB, privately | LeafLock PDF',
    metaDescription:
      'Get a PDF under 500 KB for an application portal or email form. The target is preset and nothing leaves your device.',
    summary: 'Get a PDF under 500 KB using the gentlest settings that fit.',
    howTo: [
      'Choose your PDF.',
      'The target is already set to 500 KB.',
      'Select Compress PDF and download the result.',
    ],
    faq: [
      {
        q: 'How does it reach a particular size?',
        a: 'Choose To a size and enter it. We use the gentlest image settings that get under the number, so photos keep as much detail as the size allows.',
      },
      {
        q: 'What if my PDF is already under 500 KB?',
        a: 'It is left alone. The tool never hands you a bigger file.',
      },
      {
        q: 'What if it cannot get that small?',
        a: 'You get the smallest file we could make, and we say so, so you can decide whether to split the document or lower the target.',
      },
    ],
  },
  compressPdfTo2mb: {
    title: 'Compress PDF to 2 MB',
    metaTitle: 'Compress a PDF to under 2 MB, privately | LeafLock PDF',
    metaDescription:
      'Get a PDF under 2 MB for a form or portal upload limit. The size is preset, quality is kept as high as the target allows, nothing is uploaded.',
    summary: 'Get a PDF under 2 MB while keeping as much quality as the size allows.',
    howTo: [
      'Choose your PDF.',
      'The target is already set to 2 MB.',
      'Select Compress PDF and download the result.',
    ],
    faq: [
      {
        q: 'Will a 2 MB target hurt quality?',
        a: 'Less than a smaller target would. The tool uses the gentlest image settings that get under the number, so photos keep as much detail as the size allows. Text and drawings stay sharp.',
      },
      {
        q: 'How do I know how much it shrank?',
        a: 'You see the size before and after before you download.',
      },
      {
        q: 'Is there a file size limit for what I can compress?',
        a: 'There is no fixed limit. Large files depend on your device’s memory, because the compression happens there.',
      },
    ],
  },
  compressPdfTo5mb: {
    title: 'Compress PDF to 5 MB',
    metaTitle: 'Compress a PDF to under 5 MB, privately | LeafLock PDF',
    metaDescription:
      'Get a PDF under 5 MB for an upload limit while keeping photos as detailed as that size allows. Runs in your browser.',
    summary: 'Get a PDF under 5 MB with photos kept as detailed as that size allows.',
    howTo: [
      'Choose your PDF.',
      'The target is already set to 5 MB.',
      'Select Compress PDF and download the result.',
    ],
    faq: [
      {
        q: 'Which PDFs shrink the most?',
        a: 'PDFs with many photos or scanned pages. Files that are mostly text are usually small already.',
      },
      {
        q: 'Why was my PDF not made smaller?',
        a: 'It is probably well compressed already, or mostly text. The tool never hands you a bigger file.',
      },
      {
        q: 'Is my PDF uploaded?',
        a: 'No. Compression runs in your browser, so your PDF stays on your device.',
      },
    ],
  },
  compressPdfForEmail: {
    title: 'Compress PDF for email',
    metaTitle: 'Compress a PDF for email attachments, privately | LeafLock PDF',
    metaDescription:
      'Get a PDF under 10 MB so it fits an email attachment limit. The target is preset, and the file is never uploaded.',
    summary: 'Get a PDF under 10 MB so it fits an email attachment.',
    howTo: [
      'Choose your PDF.',
      'The target is already set to 10 MB, which suits most email limits. Lower it if yours is stricter.',
      'Select Compress PDF and attach the result.',
    ],
    faq: [
      {
        q: 'Why 10 MB?',
        a: 'Many email services cap attachments around 20 to 25 MB, and attachments grow by roughly a third when they are encoded for sending, so aiming under 10 MB leaves a safe margin. Your recipient’s server may set a lower limit.',
      },
      {
        q: 'Will the PDF still look right on screen?',
        a: 'Text and drawings stay sharp. Photos and scanned images are scaled down, so they can look softer. Open the result and read a page or two before sending.',
      },
      {
        q: 'Is my PDF uploaded?',
        a: 'No. Compression runs in your browser, so the file stays on your device until you attach it yourself.',
      },
    ],
  },

  // ---- The same job under the word people search for ----
  joinPdf: {
    title: 'Join PDF files',
    metaTitle: 'Join PDF files into one, privately | LeafLock PDF',
    metaDescription:
      'Join two or more PDFs into a single file in the order you choose. Runs in your browser; nothing is uploaded and no account is needed.',
    summary: 'Join several PDFs into one file, in the order you choose.',
    howTo: [
      'Choose the PDFs to join.',
      'Drag them into order.',
      'Select Merge PDF and download the joined file.',
    ],
    faq: [
      {
        q: 'Is joining PDFs the same as merging them?',
        a: 'Yes. Joining, combining and merging all mean putting one document after another in a single file.',
      },
      {
        q: 'Can I join PDFs on my phone?',
        a: 'Yes. It works in any modern browser on phones, tablets and computers. There is nothing to install and no account to create.',
      },
      {
        q: 'Can I join password-protected PDFs?',
        a: 'If a file needs a password to open, remove it with Unlock PDF first, then join. Files that only restrict printing or editing can be joined as they are.',
      },
    ],
  },
  shrinkPdf: {
    title: 'Shrink PDF',
    metaTitle: 'Shrink a PDF to a smaller file, privately | LeafLock PDF',
    metaDescription:
      'Shrink a PDF by reducing the images inside it. See the size before and after; the file stays on your device.',
    summary: 'Shrink a PDF by making the images inside it smaller.',
    howTo: [
      'Choose your PDF.',
      'Pick Light, Recommended or Strong.',
      'Select Compress PDF, compare the sizes and download.',
    ],
    faq: [
      {
        q: 'What actually gets smaller?',
        a: 'Mostly the images. Photos and scanned images are scaled down and saved as JPG. Text and drawings stay sharp at every level.',
      },
      {
        q: 'How much smaller will it get?',
        a: 'It depends on what is inside. PDFs with many photos or scanned pages shrink the most; files that are mostly text are usually small already.',
      },
      {
        q: 'Is there a file size limit?',
        a: 'There is no fixed limit. Large files depend on your device’s memory, because the work happens there.',
      },
    ],
  },
  passwordProtectPdf: {
    title: 'Password protect PDF',
    metaTitle: 'Password protect a PDF in your browser | LeafLock PDF',
    metaDescription:
      'Add a password so only people who know it can open your PDF. Encrypted on your device with AES-256; the file and password are never sent to us.',
    summary: 'Add a password so only people who know it can open the PDF.',
    howTo: [
      'Choose your PDF.',
      'Type the password people will need to open it, and choose what they may do afterwards.',
      'Select Protect PDF and download the protected copy.',
    ],
    faq: [
      {
        q: 'Is my password sent anywhere?',
        a: 'No. The PDF is encrypted in your browser on your device, so neither the file nor the password is ever sent to us.',
      },
      {
        q: 'What if I forget the password?',
        a: 'Then nobody can open the file, including us. Keep the password somewhere safe, or keep an unprotected copy in a safe place.',
      },
      {
        q: 'Can I protect a PDF that already has a password?',
        a: 'If it needs a password to open, remove it with Unlock PDF first, then protect it with the new one. Files that only restrict printing or editing can be protected directly.',
      },
    ],
  },
  encryptPdf: {
    title: 'Encrypt PDF',
    metaTitle: 'Encrypt a PDF with AES-256, in your browser | LeafLock PDF',
    metaDescription:
      'Encrypt a PDF with AES-256 so it cannot be read without the password. The encryption happens on your device; nothing is uploaded.',
    summary: 'Encrypt a PDF with AES-256 so it cannot be opened without the password.',
    howTo: [
      'Choose your PDF.',
      'Set a password. A long one that is hard to guess matters most.',
      'Select Protect PDF and download the encrypted file.',
    ],
    faq: [
      {
        q: 'How strong is the encryption?',
        a: 'The file is encrypted with AES-256. How well it holds up depends mostly on your password, so use a long one that is hard to guess.',
      },
      {
        q: 'Can I stop people from printing or copying?',
        a: 'Yes. Choose what people may do after opening the file. PDF readers are asked to honor these limits, but some ignore them; only the open password truly protects the file.',
      },
      {
        q: 'What is the permissions password for?',
        a: 'It is a second password for changing the limits on printing, copying and editing. If you do not set one, a random one is used.',
      },
    ],
  },
  separatePdfPages: {
    title: 'Separate PDF pages',
    metaTitle: 'Separate PDF pages into individual files | LeafLock PDF',
    metaDescription:
      'Separate a PDF into one file per page, or into ranges, in your browser. Download the files one by one or as a ZIP.',
    summary: 'Separate a PDF into one file per page, or into ranges.',
    howTo: [
      'Choose your PDF.',
      'Choose One file per page, or type page ranges.',
      'Select Split PDF and download the files, or all of them as a ZIP.',
    ],
    faq: [
      {
        q: 'How do I get every page as its own file?',
        a: 'Choose the one-file-per-page option. Each page is copied into its own PDF and you can download them all together as a ZIP.',
      },
      {
        q: 'Does separating pages reduce quality?',
        a: 'No. The pages are copied into the new PDFs without any loss in quality, and your original is not changed.',
      },
      {
        q: 'Is there a file size limit?',
        a: 'There is no fixed limit. The practical limit is your device’s memory, since the whole PDF is processed there.',
      },
    ],
  },
  fixCorruptedPdf: {
    title: 'Fix a corrupted PDF',
    metaTitle: 'Fix a corrupted PDF that will not open | LeafLock PDF',
    metaDescription:
      'Try to rebuild a damaged PDF so it opens again. The repair runs in your browser and the file stays on your device.',
    summary: 'Try to rebuild a damaged PDF so it opens again.',
    howTo: [
      'Choose the PDF that will not open.',
      'Select Repair PDF.',
      'Check every page of the repaired copy, then download it.',
    ],
    faq: [
      {
        q: 'How does the repair work?',
        a: 'It first rebuilds the file’s structure, copying every page that can still be read into a new PDF. If that fails, it redraws each readable page as an image and builds a new PDF from those.',
      },
      {
        q: 'Can every corrupted PDF be fixed?',
        a: 'No. Pages that are too damaged cannot be recovered, and if no readable pages are found, the file cannot be repaired at all.',
      },
      {
        q: 'Is anything lost in the repaired copy?',
        a: 'The pages, title, author and subject are kept, but bookmarks are not carried over and form fields may stop working. Keep the original and check every page of the copy.',
      },
    ],
  },
  cropPdfMargins: {
    title: 'Crop PDF margins',
    metaTitle: 'Crop PDF margins and trim pages, privately | LeafLock PDF',
    metaDescription:
      'Trim the margins off PDF pages with exact percentages, on all pages or only some. Runs in your browser.',
    summary: 'Trim margins off PDF pages, on all pages or only some.',
    howTo: [
      'Choose your PDF.',
      'Drag the box on the preview, or type how much to trim from each side.',
      'Choose which pages it applies to, then save the cropped copy.',
    ],
    faq: [
      {
        q: 'Can I set exact margins?',
        a: 'Yes. Drag the box on the preview, or type how much to trim from each side as a percentage of the page. The same margins are used on every page you choose.',
      },
      {
        q: 'Does cropping delete what is outside the box?',
        a: 'No. It hides it: the content is still in the file, and other PDF software can show it again. To remove sensitive information for good, use Redact PDF.',
      },
      {
        q: 'Will cropping make the file smaller?',
        a: 'No. Because the hidden content stays in the file, its size stays about the same. To make it smaller, use Compress PDF.',
      },
    ],
  },
  removePdfComments: {
    title: 'Remove comments from PDF',
    metaTitle: 'Remove comments and highlights from a PDF | LeafLock PDF',
    metaDescription:
      'Delete comments, sticky notes, highlights and drawings from a PDF before you share it. The removed text is dropped from the file.',
    summary: 'Delete comments, highlights, stamps and drawings from a PDF.',
    howTo: [
      'Choose your PDF.',
      'Choose whether links should be removed too.',
      'Select Remove annotations and download the clean copy.',
    ],
    faq: [
      {
        q: 'What exactly is removed?',
        a: 'Comments and sticky notes, highlights, underlines and strikethroughs, stamps, shapes, freehand drawings and text boxes, together with the pop-up notes attached to them.',
      },
      {
        q: 'Is the comment text really gone from the file?',
        a: 'Yes. The clean copy is written from scratch and anything no longer referenced is dropped, so the comment text and its drawn appearance leave the file.',
      },
      {
        q: 'What is kept?',
        a: 'Form fields are always kept, because emptying a form is a different job. Links are kept unless you ask for them to go.',
      },
    ],
  },
  compareTwoPdfs: {
    title: 'Compare two PDFs',
    metaTitle: 'Compare two PDF versions and see what changed | LeafLock PDF',
    metaDescription:
      'Find the words added or removed between two PDFs, with a visual overlay of what looks different. Both files stay on your device.',
    summary: 'See what changed between two versions of a document.',
    howTo: [
      'Choose the original PDF and the revised one.',
      'Select Compare.',
      'Read the text changes, then check the overlay and side-by-side pages.',
    ],
    faq: [
      {
        q: 'What kinds of changes does it find?',
        a: 'Words that were added or removed, page by page, and a visual overlay that highlights areas that look different, such as images or layout.',
      },
      {
        q: 'How are the pages matched?',
        a: 'Page 1 is compared with page 1, page 2 with page 2, and so on. If a page was added or removed, the pages after it shift and may show many changes.',
      },
      {
        q: 'Are both documents kept private?',
        a: 'Yes. Both PDFs are opened and compared in your browser, and neither is uploaded.',
      },
    ],
  },

  // ---- A file type named in the query ----
  imageToPdf: {
    title: 'Image to PDF',
    metaTitle: 'Convert images to PDF, privately | LeafLock PDF',
    metaDescription:
      'Turn JPG, PNG, WebP, GIF and BMP images into one PDF, one image per page. Your pictures are not uploaded.',
    summary: 'Turn images into a PDF, one image per page.',
    howTo: [
      'Choose your images. You can mix formats.',
      'Put them in order, and choose the page size and margins.',
      'Select Convert to PDF and download the result.',
    ],
    faq: [
      {
        q: 'Which image formats can I use?',
        a: 'JPG, PNG, WebP, GIF and BMP, plus other formats your browser can open. If an image will not open, save it as JPG or PNG and try again.',
      },
      {
        q: 'What page size will the PDF have?',
        a: 'By default each page takes the size and shape of its image. You can also choose A4 or US Letter, with each image scaled to fit and an optional margin.',
      },
      {
        q: 'Will phone photos come out the right way up?',
        a: 'Yes. The tool follows the orientation your camera saved with the photo, so sideways pictures are turned upright.',
      },
    ],
  },
  gifToPdf: {
    title: 'GIF to PDF',
    metaTitle: 'Convert GIF images to PDF, privately | LeafLock PDF',
    metaDescription:
      'Turn GIF images into a PDF in your browser. Nothing is uploaded, and you can mix in JPG, PNG and other formats.',
    summary: 'Turn GIF images into a PDF.',
    howTo: [
      'Choose your GIF files. JPG, PNG and other images work too.',
      'Put them in order, and choose page size and margins.',
      'Select Convert to PDF and download the result.',
    ],
    faq: [
      {
        q: 'What happens to an animated GIF?',
        a: 'A PDF page is still, so an animation cannot be kept. Choose the images you want and check each page in the result.',
      },
      {
        q: 'Does converting GIF to PDF change the image?',
        a: 'JPG and PNG images go into the PDF unchanged. Other formats, GIF included, are converted to JPG or PNG first, which can change them very slightly.',
      },
      {
        q: 'Are my images uploaded?',
        a: 'No. Your images are turned into a PDF by your browser, so they never leave your device.',
      },
    ],
  },
  pdfToJpeg: {
    title: 'PDF to JPEG',
    metaTitle: 'Convert PDF pages to JPEG images, privately | LeafLock PDF',
    metaDescription:
      'Save each page of a PDF as a JPEG image at 72, 150 or 300 dpi. Convert all pages or only the ones you choose; nothing is uploaded.',
    summary: 'Save each page of a PDF as a JPEG image.',
    howTo: [
      'Choose a PDF.',
      'Pick JPG, a resolution and which pages to convert.',
      'Select Convert and download the images, one by one or as a ZIP.',
    ],
    faq: [
      {
        q: 'Is JPEG the same as JPG?',
        a: 'Yes. They are the same format, and the files are saved with the .jpg extension.',
      },
      {
        q: 'What resolution are the images?',
        a: 'You can choose 72 dpi for screens, 150 dpi as a standard, or 300 dpi for print. Very large pages may come out at a lower resolution to stay within browser limits.',
      },
      {
        q: 'Can I convert only some pages?',
        a: 'Yes. Choose Chosen pages and type the page numbers, for example 1-3, 5.',
      },
    ],
  },
  pdfToDocx: {
    title: 'PDF to DOCX',
    metaTitle: 'Convert PDF to DOCX, privately | LeafLock PDF',
    metaDescription:
      'Turn a PDF into an editable .docx with real headings and lists. The conversion runs in your browser and the file is not uploaded.',
    summary: 'Turn a PDF into an editable .docx file.',
    howTo: [
      'Choose your PDF.',
      'Select Convert to Word.',
      'Download the .docx and open it in Word or another editor.',
    ],
    faq: [
      {
        q: 'How does it know what is a heading?',
        a: 'By size, measured against the rest of your document rather than a fixed number of points. The size that covers the most text is treated as body copy, and anything meaningfully larger becomes a heading.',
      },
      {
        q: 'What does not come across?',
        a: 'Tables, images, exact fonts, colors and precise page layout. A PDF records glyphs at coordinates, not structure, so we would rather tell you what you are getting. If the layout matters more than the text, keep the PDF.',
      },
      {
        q: 'Why does it warn about columns?',
        a: 'Text in two columns is stored as two blocks side by side, with nothing in the file saying they are columns. We look for the gutter between columns and tell you which pages have one, rather than quietly handing you shuffled text.',
      },
    ],
  },
  docxToPdf: {
    title: 'DOCX to PDF',
    metaTitle: 'Convert DOCX to PDF without uploading it | LeafLock PDF',
    metaDescription:
      'Turn a .docx document into a PDF in your browser. Paragraphs, headings, bold, italic and lists come across; the file is not uploaded.',
    summary: 'Turn a .docx document into a PDF, on your device.',
    howTo: [
      'Choose your .docx file.',
      'Select Convert to PDF.',
      'Read the summary of anything skipped, then download the PDF.',
    ],
    faq: [
      {
        q: 'What comes across?',
        a: 'Paragraphs, headings, bold and italic text, and bulleted and numbered lists, laid out on A4 pages.',
      },
      {
        q: 'What does not come across?',
        a: 'Tables, images, your original fonts, colors, page size and margins. The PDF is built fresh on plain A4 pages in a single typeface, so if the exact layout matters, this tool is not the right one yet.',
      },
      {
        q: 'What happens to tables and images in my document?',
        a: 'They are left out, and the result tells you how many of each were skipped. Nothing is approximated in their place.',
      },
    ],
  },
  xlsxToPdf: {
    title: 'XLSX to PDF',
    metaTitle: 'Convert an XLSX spreadsheet to PDF, privately | LeafLock PDF',
    metaDescription:
      'Turn an .xlsx workbook into a PDF with one section per sheet. Built in your browser, so the figures never leave your device.',
    summary: 'Turn an .xlsx workbook into a PDF, one section per sheet.',
    howTo: [
      'Choose your .xlsx file.',
      'Select Convert to PDF.',
      'Check wide sheets against the original, then download the PDF.',
    ],
    faq: [
      {
        q: 'What does the PDF look like?',
        a: 'Every sheet becomes its own page or pages, named by the sheet name, drawn as a plain bordered grid in one typeface. It is built fresh, not a faithful copy of the spreadsheet’s own formatting.',
      },
      {
        q: 'What does not come across?',
        a: 'Cell colors, fonts, column widths, conditional formatting, charts and formulas. Only the calculated value of a formula is shown, as plain text.',
      },
      {
        q: 'What happens with a sheet that has a lot of columns?',
        a: 'Every column gets an equal share of the page width, so a wide sheet ends up with narrow columns and more wrapped lines per row. Very wide sheets are worth checking against the original.',
      },
    ],
  },
  pdfToTxt: {
    title: 'PDF to TXT',
    metaTitle: 'Convert PDF to a TXT file, privately | LeafLock PDF',
    metaDescription:
      'Pull all the text out of a PDF into a plain UTF-8 .txt file, with optional page markers. The text never leaves your device.',
    summary: 'Pull all the text out of a PDF into a plain .txt file.',
    howTo: [
      'Choose your PDF.',
      'Choose whether to mark where each page starts.',
      'Copy from the preview, or download the .txt file.',
    ],
    faq: [
      {
        q: 'What file do I get?',
        a: 'A plain .txt file in UTF-8, which opens in any text editor. You can also copy the text straight from the preview.',
      },
      {
        q: 'Why was no text found?',
        a: 'The PDF probably contains scans or photos of pages rather than real text. Run it through OCR PDF to recognize the text first.',
      },
      {
        q: 'Is the layout kept?',
        a: 'No. You get plain text with line breaks. Fonts, tables and images are not kept, and text in columns may not come out in reading order.',
      },
    ],
  },
  makePdfSearchable: {
    title: 'Make a PDF searchable',
    metaTitle: 'Make a scanned PDF searchable, privately | LeafLock PDF',
    metaDescription:
      'Add a text layer to a scanned PDF so you can search, select and copy its text. Runs on your device; pages look the same.',
    summary: 'Add a text layer to a scanned PDF so you can search and copy it.',
    howTo: [
      'Choose your scanned PDF, or images of the pages.',
      'Select Make searchable.',
      'Download the PDF and try searching it.',
    ],
    faq: [
      {
        q: 'Will my PDF look different?',
        a: 'No. The recognized text is laid invisibly over each page, so the pages look the same, but you can now search, select and copy the text.',
      },
      {
        q: 'How accurate is it?',
        a: 'It depends on the scan. Clear, upright pages in good light give the best results, so check important text before you rely on it.',
      },
      {
        q: 'Can I use photos instead of a PDF?',
        a: 'Yes. Select Choose images under the file picker. The images are combined into one searchable PDF.',
      },
    ],
  },
};
