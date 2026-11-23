---
title: How to compress a PDF for email
description: Why PDFs get too big to email, what compression actually changes, how to choose a level, and what to do when compressing doesn't make the file smaller.
published: 2026-10-21
tools: [compress, split, extractPages]
updated: 2026-11-23
---

**Short answer:** To get a PDF under an email limit, run it through [Compress PDF](/compress-pdf) at the Recommended level: it shrinks the images, which are what make most PDFs large, and leaves text and vector drawings alone. Aim for under 10 MB for email, and try the Strong level if the file is still too big.

You attach a PDF, select Send, and the email bounces back: the attachment is too large. Or an online form refuses your upload because it's over the limit. This guide explains why PDFs get big, how to make them smaller without making them unreadable, and what to do when compression isn't enough.

## Why some PDFs are so large

A PDF is a container. Its size depends on what's inside, and in most large PDFs the answer is **images**.

- **Text and vector drawings are small.** A 50-page report exported from a word processor is often well under 1 MB. Text is stored as characters and font data, and charts drawn as shapes take little space.
- **Photos and scans are large.** Every scanned page is a full image. A page scanned in color at 600 DPI can be several megabytes by itself, and a 20-page scan quickly reaches 50 MB or more.
- **Phone photos are larger still.** Modern phone cameras produce images with many millions of pixels. Put ten of them in a PDF and the file grows fast.
- **Embedded fonts add a little.** Usually this is small compared to images, but documents using many fonts can carry a few extra megabytes.

So the main way to make a PDF smaller is to make its images smaller. That's what most PDF compression tools do, including ours.

## How big is too big?

Limits vary by email service and by organization. Many email services cap attachments around 20–25 MB. Your employer's or recipient's mail server may set a lower limit, and online forms often accept much less, sometimes only a few megabytes.

Email attachments also grow by roughly a third when they're encoded for sending, so a 20 MB file can count as more than 25 MB. A safe rule:

- For email, aim for **under 10 MB** where you can.
- For a form with a stated limit, aim a little **below that limit**.

## How to compress a PDF with LeafLock

[Compress PDF](/compress-pdf) runs in your browser, so the file isn't uploaded anywhere.

1. Open [Compress PDF](/compress-pdf) and choose your file.
2. Pick a compression level (see below).
3. Select **Compress PDF**. You'll see the size before and after, and how many images were made smaller.
4. If the result is small enough, download it. If not, try a stronger level.

## What the compression levels change

Compression reduces two things about each image: its **resolution** (how many pixels it has) and its **quality** (how much detail is kept when it's saved as a JPEG). Text and vector drawings aren't changed at any level, so they stay sharp.

- **Light:** keeps images large and high quality. The file gets smaller, but not dramatically. Choose this if the document will be printed, or if it contains detailed images such as plans or photos that must stay crisp.
- **Recommended:** reduces images to a size that still looks good on a laptop or phone screen. This is the right choice for most email attachments.
- **Strong:** makes images much smaller and lower quality. Photos look softer, and very small print in scans may get harder to read. Use it when you need the smallest possible file, then check the result.

Always open the compressed file and read a page or two before sending it, especially at the strong level. Zoom in on anything that matters, like account numbers, small print or signatures.

If an image is already small or already well compressed, it's left as it is. Making it smaller would only lower the quality without saving space.

## When compression won't help

Sometimes compression barely changes the size, or the tool reports that the file is already well compressed. Common reasons:

### The PDF is mostly text

If a document has few or no images, there's little for compression to work on. A text-only PDF that's still large usually has many embedded fonts or a lot of pages. In that case, consider sending only the pages that matter.

### The images are already compressed

Some scanners and apps already save images at low quality. Compressing them again saves little and can make them look worse.

### The file is just long

A 300-page scanned book will be large even after compression. Instead of trying to squeeze it into one email:

- **Split it.** Use [Split PDF](/split-pdf) to divide the document into parts, and send them in separate emails.
- **Send only what's needed.** Use [Extract pages](/extract-pages) to make a smaller PDF with just the relevant pages.
- **Use a file-sharing link.** Many email services can send a link to a file in cloud storage instead of an attachment. Bear in mind this puts the file on someone else's server.

## Prevent big files in the first place

A few habits keep PDFs small from the start:

1. **Scan at 200–300 DPI.** That's enough for documents to be clear on screen and in print. Higher settings mostly add size.
2. **Scan in grayscale or black and white** when color doesn't matter. A color scan is often several times larger.
3. **Export from the original app** when you can. A PDF made directly from a word processor is far smaller than a scan of a printout.
4. **Crop photos before converting them.** If you're turning photos into a PDF with [JPG to PDF](/jpg-to-pdf), crop away the table or floor around the document first.

## A note on privacy

The documents people compress for email are often the sensitive ones: payslips, bank statements, ID scans, signed contracts. A compression tool needs full access to the file, so it's worth knowing whether it uploads it. With LeafLock, compression happens on your device. To check this, or any other site, see [how to check if a PDF site uploads your files](/guides/how-to-check-if-a-pdf-site-uploads-your-files).

## Summary

1. Large PDFs are almost always large because of images.
2. Many email services cap attachments around 20–25 MB; aim for under 10 MB to be safe.
3. Use [Compress PDF](/compress-pdf) at the recommended level first, then check the result.
4. If compression doesn't help, split the file or send only the pages you need.

Related: [How to merge PDFs without uploading them](/guides/merge-pdf-without-uploading).
