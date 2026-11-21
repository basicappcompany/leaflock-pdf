# Launch listings: copy for Product Hunt, AlternativeTo, SaaSHub, Capterra and G2

Ready to paste. **Nothing here has been submitted**: each site needs the owner's account, and a listing is
outward-facing. Prepared 22 November 2026.

**Before posting:** recheck the figures marked ⟳ (`pnpm counts`, `src/lib/pricing.ts`), and check each site's *current*
field limits, because they change. Every length below is a ceiling to cut down from, not a promise about a form.
Post after the privacy policy and terms have lost their draft notice (`docs/legal-fill-in.md`): every listing points at
them, and a reviewer who clicks through will see the placeholders.

## What every listing may and may not say

Everything below comes from the product's own pages (`/security`, `/claims`, `/verify`, the tool FAQs and the seven
`/compare` pages). Keep it that way.

**Safe to claim**
- The work happens in the browser, on the visitor's device; files are not uploaded.
- The page can be checked: `/verify` shows every request, shows the browser refusing an off-site connection, and has an
  offline test. The Content-Security-Policy is `connect-src 'self'`.
- No analytics, advertising or third-party scripts on the site.
- Works offline once a tool has loaded; installable.
- Free core tools, no account needed, no watermark, no file-size limit. ⟳ Daily allowance: 20 tools a day without an
  account, 60 with a free account.
- ⟳ 43 tools in four groups (Organize, Convert, Edit and sign, Protect and optimize); six of them are Practice tools.
- Nine other languages, machine-translated and labelled as such.

**Do not claim** (each is something the product states it does *not* do)
- A "legally binding" or certificate-based digital signature. Sign PDF places an image of a signature.
- Word or Excel output that matches the PDF's layout. PDF to Word keeps paragraphs, headings, bold, italic and lists;
  tables, images, exact fonts and layout do not come across.
- OCR in languages other than English.
- A security certification or audit. There is none (no SOC 2, no ISO).
- That cropping or white-out removes content. Only Redact PDF does.
- "Nothing can leave your device." Use "your files are not uploaded" and point at `/verify`. (A test in the repo bans the
  stronger phrasing, because a browser extension or a compromised device is outside what the site controls.)

## Core facts

| | |
|---|---|
| Name | LeafLock PDF |
| URL | https://leaflockpdf.com |
| Category | PDF tools; document management; privacy |
| Pricing model | Freemium |
| Free | Every core tool, no account, no file-size limit |
| Paid ⟳ | Pro $4 / month or $24 / year; Practice $249 / year; Business edition (self-hosted) $499 / company / year. Plans start 1 January 2027; every tool is free until then |
| Platforms | Any modern browser on desktop, phone or tablet; installable as a web app |
| Deployment | Cloud (in the browser); self-hosted Business edition |
| Languages | English, plus Hindi, Bengali, Portuguese (Brazil), Indonesian, Russian, German, Spanish, French, Turkish (machine-translated) |
| Seller of record | Dodo Payments |
| Contact | hello@leaflockpdf.com |

## Taglines

- 60 characters or fewer: **Private PDF tools that run in your browser** (46)
- Alternative: **PDF tools that never upload your files** (43)
- 100 characters or fewer: **Free PDF tools that run in your browser, so your files are never uploaded.** (80)

## Short description (about 160 characters)

Merge, split, compress, sign, convert and OCR PDFs. Everything runs in your browser, so your files are never uploaded. Free, no account needed.

## Medium description (about 500 characters)

LeafLock PDF is a set of free PDF tools that run entirely in your browser: merge, split, compress, rotate, sign, fill forms, OCR, and convert to and from Word, Excel and images. Your files are processed on your own device and are never uploaded, and you can check that yourself: the site shows every request it makes, asks your browser to block an outside connection, and keeps working offline. No account, no watermark, no file-size limit. Professional tools (redact, compare, batch, Bates numbering, PDF/A, table extraction) are in the paid Practice plan.

## Long description (about 1,000 characters)

Most online PDF tools send your file to their servers first. LeafLock PDF does the work in your browser, so there is nothing to upload.

That is a claim you can test. Every page tells your browser it may only connect back to leaflockpdf.com, and the browser enforces it. A live page, "See it for yourself", reads your browser's own record of the requests the page made, tries to reach another site so you can watch the browser refuse, and has an offline test. There are no analytics, advertising or third-party scripts.

The free tools cover the everyday jobs: merge, split, extract and remove pages, rotate, crop, reorder, compress (including to a target size such as 200 KB), convert PDF to and from Word, Excel, images, text and Markdown, OCR for English, sign, fill forms, watermark, page numbers, password protection, repair and metadata removal. Professional tools are in the Practice plan: redact, compare two versions, batch processing, Bates numbering, PDF/A and table extraction.

The Business edition runs on your own network for teams that cannot use the internet for documents.

## Feature list (for Capterra and G2 feature fields)

- Merge, split, extract, remove, rotate, crop and reorder pages
- Compress to a level or to a target file size
- Convert PDF to Word, Excel, JPG/PNG, text and Markdown; Word, Excel, CSV, RTF and images to PDF
- OCR (English) to make scans searchable
- Sign PDF (image signature), fill forms, edit and annotate
- Password protection (AES-256), unlock, repair, flatten
- Remove metadata and annotations
- Redact, compare, batch, Bates numbering, PDF/A, table extraction (Practice)
- Works offline; installable; no file uploads

## Honest limitations (put these in the "cons" or "limitations" field if there is one)

- Word and Excel conversions rebuild the document and do not reproduce complex layouts, tables or images.
- OCR recognizes English only for now.
- Signatures are images, not certificate-based digital signatures.
- Very large files depend on the device's memory, because the work happens there.
- Translations are machine-made.

## Site-specific notes

### Product Hunt
- **Name:** LeafLock PDF. **Tagline:** use the 46-character line above.
- **Description:** the short description, trimmed to the field limit.
- **Topics:** choose PDF, Privacy and Productivity if they are offered.
- **First comment (maker):** write it yourself. It should be in your own voice and say why you built it; the facts
  above are the material. Do not paste the description.
- Needs a maker account, a thumbnail and a launch day you choose.

### AlternativeTo
- List it as an alternative to **iLovePDF, Smallpdf, Adobe Acrobat, Sejda, PDF24, pdfFiller and Stirling-PDF**. Those
  are the seven `/compare` pages, each of which names the sources checked.
- Tags: PDF, privacy, offline, browser-based. The site asks for a license: choose proprietary / freemium.
- The "differentiator" line: *Runs in the browser and does not upload your files; you can verify it.*

### SaaSHub
- Tagline and short description above. Add the same alternatives. Pricing: freemium with the paid prices ⟳.

### Capterra and G2
- Both want a product description, a feature list, pricing, deployment, supported languages and screenshots. Use the
  medium description, the feature list and the core facts table.
- **Both verify the vendor** before a listing is published, and both ask for a company name and a business email. The
  legal entity is still a `[TO CONFIRM]` in the privacy policy, so settle that first.
- Do not ask friends or colleagues for reviews. Both sites have rules about incentivised or conflicted reviews.
- Screenshots to prepare: the home page, `/verify` with the request list showing, a tool mid-use, the pricing page.
