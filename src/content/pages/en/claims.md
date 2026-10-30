---
title: What we claim, and how to check it
description: "Every privacy claim LeafLock PDF makes, written to be quoted: what stays on your device, the five things we receive, what the browser forbids, and what would change each one."
updated: 2026-10-30
---

This page exists to be quoted. Each claim below is written so it can be copied into a security questionnaire, a procurement review or an assistant's answer without losing its meaning, and each one says how to check it and what would change it.

Phrases like "nothing leaves your browser" are now used by services that do upload files. So we have tried to write claims specific enough to be wrong: if any statement here stops matching the product, that is a defect, and [we want to hear about it](/contact).

## The one-sentence version

> Every LeafLock PDF tool runs on your own device, and nothing leaves your device unless you ask it to.

Note the last five words. They are deliberate, and they are the difference between a claim that stays true and one that expires. Today no feature sends a document anywhere. When one does, it will be a feature you turn on for a particular file. What we will not do is send a document because it was convenient for us.

## What stays on your device

**Claim: your files, their names and their text are processed entirely in your browser, and we never receive them.**

The tool's code runs in the page. The browser reads your file from your disk into the page's memory, the code works on it there, and the result is handed back to the browser to save. No step crosses the network.

- **How to check it:** watch the Network tab while you run a tool, then run it again with the network switched off. [Step-by-step instructions](/security).
- **What would change it:** a feature that uploads a document. The only one planned is described under [What is planned](#what-is-planned), and it would be opt-in per file and encrypted in your browser before it left.

## What the browser forbids

**Claim: the page is not permitted to send your file anywhere, and your browser is what enforces that.**

Every page ships a Content-Security-Policy containing `connect-src 'self'`. In plain words: code on this page may only open network connections back to leaflockpdf.com. The browser blocks anything else, whether that code is ours or something that found its way onto the page.

- **How to check it:** view the page source and search for `content-security-policy`. [Where to look](/security).
- **What this does not prove:** `connect-src 'self'` permits a connection to *our own* site. It rules out a document going to a third party; on its own it does not rule out a document going to us. That is why the claim above is about what the code does and this one is about what the browser allows. They are different guarantees, and only both together are worth anything.
- **What would change it:** loosening `connect-src`. It is set in one place in the site's build configuration, and any change to it is visible to you with the steps above.

## Everything we receive

This list is meant to be exhaustive. If you find something we receive that is not on it, that is a bug in this page.

1. **A request that counts one tool run**, if you are not on a paid plan. The browser posts to `/api/usage/claim` **with no request body at all** — no tool name, no file, nothing about what you did. The server adds one to a counter and replies with how many runs are left. Without an account the counter is keyed to a salted hash of your IP address, never the address itself.
2. **An account, if you create one.** An email address, when you last signed in, which plan you are on, and — depending on how you sign in — a password hash or your Google account id. No name, no company, no address.
3. **A crash report, if a tool fails.** It carries the tool's name, the page path, your browser family and version (for example "Chrome 141"), and the error message and stack trace with file names, page text and anything you typed removed in your browser first. Your IP address is not stored. The [privacy policy](/privacy) lists the fields.
4. **Ordinary web server logs**, the kind every website receives: a request for a page or a script, with an IP address and a browser string. These never contain your documents.
5. **A payment, if you buy a plan** — taken by Dodo Payments as the seller. We receive which plan you are on and when it renews. We never see your card details.

**What is not on that list, and never has been:** analytics, advertising, social or chat widgets, third-party scripts of any kind, and any record of which files you opened or what they contained.

## What is stored on your device

**Claim: LeafLock PDF can keep files on your device, and keeping them there is not the same as uploading them.**

This is the distinction this page exists to make legible, because the honest answer is not "nothing is stored".

- **Recent work, if you turn it on.** A finished file can be kept in your browser's own storage for five minutes, one hour, twenty-four hours, or a length you choose on a paid plan. It is off until you enable it, it expires on its own, and you can clear it whenever you like. It never leaves your device, so the claims above are unaffected.
- **The OCR language model**, after you first use [OCR PDF](/ocr-pdf) — about 10 MB, kept so it is not downloaded twice. It contains nothing of yours.
- **Your light or dark theme choice**, if you pick one.
- **A session cookie, if you sign in**, named `__Host-leaflock_session`. It identifies your session and nothing else. Signed out, the site sets no cookies at all, which is why you see no cookie banner. See [Cookies](/cookies).

You can remove all of it by clearing site data for leaflockpdf.com in your browser's settings.

## What is planned

**Claim: we will tell you before a claim on this page changes.**

One planned feature will change what this page can say, and we would rather name it now than have it arrive as a surprise:

- **Keeping a file on our server, encrypted in your browser.** Opt-in, for one file at a time, on paid plans. The file would be encrypted on your device before upload, with the key placed in the link's fragment — the part of a URL that browsers never send to a server — so what we hold is ciphertext we cannot read.

When that ships, "we never receive your files" becomes "we never receive your files unless you choose to store one, and then only as ciphertext". That is a real change. It is also why the one-sentence version says *unless you ask it to* rather than claiming that nothing *can* ever leave your device. That stronger sentence is true today, would be false then, and sits on the one page written to be quoted verbatim — so it would be quoted back at us after it expired. We would rather publish the sentence that survives.

## Honest limits

A claim is worth less if it implies more than it covers:

- **Browser extensions can read the page**, including a document open in a tool. The Content-Security-Policy governs the page, not extensions. For sensitive work, use a browser profile or private window with extensions turned off.
- **A compromised device defeats any website.** If malware is running on your machine, nothing a web page does will protect your files.
- **Downloaded results are ordinary files** on your device, protected only as well as everything else there.
- **We hold no security certification** at this time. Our audit scope is unusually small, because we hold almost no data — but a small scope is not a certificate, and we will not imply otherwise.

## For a security review

If you are filling in a questionnaire, these are the answers most of them ask for:

| Question | Answer |
|---|---|
| Where is document content processed? | In the browser, on the end user's own device |
| Is document content transmitted to the vendor? | No |
| Is document content stored by the vendor? | No |
| Is document content stored on the device? | Only if the user turns on recent work, with an expiry they choose |
| What personal data is held? | Email address, plan, sign-in metadata; a salted IP hash for rate limiting |
| Sub-processors | Hosting, email and payment providers, named in the [privacy policy](/privacy) |
| Third-party scripts or trackers | None |
| Technical control preventing exfiltration | `connect-src 'self'`, enforced by the browser |
| Data processing agreement | Click-through, on the Practice and Business plans |
| Security certification | None at this time |

A longer version, with the verification steps a reviewer can run themselves, is on [Security and privacy](/security). If something here does not answer your question, [ask us](/contact) — a question this page cannot answer is a gap in the page.
