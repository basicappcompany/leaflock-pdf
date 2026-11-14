---
title: 'LeafLock vs Stirling-PDF: privacy compared'
description: "LeafLock PDF vs Stirling-PDF: self-hosting, where files are processed, what you maintain, team pricing and air-gapped use."
competitor: Stirling-PDF
checkedOn: 2026-11-01
sources:
  - label: Stirling-PDF on GitHub
    url: https://github.com/Stirling-Tools/Stirling-PDF
  - label: Stirling pricing
    url: https://www.stirling.com/pricing
---

Stirling-PDF is the closest thing to a direct competitor LeafLock has, and the comparison is not the usual one. Stirling does not upload your files to someone else's service either: it is open source and you can run it yourself, which is a genuinely private answer and a good one.

So this page is about a narrower question than "who uploads your files". It is: **what do you have to run, and what can still go wrong with it?**

Everything we say about Stirling-PDF comes from its own GitHub repository and pricing page, linked under each section and in the sources for this page.

## At a glance

| | LeafLock PDF | Stirling-PDF |
| --- | --- | --- |
| Where files are processed | In your browser, on your device | On a server — but one you run yourself if you self-host |
| What you deploy | Nothing; it is a website | A server application, for example `docker run … stirling-pdf` |
| Open source | No, closed source | Yes, open source |
| Free tier | All tools free, no account needed | "$0, /month", "No card required", "60+ PDF tools" |
| Self-hosting | The Business edition: static files, no server | Free and supported |
| Team plan | Business edition, flat per organization | "$99, /month" for "100 users included", adding SSO |
| Air-gapped | Business edition is static files | Listed under the Enterprise plan |

## Where your files are processed

**Stirling-PDF.** Its repository describes the product as a way to "Edit, sign, redact, convert, and automate PDFs without sending documents to external services". That claim is true and worth taking seriously — if you self-host, the only server involved is yours.

The qualifier is in the same sentence: there is a server. Stirling is deployed as an application, for example with `docker run -p 8080:8080 docker.stirlingpdf.com/stirlingtools/stirling-pdf`. Your documents are uploaded to it, processed there, and it is yours to run, patch and secure.

**LeafLock.** All processing runs in your browser. There is no server to send files to, ours or yours. The file is read, changed and saved on your device, and the site's Content Security Policy sets `connect-src 'self'`, so the browser itself blocks the page's scripts from sending data elsewhere. You can watch it refuse on our [verifiability page](/verify).

The honest summary of the difference: **Stirling means your documents go to a machine you trust. LeafLock means they go nowhere.**

## What you have to run

**Stirling-PDF.** A container or a desktop client, kept patched, with whoever administers it responsible for access, backups and updates. For many teams that is entirely normal and the open-source license makes it free.

**LeafLock.** Nothing, in the hosted case — it is a website. For the self-hosted [Business edition](/business), what you deploy is the **static build**: HTML, JavaScript and WebAssembly served by any web server you already run. There is no application server, no database and no outbound connection, so there is no service to patch and no stored data to breach. That is the difference the Business edition is actually sold on, and it is also its honest limit: you still have to serve files from somewhere.

## Tools

**Stirling-PDF.** Its pricing page advertises "60+ PDF tools" on the free plan, and the repository describes 50+ covering editing, merging, splitting, signing, redacting, converting, OCR and compression.

**LeafLock.** A smaller set, every one of them running on the visitor's device. We would rather not ship a tool at all than ship one that quietly uploads your file, which is the constraint that sets the count.

If tool count is your deciding factor, Stirling wins it and we would not argue.

## Price

**Stirling-PDF.** Its pricing page lists a Free plan at "$0, /month" with "No card required", "60+ PDF tools", "Web, desktop, and self-hosted" and "1,000 monthly credits to automate PDF work". The Team plan is "$99, /month" with "100 users included", adding "Single sign-on (SSO)", a team workspace and central control of the tool catalogue. Enterprise is "Custom", adding "Air-gapped deployment", "SCIM provisioning", "Data residency and audit logs" and "Uptime SLAs".

**LeafLock.** Every core tool is free with no account. The professional set — redaction, Bates numbering, compare, batch, table extraction and PDF/A — sits in a paid tier and is free during early access. The self-hosted [Business edition](/business) is licensed per organization with no limit on the number of people using it; the current price is on that page.

Worth stating plainly rather than spinning: **Stirling's free tier is free, self-hostable and open source, and nothing we sell undercuts free.** Where the comparison turns is on what an organization has to operate, and on whether the air-gapped option sits behind a custom enterprise agreement or is simply what the product is.

## Open source

**Stirling-PDF.** Open source, with the code and its license in the repository.

**LeafLock.** Closed source. That is a real disadvantage here and we will not dress it up: you cannot audit our code the way you can Stirling's. What you can audit is the behaviour — the network panel, the Content Security Policy, and whether the tools keep working with the network switched off. [Our claims](/claims) lists every one of those checks, including what they do *not* prove.

## Which one fits you

Stirling-PDF may suit you better if you want open source, the largest tool count, a server you control, and a team already comfortable running and patching a container.

LeafLock may suit you better if you would rather have **nothing to operate** — no container, no database, no service to patch — and want the privacy property to hold on any device with a browser, including for the people in your organization who will never deploy anything.
