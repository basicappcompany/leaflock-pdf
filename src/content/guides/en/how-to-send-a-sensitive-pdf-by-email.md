---
title: How to send a sensitive PDF by email without oversharing
description: "A step-by-step routine: remove what should not be there, clean hidden data, fit the size limit, add a password and send the password another way."
published: 2026-11-22
tools: []
author: founder
updated: 2026-11-23
---

**Short answer:** Send only the pages the recipient needs, remove hidden data, lock in any filled form, shrink the file, protect it with a password and send that password by another route, then check the file you are about to send. Each step has a tool, and the whole routine is below.

Email is the most common way to send a PDF and one of the least private. A message can sit in several inboxes, backups and servers, and an attachment is copied with it. If the document is a contract, a medical letter or anything with account numbers, a few minutes of preparation changes what the recipient, and anyone else who sees the message, can learn. This routine works for most documents, and every step can be done on your own device.

## 1. Decide what the recipient needs

Ask what the recipient actually has to see. Often it is only part of the document.

- **Whole pages that should not go:** remove them with [Remove pages](/remove-pages), or keep only the ones you need with [Extract pages](/extract-pages).
- **Details on a page that should not go** (an account number, an address, a name): that needs redaction, not a black box. See [how to redact a PDF properly](/guides/redact-pdf-properly), then use [Redact PDF](/redact-pdf).

Do this first, because every later step works on the result.

## 2. Remove what is hidden

A PDF carries more than its pages: author, software, dates, comments and sometimes scripts or attachments. [What is hidden inside a PDF](/guides/what-is-hidden-inside-a-pdf) lists them.

- To remove comments, highlights and drawings: [Remove annotations](/remove-annotations).
- To remove author, dates, the XMP packet, the document ID and per-page leftovers, plus scripts and attachments if you choose: [Remove metadata](/remove-metadata).

If you would rather keep sensible values than blank ones, set a clear title and author with [Edit metadata](/edit-metadata).

## 3. Lock in a filled form

If the document is a form you have filled in, turn the answers into fixed page content so they are not changed by accident: [Flatten PDF](/flatten-pdf), or lock them in when you save with [Fill PDF form](/fill-pdf-form). Remember that flattening does not hide anything. It makes the content permanent.

## 4. Make it fit

Many email services cap attachments around 20 to 25 MB, and an attachment grows by roughly a third when it is encoded for sending. Aim under 10 MB where you can. [Compress PDF for email](/compress-pdf-for-email) targets that size, and [how to compress a PDF for email](/guides/compress-pdf-for-email) explains the levels. If the file is still too large, split it with [Split PDF](/split-pdf) and send it in parts.

## 5. Add a password

A password means the file is unreadable without it, even if the message ends up somewhere you did not intend. [Protect PDF](/protect-pdf) encrypts the file with AES-256 on your device. A few rules:

- Use a long password that is hard to guess, such as a phrase of unrelated words.
- Do not reuse a password from another account.
- A forgotten password cannot be recovered, by anyone, so keep a copy of the unprotected file somewhere safe.
- Treat the printing, copying and editing limits as a request: some readers ignore them. Only the open password truly protects the file.

Details are in [how to password-protect a PDF](/guides/how-to-password-protect-a-pdf).

Do this step last. Most tools cannot work on a locked file, and you would have to remove the password to continue.

## 6. Send the password another way

Never put the password in the same message as the file. Anyone who sees that email can open the attachment. Use a different channel: a text message, a phone call, a chat on another app.

## 7. Check the file you are about to send

Open the final file, not the original, and look at it as the recipient will.

1. Scroll every page.
2. Search for the names and numbers you meant to remove.
3. Open the properties in a reader.
4. Open it with the password to confirm the password works.
5. Check the file name. A name like `contract-final-v3-REDACTED.pdf` can say more than you intend, so choose one that tells the recipient what it is and nothing else.

If you have the original and the cleaned version, [Compare PDF](/compare-pdf) shows what changed between them, which is a good way to confirm only the intended things were removed.

## 8. Remember what you cannot take back

Once sent, a copy exists on other systems. Deleting your sent message does not delete the recipient's. If the content is truly sensitive, consider whether email is the right channel at all, and whether the recipient needs a copy or only needs to see it.

## The whole routine at a glance

1. Remove pages and redact details.
2. Remove metadata and comments.
3. Flatten any filled form.
4. Compress to fit.
5. Password-protect.
6. Send the password separately.
7. Check the final file.

## Why do it on your own device

Every tool above is one you would be pointing at a sensitive document. If a tool uploads the file to process it, the preparation itself becomes another place the document is copied. Using tools that work in your browser keeps the document on your device until you attach it yourself.
