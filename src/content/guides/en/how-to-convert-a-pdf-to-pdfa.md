---
title: How to prepare a PDF for long-term archiving as PDF/A
description: What PDF/A is, what this tool adds and removes to get to the PDF/A-2b profile, and the one requirement, font embedding, no tool can fix for you.
published: 2026-11-22
tools: [pdfToPdfA]
---

Some institutions will not accept just any PDF. Courts, tax authorities, archives and procurement portals often ask for PDF/A, a restricted flavor of PDF built to look the same decades from now. This guide explains what PDF/A is, what this tool does to move a file towards it and the honest limit on what a tool can promise.

## What PDF/A is

PDF/A is an ISO standard for archiving. Its purpose is that a document opens and looks the same in the future without depending on anything outside the file. To get that, it forbids things that rely on the outside world or can change behavior: JavaScript, encryption, external content and fonts that are not stored inside the file.

## Which level: PDF/A-2b

[PDF to PDF/A](/pdf-to-pdfa) targets **PDF/A-2b**. It is the level most archive and compliance intake systems expect, and it allows features such as transparency and JPEG2000 that the older PDF/A-1b rejects in real-world files. The "b" means basic visual reproducibility. The stricter "a" level also requires the document's structure to be fully tagged, which a conversion cannot invent.

## What the tool does

- **Embeds a color profile** (an ICC output intent), so colors are defined inside the file.
- **Writes the PDF/A-2b identification** into the file's metadata.
- **Removes what PDF/A forbids outright:** JavaScript, actions that run on open and embedded files.

## What it cannot promise

It does **not** guarantee the file will pass PDF/A validation. No tool can honestly promise that for an arbitrary existing PDF.

The requirement it cannot fix is **font embedding**. PDF/A needs every font actually used to be stored in the file. If your PDF refers to a font it never embedded, the tool reports that rather than claiming conformance. The result lists any such fonts.

The fix is at the source: re-export the document from the program that created it with the option to embed all fonts, then convert again.

## How to convert with LeafLock

Everything happens in your browser, on your device.

1. Open [PDF to PDF/A](/pdf-to-pdfa) and choose your file.
2. Convert.
3. Read the result, especially any font warnings, and download the file.
4. If your recipient has a validator, run the file through it.

## Password-protected files

Unlock first. PDF/A forbids encryption of any kind, including a restriction-only password that normally opens without being asked for one. Use [Unlock PDF](/unlock-pdf); see [how to unlock a PDF you have the password for](/guides/how-to-unlock-a-pdf).

## Before you convert

1. **Finish editing.** Merge, delete, reorder and compress first.
2. **Remove what should not be archived,** such as sensitive hidden data, with [Remove metadata](/remove-metadata).
3. **Keep the source.** An archive copy is one version; keep the editable original too.
4. **Ask what the recipient needs.** Some want PDF/A-1b or PDF/A-3; this tool produces PDF/A-2b.

## Checking the result

Use the recipient's own validator if they gave you one, or a free validator you trust that runs on your device. Check the document looks as expected on screen. Fonts and colors should be unchanged, but verify.

## Why do it on your device

Archived documents are often official records, contracts and filings. Converting in your browser means they are not sent to a server on the way to the archive.

## Summary

1. PDF/A is built for long-term, self-contained archiving.
2. This tool targets PDF/A-2b: color profile, identification and removal of forbidden content.
3. It cannot embed missing fonts; it tells you which are missing.
4. Unlock encrypted files first; validate where it matters.
