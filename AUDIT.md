# AUDIT — security, SEO/AEO/GEO, growth (started 14 November 2026)

Status key: **fixed** / **already fine** / **needs owner** / **not started**

## Ground rules check
| Account | Result |
|---|---|
| GitHub (`basicappcompany/leaflock-pdf`, private) | already fine: `gh` signed in as `basicappcompany`, git email basicappcompany@gmail.com |
| Cloudflare (Pages host + DNS) | already fine: dashboard shows "Basicappcompany@gmail.com's Account" |
| Google | already fine: signed in as basicappcompany@gmail.com |
| Domain registrar | **needs owner**: not identified from the Cloudflare Registrations page (list did not render in page text); `docs/TODO.md` §0 still has auto-renew + registrar 2FA open |

## Part A
**A1 grades** — not started (securityheaders.com / Observatory not yet run).

**A3 live headers (curl, 14 Nov 2026)** — home, `/merge-pdf/`, `/pricing/` identical:
- already fine: `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy: same-origin`, `frame-ancestors 'none'` (header), `Permissions-Policy: camera=(self), microphone=(), geolocation=()`.
- CSP body is a `<meta>` tag: `default-src 'self'; connect-src 'self'; worker-src 'self' blob:; img-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'self'; script-src 'self' 'wasm-unsafe-eval' + sha256 hashes`. No `unsafe-inline`/`unsafe-eval`. Matches the brief.
- needs owner / decision: **HSTS is `max-age=31536000` without `includeSubDomains`**. Not changed: it affects every subdomain (mail, any future one); say yes and I add it in `public/_headers`.
- gap vs brief: Permissions-Policy allows camera on every page, not only scan-to-PDF; no `payment=()`. `Referrer-Policy: no-referrer` is stricter than required (fine).
- gap: `frame-ancestors` only works as a header (it is), but the rest of the CSP is meta-only, so non-HTML responses carry no CSP. Low risk.

**A4 libraries** — `pdfjs-dist 6.4.299` (far above the 4.2.67 fix), `@cantoo/pdf-lib 2.11.1`, `tesseract.js 7.0.0`, `@tesseract.js-data/eng 1.0.0`. `isEvalSupported` is **not set anywhere in `src`** → to do: set `false` in `src/lib/pdfjs.ts`. Licences page vs list: not yet compared.

**A11** — `/.well-known/security.txt` already live (contact + expiry 2027-11-01): already fine. `/llms.txt` already live (Part B10): already fine, content not yet reviewed.

**Not started:** A2 network proof on ten tools, A5 tool correctness tests (redact, metadata, protect, unlock, flatten/PDF-A), A6 innerHTML/eval scan, A7 service worker, A8 paid-plan review, A9 forms, A10 GitHub/Cloudflare settings (Dependabot, secret scanning, branch protection, TLS, Bot Fight, DNSSEC, SPF/DMARC — all account changes; do them with you watching).

## Part B / Part C
Not started. `robots.txt` today is `User-agent: * / Allow: /` + sitemap (already fine in effect; explicit AI-bot groups still to add). Date "free until 31 December 2026" locations: to be listed when Part B8 runs.

## Where I stopped
After the ground-rules check and a header/library baseline. No code or live settings were changed.

## Update — later on 14 November 2026
- **fixed:** `isEvalSupported: false` added to `getDocument` in `src/lib/pdfjs.ts` (not yet deployed or browser-tested; run `pnpm test` and `pnpm test:e2e` before shipping).
- **already fine:** git history scan for `sk_live`/`sk_test`/`whsec_`/private keys: only hit is a base64 *test fixture* `whsec_` in a unit test. No live secrets found.
- **already fine:** service worker (`public/sw.js`): same-origin, `basic`-type, non-206 responses only; old caches deleted on activate by build id; `sw.js` served `no-cache`; vendor cache is versioned. Not yet checked: scope/path takeover, that user files are never cached (no code path found, not tested).
- **needs review:** `innerHTML` uses — `src/components/ToolsSidebar.astro:361,400` and `dashboard/DashboardPanel.tsx:49` (`dangerouslySetInnerHTML` of `toolIcons[tool]`). The latter looks like static icon SVG, not user data; confirm. No `eval(`/`new Function` found in `src` or `functions`.
- **not started** (unchanged): A1 grades, A2 network proof, A5 tool correctness, A8 paid plans, A9 forms, A10 account settings, all of Part B and C, OUTREACH.md.
