---
title: How to edit a PDF's title, author and keywords
description: See and change the title, author, subject and keywords stored in a PDF, why the old author can still show in some viewers and how to fix that.
published: 2026-11-22
tools: [editMetadata]
---

Every PDF carries a few lines of information about itself that you may never have seen: a title, an author, a subject, keywords. They appear in the reader's title bar, in search results, in file listings and when someone checks the file's properties. They are often wrong: a title like "Microsoft Word - Document1", the name of whoever created the template or an author who left the company years ago. This guide explains how to see them and fix them.

## What the properties are for

- **Title.** Shown in a browser tab or reader title bar, often in place of the file name. It is also what search engines may show for a PDF.
- **Author.** Who the file says created it.
- **Subject.** A short description.
- **Keywords.** Words that help search tools.

These are the four fields readers and search tools actually use.

## How to edit them with LeafLock

The file is read and rewritten in your browser on your device, and never sent anywhere.

1. Open [Edit metadata](/edit-metadata) and choose your PDF.
2. The current values appear straight away. Nothing is written unless you save.
3. Change the fields you want.
4. Save and download.

A field you leave empty is removed from the file, rather than stored as a blank value.

## Why the old author sometimes still shows

A PDF can state the same thing twice: once in its document information fields and once in an XMP metadata packet. Readers disagree about which of the two wins. A file edited in only one place can show the old author in one viewer and the new one in another.

To avoid that, the tool removes the XMP copy when you save, and the result tells you when it did. What you typed is then what every reader shows.

## It changes properties, not the pages

Only the document properties change. Visible text and images are untouched. A name that appears in the text of the document is still there. If a name must go from the page itself, that is redaction: [Redact PDF](/redact-pdf).

## Editing versus removing

If you want to set a good title and author, edit. If you want the file to carry nothing about its origin, such as the software, dates, editing history and document ID, use [Remove metadata](/remove-metadata). It strips every field, the XMP packet, the document ID and per-page leftovers in one step, and adds nothing of ours. See [what your PDF reveals and how to remove it](/guides/how-to-remove-hidden-metadata-from-a-pdf).

## Practical reasons to set the title

1. **Accessibility.** Screen readers announce the title when a document opens, so a meaningful one helps.
2. **Findability.** A real title makes the PDF easier to identify in a browser tab, a bookmarks list or a search result.
3. **Professionalism.** "Document1" or a draft file name looks careless in a shared report.

## Good practice

- Write the title as a person would read it, not as a file name.
- Use your organization or your own name consistently in the author field, or leave it empty if you prefer.
- Keep keywords few and specific.
- Check the result by opening the file's properties in a reader.

## When to do it

Do it last. Changing pages afterwards with another tool may rewrite the properties, so set them as the final step before you send the file.

## Summary

1. Title, author, subject and keywords are the fields that matter.
2. The XMP copy is removed so every reader agrees.
3. Empty fields are removed, not stored blank.
4. For a full clean, use Remove metadata instead.
