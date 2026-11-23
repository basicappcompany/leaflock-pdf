---
title: How to remove hidden metadata from a PDF
description: Strip the author, dates, software and editing history a PDF carries, plus hidden JavaScript and attachments, and why this tool adds nothing back.
published: 2026-11-22
tools: [removeMetadata]
updated: 2026-11-23
---

**Short answer:** [Remove metadata](/remove-metadata) clears the document information (title, author, dates and the like), the XMP packet, the document ID, per-page application data and embedded thumbnails, and can remove hidden and active content too. It runs in your browser, since uploading a file to clean it would defeat the point.

A PDF carries more than its pages. Behind the page content there is often an author name, the software used, creation and modification dates, an editing history and sometimes embedded files or scripts. Send the file and all of it goes with it. For a leaked-draft embarrassment, a journalist's source protection or a client who should not learn which firm wrote the report, that matters. This guide explains what is hidden in a PDF and how to remove it.

## What is stored besides the pages

- **Document information:** title, author, subject, keywords, creator, producer, and creation and modification dates.
- **An XMP metadata packet:** a second copy of much of the same information, plus more.
- **A document ID** that links copies of one file together.
- **Per-page leftovers** that editing software writes: private application data, page timestamps and page-level XMP.
- **Small preview thumbnails** some editors embed for each page.

## How to remove it with LeafLock

The file is read and rewritten in your browser on your device, and never sent anywhere. A tool that uploaded the file to strip its metadata would defeat the point.

1. Open [Remove metadata](/remove-metadata) and choose your PDF.
2. Decide whether to remove hidden and active content as well.
3. Run it and download the clean copy.

## Hidden and active content

The optional step removes things that can run or hide in a PDF:

- JavaScript
- Embedded and attached files
- Actions that run when the document opens
- Page-level actions

Links and bookmarks keep working, because named destinations are left alone. An ordinary link that also carried a Launch or JavaScript action keeps its appearance and loses only the part that runs.

## Is it really gone?

Yes. Unlinking metadata is not the same as deleting it. Some tools leave the old data sitting in the file where anyone can read it. Here the clean copy is written from scratch and everything unreachable is dropped, so the bytes are gone, not just the reference to them. That includes the preview thumbnails.

## No fingerprint of our own

Other LeafLock tools record that they produced a file. This one deliberately does not. That would write new metadata into a file you asked to clean, and tell anyone inspecting it which tool you used. Open the result in any metadata viewer and the producer field is empty, not ours.

## What it does not remove

- **Text on the pages.** If a name appears in the document's text, it is still there. Use [Redact PDF](/redact-pdf), and see [how to redact a PDF properly](/guides/redact-pdf-properly).
- **Comments and highlights.** They stay. [Remove annotations](/remove-annotations) takes them out; [Flatten PDF](/flatten-pdf) turns them into page content.
- **Visible watermarks, headers and footers.** They are page content.

## When to remove metadata

- Before sending a file to a client, regulator or the press.
- Before publishing a PDF on a website.
- When you need to avoid revealing who wrote or edited a document.
- When a template author's name is baked into every copy.

## Edit instead of remove?

If you want sensible values, such as a proper title and your organization as author, use [Edit metadata](/edit-metadata). See [how to edit a PDF's title, author and keywords](/guides/how-to-edit-pdf-metadata).

## Checking the result

Open the file's properties in two readers and confirm the fields are empty. Search the document for names you wanted removed. Consider a check with your own browser's network panel while using the tool; see [how to check if a PDF site uploads your files](/guides/how-to-check-if-a-pdf-site-uploads-your-files).

## Summary

1. A PDF holds hidden fields, an XMP packet, an ID and per-page leftovers.
2. They are removed and the file rewritten, not merely unlinked.
3. No marker of ours is added.
4. Text on the page and comments are separate jobs.
