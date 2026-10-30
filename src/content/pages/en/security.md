---
title: How your files stay private
description: LeafLock PDF processes files in your browser and never uploads them. Here's how that works, and how to check it yourself with your browser's developer tools.
updated: 2026-10-21
---

When you use a LeafLock PDF tool, your file is processed by code running in your own browser. It is not uploaded to us or to anyone else. This page explains how that works, what is and isn't stored on your device, and how you can verify all of it yourself without taking our word for it.

## How it works

A LeafLock PDF page is a set of ordinary web files: HTML, JavaScript, WebAssembly and fonts. Your browser downloads them from leaflockpdf.com, the same way it downloads any website.

When you choose a file, the browser reads it from your disk into the page's memory. The tool's code works on it there and builds the result in memory too. When you select download, the browser saves that result straight to your device. At no point does the file, its name or its text travel over the network.

Some tools do heavier work in a background thread of the browser (a "web worker") so the page stays responsive. That thread runs on your device as well.

[Scan to PDF](/scan-to-pdf) can use your device's camera. The camera feed is handled inside the page in the same way and is never sent anywhere. The camera turns off when you leave the tool.

## Verify it yourself

You don't need to trust this page. Your browser can show you every request a website makes, and every rule the website has asked the browser to enforce. Here's how to check both.

### Step 1: Open the developer tools

Open any LeafLock PDF tool, for example [Merge PDF](/merge-pdf), then open your browser's developer tools:

| Browser | Windows and Linux | Mac |
|---|---|---|
| Chrome | F12 or Ctrl+Shift+I | Cmd+Option+I |
| Edge | F12 or Ctrl+Shift+I | Cmd+Option+I |
| Firefox | F12 or Ctrl+Shift+I (Ctrl+Shift+E opens the Network tab directly) | Cmd+Option+I (Cmd+Option+E opens the Network tab directly) |
| Safari | Not available | Cmd+Option+I, after turning on Safari > Settings > Advanced > "Show features for web developers" |

On phones and tablets, the developer tools are only available by connecting the device to a computer, so these steps are easiest on a desktop or laptop.

### Step 2: Watch the Network tab

1. Select the **Network** tab in the developer tools.
2. Reload the page, so you see every request from the start. The list fills with the files that make up the page.
3. Now use the tool: choose a file, run the tool and download the result.
4. Look at the list again. Any new entries are files the tool itself needs, such as a script, a font or, for [OCR PDF](/ocr-pdf), the text-recognition model. Select any request to see its details. Every one goes to leaflockpdf.com and asks for one of our files; none of them carries your document.

Two things that might look surprising but are expected:

- **Entries starting with `blob:` or `data:`.** These are not network requests. They're how the browser refers to data that already exists in the page's memory, such as a page preview or the file you're about to download.
- **Requests made before you chose a file.** Pages load their tools in pieces, sometimes only when they are first needed. These are downloads from our site to you, not uploads.

### Step 3 (optional): Go offline

For a stronger test, cut the page off from the network entirely:

1. Run the tool once, so every file it needs has been loaded.
2. In the Network tab, change the throttling setting (it usually says "No throttling") to **Offline**, or simply disconnect from Wi-Fi.
3. Run the tool again on a different file.

It still works, because nothing needs to leave your device. Remember to switch throttling back to "No throttling" afterward.

### Step 4: Read the Content-Security-Policy

The Network tab shows what the page did while you watched. The Content-Security-Policy shows what the page is allowed to do at all.

1. Open the page source: Ctrl+U on Windows and Linux in Chrome, Edge and Firefox; Cmd+Option+U on Mac in Chrome, Edge and Safari; Cmd+U on Mac in Firefox. In Safari, the Develop menu must be turned on first (see step 1).
2. Search the source (Ctrl+F or Cmd+F) for `Content-Security-Policy`.
3. You'll find a `<meta http-equiv="content-security-policy" ...>` tag near the top. Inside it is the rule `connect-src 'self'`.

In plain words, `connect-src 'self'` tells your browser: "Code on this page may only open network connections to the site it came from, leaflockpdf.com." The browser enforces this, not us. If any script on the page, ours or anyone else's, tried to send data to another server, the browser would block the attempt and show an error in the developer tools' Console tab.

A few other rules in the same policy back this up:

- `default-src 'self'` and `script-src 'self'`: scripts, styles and other files can only be loaded from leaflockpdf.com, so no third-party code can be pulled into the page.
- `form-action 'self'`: forms can only be submitted to our own site.
- `object-src 'none'`: old-style browser plugins are blocked.
- `'wasm-unsafe-eval'`: allows the browser to run WebAssembly, which the PDF and OCR engines use. It does not allow JavaScript `eval()`.
- Values starting with `sha256-`: fingerprints of the few small scripts written directly into our pages, such as the one that applies your theme before the page appears. The browser runs an inline script only if it matches one of these fingerprints exactly.

Our server also sends a few protective headers that a meta tag can't express. You can see them by selecting the first request (the page itself) in the Network tab and opening its response headers. They include `Referrer-Policy: no-referrer`, so other sites you click through to aren't told which page you came from, and `frame-ancestors 'none'`, so other sites can't embed our pages in a frame.

## What is stored on your device

LeafLock PDF stores very little, and all of it stays on your device:

- **Your light or dark theme choice**, if you pick one, saved in your browser's localStorage under the key `theme`. If you go back to following your system setting, the key is removed.
- **Recent work, if you turn it on.** A finished file, kept in your browser's own storage (IndexedDB) for five minutes, one hour, twenty-four hours, or a length you choose on a paid plan. Off until you enable it, deleted when it expires, and clearable at any time. It never leaves your device.
- **A session cookie, if you sign in**, named `__Host-leaflock_session`. It identifies your session and carries nothing else.
- **The OCR language model**, after you use [OCR PDF](/ocr-pdf) for the first time. It's a file of about 10 MB that teaches the OCR engine to recognize English text. Your browser saves it in its own storage (IndexedDB) so it doesn't have to download it again. It contains nothing about your documents.

Like any website, your browser may also keep copies of our pages and scripts in its normal cache to load them faster next time.

You can remove all of this at any time by clearing site data for leaflockpdf.com in your browser's settings.

We never store your files, file names, page text or results **on our servers**. On your own device, nothing is kept either unless you turn on recent work (above), which keeps a finished file in your browser's storage for a length you choose and then deletes it. Otherwise, when you close the tab they're gone from the page's memory.

For the full list of claims, each with how to check it and what would change it, see [Our claims](/claims).

## What we don't do

- **No uploads.** The tools never send your files to us or anyone else.
- **No file logs.** We have no record of which files you open, what they're called or what they contain, because that information never reaches us.
- **No third-party scripts.** There are no analytics, advertising, social media or chat widgets on the site. All code comes from leaflockpdf.com.
- **Error reports carry nothing of yours.** If a tool fails because of a bug, a short technical report goes to our own server. Your file names, page text and anything you typed are removed in your browser first, and we don't store your IP address. The [privacy policy](/privacy#error-reports) lists exactly what a report contains.
- **No tracking cookies.** Signed out, the site sets no cookies at all. If you sign in, one session cookie identifies your session and nothing else. See the [Cookie policy](/cookies).
- **No account needed.** Every core tool works with no account and no sign-in. An account exists if you want a higher daily limit or a paid plan, and holds an email address, your plan and sign-in metadata — not a profile of what you do.

## All files come from our own site

Some tools need extra files at run time: fonts and color profiles that the PDF engine uses to draw pages, the WebAssembly engines for PDF rendering and OCR, and the OCR language model. All of these are served from leaflockpdf.com itself. None are loaded from a public CDN or another company's server, and the Content-Security-Policy described above would block them if they were.

## Honest limits

Processing in the browser removes the biggest risk, which is your file sitting on someone else's server. It can't protect against everything:

- **Browser extensions can see the page.** Extensions you've installed may be able to read the content of pages you visit, including a document open in a LeafLock PDF tool. Our Content-Security-Policy applies to the page, not to extensions. If you work with sensitive files, review your extensions and remove any you don't need, or use a browser profile or private window with extensions turned off.
- **Your device needs to be secure.** If your computer or phone is infected with malware, or someone else has access to it, no website can keep your files safe. Keep your operating system and browser up to date.
- **Downloaded results are ordinary files.** Once a result is in your downloads folder, it's protected only as well as anything else on your device. Delete copies you no longer need.
- **Our servers still see normal web traffic.** Like any website, our hosting provider receives requests for our pages, with details such as your IP address and browser type. Those requests never include your files. The [Privacy policy](/privacy) explains what's processed.

## Questions or a security concern

If you think you've found a security problem, or something on this page doesn't match what you see in your browser, please tell us. See [Contact](/contact). Please don't send us your documents: we never need them to look into a problem.
