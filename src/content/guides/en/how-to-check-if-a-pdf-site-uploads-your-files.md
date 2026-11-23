---
title: How to check if a PDF site uploads your files
description: A step-by-step method to see whether an online PDF tool sends your files to a server, using your browser's developer tools, offline mode and the CSP.
published: 2026-10-21
tools: [merge, compress, sign, redact, ocr]
updated: 2026-11-23
---

**Short answer:** Open your browser's developer tools, select the **Network** tab, run the tool on a harmless test PDF and look for a request about as large as the file: an upload shows up there. A stronger test is to go offline, since a tool that still works offline cannot depend on sending your file anywhere.

Many online PDF tools say your files are "secure" or "private". That can mean two very different things:

- **The file is uploaded** to the company's servers, processed there, and deleted later.
- **The file never leaves your device.** The website sends code to your browser, and your browser does the work.

Both can be legitimate, but with contracts, medical records or tax forms you should know which one you're using. You don't have to take anyone's word for it, including ours. Your browser can show you what a page sends.

The method works in Chrome, Edge, Firefox and Safari, on any website. You'll need a desktop or laptop, because mobile browsers don't include developer tools.

## Before you start: use a harmless test file

Never test with a real confidential document. Make a test PDF instead:

1. Open any document or web page that contains nothing private.
2. Print it to PDF ("Save as PDF" or "Microsoft Print to PDF" in the print dialog).
3. Make it fairly large (2 MB or more) by including a few photos. A big file makes an upload easy to spot.

Note the file's exact size. You'll look for that number later.

## Method 1: watch the Network tab

The Network tab in your browser's developer tools lists every request a page makes: scripts, images, fonts, analytics and, if it happens, the upload of your file.

### Open the developer tools

1. Go to the PDF tool's page, but don't choose a file yet.
2. Open the developer tools:
   - **Chrome and Edge:** press F12, or Ctrl+Shift+I (Cmd+Option+I on a Mac).
   - **Firefox:** press F12, or Ctrl+Shift+E (Cmd+Option+E on a Mac).
   - **Safari:** turn on Safari > Settings > Advanced > "Show features for web developers", then press Cmd+Option+I.
3. Select the **Network** tab.
4. Turn on **Preserve log** (Chrome, Edge) or **Persist logs** (Firefox, in the gear menu), so the list survives page changes.
5. Select the clear button so the list starts empty.

### Run the tool with your test file

Use the tool as normal with your test PDF, and download the result.

### Find the upload

An upload has a few clear signs:

- **Method.** Uploads almost always use `POST` or `PUT`. Right-click the column headers to show the **Method** column if it's hidden. Requests that load the page are usually `GET`.
- **Size.** Open each `POST` request and check how much was sent. An upload is roughly as large as your file: a 3 MB PDF produces a request of about 3 MB, not a few kilobytes.
- **Payload.** In the request's **Payload** or **Request** section, an upload often shows `multipart/form-data`, your file name, or a long run of binary data.
- **Filters.** The **Fetch/XHR** filter shows requests made by scripts, where most uploads appear. Check **All** as well.

Some sites upload in pieces, so you may see several medium-sized `POST` requests instead of one large one. Add up their sizes. Others upload to a different domain, such as a cloud storage service, so check the **Domain** column too.

### What a local tool looks like

With local processing, the page downloads its code and then goes quiet while it works. You may see small analytics requests, but nothing near the size of your file.

The download is a clue as well. A local tool usually creates the result in the browser, so the download link starts with `blob:` rather than pointing to a server.

## Method 2: go offline and try again

This test is simple and hard to fool.

1. Load the PDF tool's page while you're online, and wait until it has fully loaded.
2. Disconnect: turn off Wi-Fi, unplug the network cable, or switch on airplane mode. Or, in the Network tab, change **No throttling** to **Offline**.
3. Choose your test file and run the tool.

If the tool still finishes and gives you a correct result, the work happened on your device. A tool that has to upload your file will fail, hang, or show a connection error.

Two caveats:

- Some local tools download extra parts only when first needed, such as an OCR text model. If a feature fails offline, run it once online with a test file, then repeat the offline test.
- Passing proves the processing is local. It doesn't prove the page won't send something once you reconnect. Methods 1 and 3 cover that.

## Method 3: read the site's Content Security Policy

A Content Security Policy (CSP) tells your browser what a page may load and where it may send data. The browser enforces it, which makes a strict CSP stronger than a promise in a privacy policy.

### Find the policy

1. In the Network tab, select the first request in the list (the page itself).
2. Open **Headers** and look under **Response Headers** for `content-security-policy`.
3. If it's not there, view the page source (Ctrl+U, or Cmd+Option+U in Safari) and search for `Content-Security-Policy`. Some sites set the policy in a `<meta http-equiv>` tag instead.

### What to look for

The policy is a list of directives separated by semicolons. The key one here is `connect-src`, which controls where the page's scripts may send data.

- `connect-src 'self'` means scripts may only talk to the site that served the page.
- A list of other domains means scripts may also send data there.
- With no `connect-src`, the browser uses `default-src`. If neither exists, there's no limit.

Data can leave a page in other ways too, so glance at these:

- `form-action` limits where forms can be submitted.
- `img-src` limits where images load from. Data can be hidden in an image's address, so a short list is better.
- `default-src 'self'` sets a strict baseline for anything not listed separately.

A CSP can't tell you everything. `connect-src 'self'` still allows the page to send data to its own server. So a strict CSP narrows the question to one place, and you still need Method 1 or 2 to see whether that server receives your file. A site with no CSP may still be fine, but you have nothing enforced to rely on.

## Putting it together

For the best answer, use all three methods:

1. **Network tab:** no request close to your file's size, and none that contains it.
2. **Offline test:** the tool still works without a connection.
3. **CSP:** a strict `connect-src`, so the browser blocks sending data elsewhere.

If a site passes all three, your file stayed on your device. If it fails the first two, it uploads your files. That isn't automatically bad, but then read how long it keeps them and where. Websites change, so recheck from time to time.

## Try it on LeafLock

LeafLock PDF is built to pass these tests. Every tool processes files in your browser, and our policy sets `connect-src 'self'`. We'd rather you check than trust us: open the Network tab and try [Merge PDF](/merge-pdf), [Compress PDF](/compress-pdf) or [OCR PDF](/ocr-pdf) with a test file.

Related guides:

- [How to merge PDFs without uploading them](/guides/merge-pdf-without-uploading)
- [How to redact a PDF properly](/guides/redact-pdf-properly)
