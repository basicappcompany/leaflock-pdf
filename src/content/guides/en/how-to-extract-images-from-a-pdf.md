---
title: How to extract images from a PDF in their original quality
description: Pull the photos and pictures embedded in a PDF out as separate files, unchanged where possible, and why that differs from saving pages as images.
published: 2026-11-22
tools: [extractImages]
updated: 2026-11-23
---

**Short answer:** [Extract images](/extract-images-from-pdf) pulls out the pictures already embedded in a PDF: JPEG images come out unchanged as `.jpg` and losslessly stored ones as `.png`, so extraction itself loses no quality. That differs from [PDF to JPG](/pdf-to-jpg), which draws whole pages as pictures.

A brochure has a photo you want to reuse. A report has a chart image you need for a slide. A scanbook is a pile of pictures in a PDF wrapper. Screenshotting the page loses quality and drags in everything around the image. Extracting pulls out the pictures the PDF already contains. This guide explains how that works, what you get and which images cannot be extracted.

## Extracting versus saving pages as images

These are two different jobs.

- **[PDF to JPG](/pdf-to-jpg)** renders each whole page as a picture, text and all. You get a picture of the page, at the resolution you choose.
- **[Extract images](/extract-images-from-pdf)** takes out only the photos and pictures already embedded in the PDF, leaving text as text. You get the original images back, not a screenshot.

Use extraction when you want the images themselves. Use page rendering when you want the page as it looks.

## How to extract images with LeafLock

Everything happens in your browser, on your device. The PDF is not uploaded.

1. Open [Extract images](/extract-images-from-pdf) and choose your PDF.
2. Run the extraction.
3. Download the images, one by one or as a set.

## What file types you get

- An image stored in the PDF as JPEG comes out as a **.jpg**, unchanged. It is the exact compressed data the PDF already held, not a re-compression. So there is no quality loss from extraction itself.
- An image stored losslessly comes out as a **.png**.

That keeps the original quality, which is the main reason to extract rather than screenshot.

## Images that cannot be extracted

A few ways of storing images in a PDF are not decoded:

- CMYK and indexed-color images
- 16-bit images
- Fax-compressed scans (CCITT)
- JPEG2000 images

The result tells you how many images were skipped, rather than pretending everything came out. If a skipped image matters, render that page with PDF to JPG at a high resolution as a fallback.

## Why you might see more, or fewer, images than expected

A PDF can store one picture in pieces, reuse one picture many times or hold decorations such as thin lines, logos and backgrounds as images. So the count may not match what you see on the page. Browse the results and keep the ones you want.

Also, text that looks like an image, such as a logo drawn as vector shapes, is not an image in the file. It will not be extracted.

## Scanned documents

In a scanned PDF, each page is one big image, so extracting gives you the page scans back as pictures. That is useful if you need to re-process the scans. To get the words, run [OCR PDF](/ocr-pdf) instead.

## Rights and permissions

Extracting an image does not give you the right to reuse it. Photos in a brochure or report may be licensed or copyrighted. Use images you own, are licensed to use or have permission for.

## After extracting

- **Rebuild a PDF from chosen images** with [JPG to PDF](/jpg-to-pdf); see [how to turn photos into a PDF](/guides/how-to-turn-photos-into-a-pdf).
- **Shrink them** with your image editor before reusing them on the web.
- **Check privacy:** images may include metadata, such as a camera model or location, from the original file.

## Summary

1. Extraction returns the embedded pictures, not page screenshots.
2. JPEG images come out unchanged as .jpg; lossless ones as .png.
3. Some storage types are skipped, and the result says how many.
4. Check you have the right to reuse the images.
