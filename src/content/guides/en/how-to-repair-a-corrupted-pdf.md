---
title: How to repair a corrupted PDF that will not open
description: Try to rebuild a damaged PDF on your device, how the two-step repair works, what is lost and when a file cannot be saved.
published: 2026-11-22
tools: [repair]
updated: 2026-11-23
---

**Short answer:** [Repair PDF](/repair-pdf) first copies every readable page into a new PDF, keeping text as text. If that fails it redraws each readable page as an image, which keeps how the page looks but not the text underneath, so check the result.

"The file is damaged and could not be repaired." "There was an error processing a page." A PDF that will not open usually stopped being valid at some point: an interrupted download, a failed save, a bad email attachment or a disk problem. Sometimes the content is still mostly there. This guide explains how repair works, what it can and cannot recover and what to check afterwards.

## What goes wrong

A PDF is a structured file with an index, called the cross-reference table, that tells a reader where each object lives. If the index is damaged or the file is cut short, readers cannot find the pages even though the page data may still be there. Repair tries to find that data without relying on the index.

## How the repair works

[Repair PDF](/repair-pdf) tries two approaches in order:

1. **Rebuild the structure.** It copies every page that can still be read into a new PDF. Text stays text and images stay images.
2. **If that fails, redraw.** It renders each readable page as an image and builds a new PDF from those pictures.

The first approach is preferred. The second is a fallback that saves what you can see, at a cost.

## How to repair with LeafLock

The repair runs in your browser, so the damaged file stays on your device.

1. Open [Repair PDF](/repair-pdf) and choose the file.
2. Run the repair.
3. Read the result summary, then download the repaired copy.
4. Open it and check every page.

## Why you cannot select text afterwards

Pages recovered by redrawing are images, so the text is no longer text. If the result needs to be searchable, run it through [OCR PDF](/ocr-pdf) to recognize the words again. See [how to turn a scanned PDF into searchable text](/guides/scanned-pdf-to-searchable-text).

## What is kept and what is lost

The pages, title, author and subject are kept. Bookmarks are not carried over, and form fields may stop working. Keep the original and check every page of the copy, particularly the last ones, since a file cut short loses its end.

## When repair cannot help

- **Pages too damaged to read** cannot be recovered. Those are left out.
- **No readable pages at all** means the file cannot be repaired.
- **Encrypted files.** If the file needs a password to open, remove it with [Unlock PDF](/unlock-pdf) first, then repair. See [how to unlock a PDF you have the password for](/guides/how-to-unlock-a-pdf).

## Before you give up

1. **Try another reader.** Browsers and desktop readers differ in how forgiving they are.
2. **Download it again,** if it came from a website or email. A truncated download is the most common cause.
3. **Ask for a fresh copy** from the sender.
4. **Check older versions or backups** of the file.
5. Only then run Repair on what you have.

## Prevention

- Wait for downloads to finish before opening files.
- Do not unplug a drive while a PDF is being saved.
- Keep a second copy of important documents.
- Be wary of files that pass through unreliable conversion tools.

## After a successful repair

Compress or clean the file if it grew, with [Compress PDF](/compress-pdf). Save a fresh, clearly named copy and retire the damaged original once you have checked the result.

## Summary

1. Repair rebuilds the structure first, and redraws pages as images if that fails.
2. Redrawn pages lose selectable text; use OCR to get it back.
3. Bookmarks and some form fields are not kept.
4. Unreadable pages cannot be recovered; keep the original.
