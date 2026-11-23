---
title: How to password-protect a PDF
description: Encrypt a PDF with a password on your device, choose what people may do once it is open and learn why a forgotten password cannot be recovered.
published: 2026-11-22
tools: [protect]
updated: 2026-11-23
---

**Short answer:** [Protect PDF](/protect-pdf) encrypts a PDF with AES-256 in your browser, behind a password people must type to open it, and lets you choose whether printing, copying and editing are allowed. How well it holds up depends mostly on the password, so use a long one.

Email is not private. An attachment can sit in several inboxes, backups and servers, and a PDF sent without protection can be opened by anyone who gets hold of it. A password changes that: without it, the file is unreadable. This guide explains how to protect a PDF on your own device, how to choose a password that holds up and what the different permissions do.

## How to protect a PDF with LeafLock

The PDF is encrypted in your browser, on your device. Neither the file nor the password is sent to us.

1. Open [Protect PDF](/protect-pdf) and choose your file.
2. Type the password people will need to open it.
3. Choose what people may do once it is open: print, copy, edit.
4. Protect and download the new file.

Your original stays unprotected, so keep it somewhere safe or delete it if it should not exist unprotected.

## How strong is it?

The file is encrypted with AES-256. How well it holds up depends mostly on your password, because that is the part an attacker can guess. A short or common password makes the encryption nearly pointless.

- Use a long password, a phrase of several unrelated words is better than a short string of symbols.
- Do not reuse a password from your email or bank.
- Do not include your name, birthday or the file's name.

## Send the password separately

Never put the password in the same message as the file. Send it by another channel: a text message, a phone call, a different app. If both travel together, anyone who sees the email can open the file.

## If you forget the password

Then nobody can open the file, including us. We do not have the password and the tool cannot recover it. Keep the password in a password manager, or keep an unprotected copy of the file in a safe place.

## Permissions: printing, copying, editing

You can choose what people may do after they open the file. PDF readers are asked to honor these limits, but some ignore them. Only the open password truly protects the file. Treat permissions as a request, not a guarantee.

The **permissions password** is a second password used to change those limits. If you do not set one, a random one is used.

## Already protected?

- If the PDF **needs a password to open**, remove that with [Unlock PDF](/unlock-pdf) first, then protect it with the new one. See [how to unlock a PDF you have the password for](/guides/how-to-unlock-a-pdf).
- If the PDF only **restricts printing or editing**, you can protect it directly.

## What protection does not do

- It does not hide the file's existence or name.
- It does not remove hidden information: the author, dates and other properties stay in the file, though they are encrypted. Strip them first with [Remove metadata](/remove-metadata) if they should not exist.
- It does not remove sensitive content. If something should not be in the document, redact it before protecting; see [how to redact a PDF properly](/guides/redact-pdf-properly).

## Order of operations

1. Finish all editing, signing and compression. Many tools cannot work on a locked file.
2. Strip metadata if needed.
3. Protect as the last step.
4. Test: open the protected file and confirm the password works.

## Summary

1. Encryption is AES-256; the password is the weak point.
2. Send the password through a different channel from the file.
3. A forgotten password cannot be recovered.
4. Permissions are a request to the reader; only the open password protects.
