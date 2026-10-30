---
title: How to redact a PDF properly (and why black boxes often fail)
description: Black boxes and highlighting don't remove text from a PDF. Learn how real redaction works, how to do it on your device, and what to check before sharing.
published: 2026-10-21
tools: [redact, flatten, compare]
---

Redaction means removing information from a document so the people you share it with can't read it: a name in a court filing, an account number on a statement, a home address on a form.

It's also one of the easiest things to get wrong. Documents released with "redacted" text that anyone could copy and paste have made the news many times. The cause is almost always the same: something was drawn over the text, but the text itself was never removed.

This guide explains why that happens, how real redaction works, and a checklist to use before you share a redacted PDF.

## Why black boxes don't redact

A PDF page is built in layers. Text, images and shapes are stored as separate objects, and the PDF reader draws them on top of each other. When you add a black rectangle or a black highlight, you add one more object on top. The text underneath is still in the file.

That means anyone with the file can often recover it:

- **Select and copy.** Dragging across the black box and pasting into a text editor reveals the words underneath.
- **Search.** Searching the PDF for a name finds it, even under a box.
- **Remove the box.** Many PDF editors let you select the rectangle and delete or move it.
- **Extract the text.** Text extraction tools, screen readers and search engines read the text layer and ignore the drawing.

### Highlighting in black is the same problem

Changing the highlight color to black, or setting text color to match the background, only changes how the text looks. The characters are all still there.

### Other places information hides

Even with the visible text removed, a PDF can carry information elsewhere:

- **Metadata** such as the title, author, subject and keywords, which may include a name or case number.
- **Comments and annotations,** including replies hidden in a sidebar.
- **Form field values,** which can sit in the file separately from what's shown.
- **Images** that contain text, like a scanned signature or a photo of an ID card.
- **Bookmarks, attachments and earlier versions** saved inside the file.

## How real redaction works

Proper redaction **removes the content**, not just hides it. After redacting, the information under the box is no longer in the file at all, so there's nothing to copy, search or uncover.

Different tools do this in different ways. Some delete only the text and image parts under each box. Others turn the whole page into an image with the boxes burned in. Both can work. The important thing is that the original content is gone.

## How LeafLock redacts a PDF

[Redact PDF](/redact-pdf) uses the image method, because it's simple and leaves nothing behind on the pages you redact. It also runs entirely in your browser, so the unredacted document is never uploaded anywhere.

1. Open [Redact PDF](/redact-pdf) and choose your file.
2. Drag on the page to draw a box over everything that must be hidden. Move a box by dragging it, or resize it from its corner.
3. Go through every page and cover each item you need to remove.
4. Select **Redact and download**.

Here's what happens to your file:

- **Each page with a box becomes an image,** with the black boxes burned in. The text, images and links on those pages are removed from the file.
- **Pages without boxes are kept as they are,** so their text is still selectable and searchable.
- **The document's title, author and other details are removed.**

There's a trade-off: text on redacted pages can no longer be selected or searched, and those pages may be a little larger. If you need the text on those pages to be searchable again, you can run the redacted file through [OCR PDF](/ocr-pdf). OCR only reads what's visible, so the redacted parts stay black.

The tool can only remove what you cover. Anything outside a box stays readable, so the checklist below still matters.

## Checklist before you share a redacted PDF

Work through this list every time. It takes a few minutes and catches most mistakes.

### 1. Find every occurrence

- Search the original document for each name, number or term you're redacting. Note every page it appears on.
- Look for variations: initials, nicknames, partial account numbers, email addresses that contain a name.
- Check headers, footers, page margins, tables, charts and image captions.
- Look inside images, like scanned letters, photos, stamps and signatures, where search won't find text.

### 2. Cover generously

- Make each box slightly larger than the text it hides. Partly covered letters can sometimes be guessed.
- Think about what remains. The length of a covered name, or the words around it, can give it away.

### 3. Test the redacted file

Open the downloaded file, not the one in your editor, and try to get the information back:

1. Press Ctrl+A (Cmd+A on a Mac) on each redacted page and paste into a plain text editor. Nothing redacted should appear.
2. Search the PDF for each redacted term. There should be no results.
3. Try clicking and dragging the black boxes. They shouldn't move.
4. Check the document properties (often **File > Properties**) for leftover names in the title, author or subject.

### 4. Review the rest of the file

- Remove comments and attachments if your PDF reader shows any.
- If the PDF has fillable fields, check their values too. [Flatten PDF](/flatten-pdf) can turn form fields into ordinary page content first.
- Compare the redacted version with the original to see what changed. [Compare PDF](/compare-pdf) highlights differences between two versions.

### 5. Share the right file

Rename the output clearly (for example `contract-redacted.pdf`) and keep it apart from the original. Sending the unredacted version by mistake is a common error, and it's easily avoided.

## Why on-device redaction matters

The documents that need redaction are, by definition, the ones with sensitive information. Uploading the unredacted original to a website means trusting that site with exactly what you're trying to protect. When redaction runs on your device, the original never leaves it. To check whether a tool uploads your files, see [how to check if a PDF site uploads your files](/guides/how-to-check-if-a-pdf-site-uploads-your-files).

## Summary

1. Black boxes, black highlights and matching text colors only hide content. The text is still in the file.
2. Real redaction removes the content underneath.
3. [Redact PDF](/redact-pdf) turns pages with boxes into images and removes the document's metadata, on your device.
4. Always test the redacted file before sharing it: copy, search, and check the properties.

Related: [How to sign a PDF without printing](/guides/how-to-sign-a-pdf-without-printing).
