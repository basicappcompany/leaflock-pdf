---
title: "Working with PDFs offline: what it takes and what it proves"
description: How browser-based PDF tools keep working with no connection, what to load first, what does not work offline and why going offline is the simplest privacy test.
published: 2026-11-22
tools: []
updated: 2026-11-23
---

**Short answer:** A browser-based PDF tool keeps working offline once it has loaded, because the page, its code and the PDF engine are already on your device; a tool that uploads your file cannot. Load the tool once first, and note that some tools need extra downloads and some features do not work offline.

Aeroplane mode, a train through a tunnel, a client's network with a firewall: sooner or later you need to deal with a PDF and the internet is not there. Whether a PDF tool keeps working in that moment says a lot about how it is built. This article explains how offline PDF work is possible in a browser, how to prepare for it and what it does and does not tell you.

## Why an offline tool is a different kind of tool

A tool that uploads your file to a server cannot work offline. It has nothing to upload to. A tool that does the work in your browser can, because everything it needs is already on your device once it has loaded: the page, the code, the PDF engine and its fonts.

That is also why going offline is the simplest privacy test available. If the tool needs a connection to process your file, you will find out immediately. If it keeps working with the network off, nothing it does depends on the file going anywhere.

## How to prepare

The key is to **run the tool once while you are still online**, so everything it needs has been downloaded.

1. Open the tool you expect to use, for example [Merge PDF](/merge-pdf) or [Compress PDF](/compress-pdf).
2. Use it once on any file. Pages load their tools in pieces, sometimes only when first needed, and running it triggers those downloads.
3. Do the same for each tool you will need. A tool you have never opened has not been loaded.
4. Then disconnect and use it again, on a different file.

Tools you have already used still work, because the work happens on your device.

## Install it as an app

The site can be installed from your browser's menu or address bar as an app, which gives it its own window and an icon. It uses the same files, so everything above still applies: run the tools you need before you go offline.

## Tools with extra downloads

Some tools need more than code.

- **OCR.** [OCR PDF](/ocr-pdf) loads an English text-recognition model of about 10 MB the first time you use it, from the site itself. Your browser keeps it in its own storage so it does not need to download it again. Run OCR once online, and it works offline afterwards. It recognizes English only for now.
- **Other tools** may fetch fonts, color profiles or WebAssembly engines the first time. All of them come from the same site.

## What does not work offline

Anything that needs an account or a server cannot work without a connection:

- Signing in, and anything that depends on being signed in.
- Buying or managing a plan.
- Sending feedback or contacting us.
- Features that sync your account, such as starred tools following you to another browser.

The PDF tools themselves are the part that works offline.

## Test it, on purpose

A good habit before travelling or visiting a client:

1. Open each tool you will need and run it once.
2. Switch to aeroplane mode, or in your browser's developer tools set the Network throttling to **Offline**.
3. Run each tool again on a different file.
4. Switch the network back on, and remember to turn throttling back to "No throttling" if you used it.

If a tool fails offline, you have found out at your desk and not on the train.

## What offline does and does not prove

It proves the tool can process a file without a connection. That is strong evidence the work happens on your device. It does not prove there is no code anywhere that could send something when you are online, which is why a second check is worth doing: the browser's own rule about where a page may connect, which you can see in [See it for yourself](/verify) and in [how a website can promise your files never leave your device](/guides/how-a-website-can-promise-your-files-never-leave-your-device).

It also says nothing about the safety of your device. A phone or laptop with malware is not safe offline either.

## Practical limits

- **Memory.** Everything runs on your device, so very large files depend on how much memory it has. A laptop copes with a big merge more comfortably than an older phone.
- **Battery.** OCR and large conversions are heavy. Plug in if you can.
- **Saving results.** Downloaded files go to your device's downloads folder, so you will need space there.

## A good offline kit

For most work away from a connection, these cover it: [Merge PDF](/merge-pdf), [Split PDF](/split-pdf), [Compress PDF](/compress-pdf), [Sign PDF](/sign-pdf) and [OCR PDF](/ocr-pdf). Load each once, and you can handle most documents anywhere.

Related: [seven questions to ask before you upload a PDF](/guides/seven-questions-to-ask-before-you-upload-a-pdf).
