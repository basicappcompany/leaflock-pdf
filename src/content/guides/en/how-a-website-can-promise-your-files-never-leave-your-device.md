---
title: How a website can promise your files never leave your device, and prove it
description: Browser-side processing, the Content-Security-Policy that stops a page connecting elsewhere, and the limits a fair claim has to admit.
published: 2026-11-22
tools: []
---

"Your files never leave your device" is an easy sentence to write and a hard one to stand behind. This article explains how a website can actually be built so that it is true, what mechanism the browser itself enforces and where an honest claim has to stop. It is written for anyone who wants to judge such a promise, whoever makes it.

## The basic design: work happens in the page

A tool page is a set of ordinary web files: HTML, JavaScript, WebAssembly and fonts. Your browser downloads them, the same as for any site. When you choose a file, the browser reads it from your disk into the page's memory. The tool's code works on it there, builds the result in memory and, when you select download, the browser saves it to your device.

Heavier jobs can run in a background thread of the browser, called a web worker. That thread also runs on your device. Nothing in this design needs the file to go anywhere, which is the point: the only way to guarantee a file is never uploaded is to build something that does not need to upload it.

## A promise is not a mechanism

A site could do all of that and still contain code that sends a copy somewhere. So "the tool works in the browser" is not the whole story. The stronger question is what the page is *allowed* to do, and who enforces it.

## The Content-Security-Policy

A Content-Security-Policy (CSP) is a rule set that a website gives to your browser, and the browser enforces it. The relevant rule here is `connect-src 'self'`. In plain words: code on this page may only open network connections to the site the page came from.

If any script on the page, whether the site's own or anyone else's, tried to send data to another server, the browser would refuse and show an error in the Console tab of the developer tools. The enforcement is by the browser, not by the site.

Other rules in the same policy support it:

- `default-src 'self'` and `script-src 'self'`: scripts, styles and other files can only come from the site itself, so no third-party code can be pulled in.
- `form-action 'self'`: forms can only be submitted to the same site.
- `object-src 'none'`: old browser plugins are blocked.
- `'wasm-unsafe-eval'`: allows WebAssembly, which PDF and OCR engines use. It does not allow JavaScript `eval()`.
- `sha256-` values: fingerprints of the few small scripts written directly into pages. An inline script runs only if it matches one exactly.

## Why everything has to come from one site

A strict CSP forbids loading fonts, engines and models from a public CDN or another company's server. So everything a tool needs at run time has to be served from the site itself: the PDF engine's fonts and color profiles, the WebAssembly engines and, for OCR, the language model. It is a constraint that makes the claim checkable, because there is only one place anything can come from.

## What the policy does and does not rule out

This is where a fair claim has to be careful.

- It rules out a document going to a **third party**.
- On its own it does **not** rule out a document going to the **site itself**, since `'self'` permits connections to the site. What rules that out is that no code on the site sends one.

How would you know? Go offline. If a tool needs the site's server to work, it stops working when you disconnect. If it keeps working, nothing it does depends on the file going anywhere. That is why the offline test is the strongest simple check: run the tool once so everything is loaded, disconnect, and run it again on a different file.

## Things a page cannot promise

An honest version of the claim also states its limits:

- **Browser extensions can read the pages you visit**, including a document open in a tool. The CSP governs the page, not extensions.
- **A compromised device is not safe** whatever the website does.
- **Normal web traffic still reaches the host.** Requests for the page's own files carry details such as your IP address and browser type. They never include your files.
- **A test shows one visit.** It is not an audit and it is not a certification.

## How to check it yourself

1. **Read your browser's request record.** The page [See it for yourself](/verify) reads it back to you, asks the browser to break the rule so you can watch it refuse, and has an offline test.
2. **Use the developer tools.** Watch the Network tab while you use a tool, and search the page source for `Content-Security-Policy`. [Step by step](/guides/how-to-check-if-a-pdf-site-uploads-your-files).
3. **Read the claims.** [Our claims](/claims) lists each statement we make with how to check it.

## What to ask of any site that makes the claim

1. Does it publish a CSP, and does `connect-src` allow only the site itself?
2. Does it load scripts or fonts from other companies?
3. Does it work offline once loaded?
4. Does it say what it cannot protect against?

A site that answers yes to the first, no to the second and yes to the third and fourth has done more than say the words. Related: [seven questions to ask before you upload a PDF](/guides/seven-questions-to-ask-before-you-upload-a-pdf).
