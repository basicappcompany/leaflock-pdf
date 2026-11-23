---
title: What is hidden inside a PDF, and who can see it
description: "Author names, software details, edit history, comments, hidden scripts and attachments: what a PDF carries besides its pages, and how to check before you share one."
published: 2026-11-22
tools: []
author: founder
updated: 2026-11-23
---

**Short answer:** A PDF can carry a title, author, subject and keywords, a second copy of them in XMP metadata, a document ID, leftovers from editing software on each page, comments and annotations, and things that can run or hide. Hidden is not the same as removed, and the article shows how to check your own file and clean it.

When you send a PDF, you send what is on its pages. You also send whatever the file carries behind them. Most of it is harmless. Some of it is not: the name of the person who wrote the report, the software that made it, the date it was last edited, comments that were meant to be deleted. This article lists what a PDF can hold, who can see it and how to check your own files.

## The properties you can see

Open a PDF's properties in your reader (often under **File** and then **Properties**) and you will usually find:

- **Title, author, subject and keywords.** Whatever the creating program or the person filled in. A title like "Microsoft Word - Document1" and an author who left the company years ago are common.
- **Creator and producer.** The programs that made and converted the file.
- **Creation and modification dates.**

These are the fields readers and search tools use. They are also what a search engine may show for a PDF you publish.

## The copy you may not know about

A PDF can state the same information twice: once in its document information fields and once in an **XMP metadata packet**. Readers disagree about which one wins. So a file where someone edited only the author field can show the old name in one viewer and the new one in another. If you are cleaning a file, both places need attention.

## The document ID

PDFs can carry an ID that links copies of one file together. Two files that look unrelated can share an ID if one was made from the other.

## What editing software leaves on each page

Beyond the document-wide fields, editing programs can write information onto individual pages: private application data, page timestamps and page-level XMP. Some editors also embed a small preview thumbnail for each page. None of this shows on the page, and most readers never display it.

## Comments, highlights and drawings

Review rounds leave annotations: sticky notes, highlights, strikethroughs, stamps and freehand drawings. They are separate from the page, so they travel with the file. A "clean-looking" PDF can still hold a comment that says something you would rather the recipient not read. In a clean copy, the comment text and its drawn appearance should be dropped from the file, not just hidden.

## Things that can run or hide

- **JavaScript** inside the PDF.
- **Embedded and attached files.** A PDF can carry other files inside it.
- **Actions that run when the document opens**, and page-level actions.

Readers handle these differently, and a recipient's security software may flag a file that has them. Removing them from a file you share is a sensible default unless you need them.

## Hidden is not the same as removed

Several common ways of making something disappear only hide it:

- **Cropping** a page hides what is outside the box. The content is still in the file and other software can show it again.
- **White-out and black boxes** cover text without deleting it. The text underneath can often be selected, copied or found by search.
- **Flattening** a form or annotations turns them into page content. It does not remove sensitive information; the content stays as ordinary text and images.

To take something out for good, the content has to be removed from the file. [How to redact a PDF properly](/guides/redact-pdf-properly) explains the difference and how to test the result.

## How to check your own file

1. **Properties in two readers.** Look at title, author, subject and keywords in at least two programs, since one may read the XMP copy and the other the information fields.
2. **Look for comments.** Open the comments panel in your reader.
3. **Search for names.** Search the text of the document for names, account numbers or other details you meant to remove.
4. **Try to select under a box.** Click and drag over any black box or white-out. If text highlights, it is still there.
5. **Compare with the original.** [Compare PDF](/compare-pdf) shows the words that differ between two versions.

## How to clean it

- To take out every document-level field, the XMP packet, the document ID and the per-page leftovers in one step, use [Remove metadata](/remove-metadata). See [how to remove hidden metadata from a PDF](/guides/how-to-remove-hidden-metadata-from-a-pdf).
- To delete comments and drawings, use [Remove annotations](/remove-annotations), covered in [how to remove comments and annotations from a PDF](/guides/how-to-remove-comments-and-annotations-from-a-pdf).
- To set sensible values instead of removing them, use [Edit metadata](/edit-metadata).
- To remove text from the page itself, use [Redact PDF](/redact-pdf).

Do the cleaning on your own device. A tool that uploads the file to strip its metadata has already shown the file to someone else, which is the opposite of the goal.

## Summary

1. A PDF carries document fields, an XMP copy, an ID and per-page leftovers behind its pages.
2. Comments, scripts and attachments travel with it.
3. Cropping, white-out and flattening hide things; they do not remove them.
4. Check in two readers, then clean on your device.
