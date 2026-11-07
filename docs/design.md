# LeafLock PDF — design and system reference

Written 23 October 2026. The point of this file is that a new session (or a new person)
can read it and understand how the whole thing fits together without reading the code
first: what exists, how it is wired, what the security and payment configuration actually
is, and what is deliberately not built.

Three companion files, kept separate on purpose:

| File | Holds |
| --- | --- |
| `CLAUDE.md` | The rules. Non-negotiables, conventions, commands. Read first. |
| `docs/roadmap.md` | Where the product is going, in six phases. |
| `docs/TODO.md` | Everything stubbed or waiting on an external account. |
| `docs/legal-checklist.md` | What a lawyer has to settle before launch. |

This file describes the **present tense**. When something here stops being true, change it.

---

## 1. What the product is

Browser-based PDF tools. Every byte of document processing happens on the visitor's own
device; the server stores and sees no files, no file names and no page text. The product
is closed source, sells a Pro plan and a self-hosted Business edition, and will launch
when the whole roadmap is done rather than in stages.

**The commercial shape of that promise**: iLovePDF (~217–265M visits/month) is largely
ad-funded, and its Premium tier sells "ad-free". We can never run ads — `connect-src
'self'` forbids every ad network — so our free tier is lead generation and our revenue is
subscriptions. The upside is structural: iLovePDF pays for 16M+ documents a day of server
compute, and our marginal cost per job is zero.

## 2. Status at a glance

**Working, tested:** every tool in `src/tools/registry.ts` · auth by email link, password
and Google · D1-backed usage metering · `/dashboard` · Dodo checkout and webhook ·
scrubbed crash reporting · OG image generation · sitemap, canonicals, hreflang, nine
JSON-LD types · **installable and offline** (§4a) · **llms.txt and llms-full.txt** (§4b) ·
**a CI-enforced performance budget** (§4c) · **category hub pages** at `/tools/<category>`
with their own schema (§4d) · **the device-local recent-work shelf** (§4e) · **the tools
sidebar and a 15-skin picker** (§10, §10a).

**Counts are not kept here.** Run `pnpm counts`. This paragraph used to open "25 tools
(22 free, 3 Pro) … 215 unit tests, 177 browser tests" against a real 43 and 475/246 — it
had been wrong for days, in the one section of this document written to tell a reader what
exists (`docs/process.md` §8).

**Live and proven since 31 October 2026:** `.github/workflows/ci.yml` runs the type check,
`pnpm tracker`, the unit tests and the full Playwright suite on push and PR. First run was
green in 8m11s on `ubuntu-latest`, with 275 browser tests in 4.3m and no retries used — so
the one step that had no local equivalent, `playwright install --with-deps chromium` on a
fresh runner, is now tested rather than assumed. Remote is `basicappcompany/leaflock-pdf`,
private.

**Built but switched off:** paid plans (`paidPlansAvailable = false` in
`src/lib/pricing.ts`). Checkout answers 503 until the Dodo keys exist.

**Not real yet:** Google OAuth credentials are `dummy-…`; `RESEND_API_KEY`, `EMAIL_FROM`
and `DODO_API_KEY` are absent from `.dev.vars`; `wrangler.toml` has
`database_id = ""`, so no remote D1 exists; the legal text is unreviewed. All of it is in
`docs/TODO.md` and belongs to roadmap Phase 6.

## 3. Architecture

A static Astro build on Cloudflare Pages, plus a handful of Pages Functions. There is no
SSR: every page is prerendered at build time.

```
Browser                                  Cloudflare Pages
┌────────────────────────────┐           ┌──────────────────────┐
│ Astro page (static HTML)   │ ───────▶  │ static assets        │
│  └ React island (client:*) │           │                      │
│      └ runPdfJob(...)      │           │ functions/api/*      │
│          └ pdf.worker.ts   │  fetch ▶  │   └ D1 (DB binding)  │
│          └ pdfjs.ts (main) │           └──────────────────────┘
└────────────────────────────┘
      all document work                   never sees a file
```

- **Pages** come from `src/pages/`. Tool pages are generated for every registry entry by
  `src/pages/[tool].astro`; `compare/[slug].astro` and `guides/[slug].astro` come from
  content collections in `src/content/`.
- **Islands.** Astro ships zero JS by default. Interactive parts are React, mounted
  `client:only="react"` — `ToolApp` per tool page, `AuthNavLink` in the header (so React
  is on every page), `DashboardApp`, the auth panels.
- **Worker.** Most operations run in `pdf.worker.ts` via `runPdfJob(name, args, onProgress)`
  (`src/lib/pdf/client.ts`), keeping pdf-lib work off the main thread. Anything needing
  rendering goes through `src/lib/pdfjs.ts` on the main thread instead, because pdf.js
  needs a canvas.
- **Functions** (`functions/api/`) exist only for things a device cannot do for itself:
  identity, metering, payment and crash reports. Nothing per-job and nothing
  file-related.

**Development note that costs people an hour:** `pnpm dev` serves the Astro site only —
Pages Functions do not run, so every `/api/*` call 404s and anything behind a session
appears broken. Use `pnpm build && pnpm exec wrangler pages dev dist` for that. The same
is true of the Playwright suite, which runs against `astro preview`; tests that need an
endpoint stub it (`tests/e2e/dashboard.spec.ts` is the example).

## 4. The privacy contract

This is the product, so it is enforced in four places rather than promised in one:

1. **CSP**, declared in `astro.config.mjs` and emitted into every page.
   `default-src 'self'`, **`connect-src 'self'`**, `img-src 'self' blob: data:`,
   `media-src 'self' blob:`, `worker-src 'self' blob:`, `object-src 'none'`,
   `base-uri 'self'`, `form-action 'self'`. Scripts get `'self'` plus
   `'wasm-unsafe-eval'` — that allows compiling WebAssembly (pdf.js, tesseract.js) while
   leaving `eval()` blocked. Loosening any directive needs the owner's explicit approval.
2. **Vendored assets.** Everything fetched at runtime — pdf.js fonts and wasm, OCR models
   — is copied into `public/vendor/` at build time by `integrations/vendor-assets.mjs` and
   served from our own origin. No CDN, which is also why `connect-src 'self'` is possible
   at all.
3. **Nothing per-job server-side.** `/api/usage/claim` learns only that *a* job ran:
   no name, no size, no page count. It fails open (`src/lib/usage.ts`) so a network
   problem never blocks work.
4. **Scrubbed crash reports.** `src/lib/errorReporting.ts` → `functions/api/errors.ts`,
   our origin only, never a third-party tracker. `scrubMessage`/`scrubStack` strip file
   names, quoted text and local URLs; stacks keep only our own frames. Expected problems
   (locked file, wrong password) are not reported — only bugs.

Two consequences worth stating because they look like missing features: we cannot offer
AI summarising, translation or chat-with-PDF (all of which the three big competitors now
ship), because each sends page text to a server. And we cannot run analytics or ads.

A fifth place the contract shows up is **what the device itself keeps** — §4e below, since
storing a file on the visitor's own machine is the one form of retention that leaves all
four points above intact.

## 4a. Offline and installable (roadmap Phase 1)

A service worker (`public/sw.js`, placeholders filled at build time by
`integrations/service-worker.mjs`) makes the site installable and usable with no network.
Competitors sell desktop apps for this because their processing is server-side; ours was
already local, so the feature is one file plus a manifest.

Three caches, because the three kinds of asset have different lifetimes:

| Cache | Holds | Strategy |
| --- | --- | --- |
| `leaflock-shell-<buildId>` | 52 HTML pages, CSS, icons, the manifest | precached on install; navigations are network-first, cache on failure |
| `leaflock-code-<buildId>` | everything under `/_astro/` | cache-first (content-hashed, so never stale), cached as used — **plus** the job worker chunk, precached |
| `leaflock-vendor-<vendorId>` | `/vendor/` — 26MB of pdf.js and tesseract assets | cache-first, never precached; keyed by package version, so a deploy does not re-download 26MB |

**What this means in practice**, and the distinction matters when writing copy:
every page is navigable offline straight away; a *tool* works offline once it has been
opened once, because a page's chunks are only cached when the worker already controls the
navigation that requests them. `/api/*` is never cached at all — a stale `/api/auth/me`
would show the wrong person as signed in — and `/account`, `/dashboard` and `/login` are
left out of the precache, since their shell offline would only be a permanent spinner.

Two things worth knowing before touching this:

- **The job worker is precached on purpose.** `src/lib/pdf/pdf.worker.ts` is requested
  only when a tool first runs, so without precaching it a visitor could open a tool
  offline and watch the first job fail. `ToolApp` also calls `warmPdfWorker()` on idle,
  which both primes it and takes a megabyte of download off the first click. pdf.js's own
  renderer worker (~1.2MB) is deliberately *not* precached: it is only needed by tools
  that draw previews, and those need the vendored fonts anyway.
- **The registration script must not be `is:inline`.** Astro only hashes the inline
  script in `<head>` (the theme script, which has to be inline to beat first paint); an
  inline script in `<body>` is blocked by the CSP. The registration is a plain `<script>`
  so Astro bundles it into a file, which `'self'` already allows.

`/sw.js` is served `Cache-Control: no-cache` via `public/_headers`: a stale worker would
pin a visitor to an old build indefinitely. The worker does **not** call `skipWaiting()`,
so a new build takes over once the old tabs are gone rather than swapping chunks under a
running React tree.

Icons and the manifest: `scripts/pwa-icons.ts` renders `public/icons/` from
`public/favicon.svg` (`pnpm icons`), with a separate maskable icon because launchers crop
them. `src/pages/manifest.webmanifest.ts` is generated rather than static so its name,
description and shortcuts come from the i18n strings; `theme_color` and
`background_color` are the only two colours in the project that cannot be CSS variables,
because the browser paints the title bar before any stylesheet exists.

Covered by `tests/e2e/offline.spec.ts`: the worker takes control, the site serves from
cache with the network off, a real PDF is merged offline, an uncached URL falls back to
`/offline`, and nothing under `/api/` is ever in a cache.

## 4b. Structured data and AI-rank surface (roadmap Phase 1)

Generators in `src/lib/seo.ts`, emitted as one `@graph` per page by `Base.astro`. The
module's rule is that **every claim must be true**, which is why two of them take the
pricing flags rather than hard-coding anything:

| Page | Emits |
| --- | --- |
| Every page | `Organization`, `WebSite` |
| Tool / landing | `WebApplication`, `HowTo`, `BreadcrumbList`, `FAQPage` |
| Home | `ItemList` of all 25 tools, in registry order |
| Pricing | `Product` with an offer per plan — **only when `paidPlansAvailable`** |
| Guides, comparisons | `Article`, `BreadcrumbList` |

- `webApplication()` takes `tier`, `gated` (`proToolsGated`) and `proPrice`. A Pro tool
  is described as free *only while Pro tools are not gated*; flip the flag and the markup
  stops claiming `isAccessibleForFree` on its own. Claiming free for something behind a
  paywall is what earns a manual action, and the flag will be flipped long after this was
  written — so `tests/unit/seo.test.ts` pins all three combinations.
- `howTo()` is built from each tool's existing `howTo` strings, so the markup cannot
  describe a procedure different from the one the page shows a reader.
- `product()` is gated on `paidPlansAvailable` for the same reason: offers for a plan with
  no checkout behind it would be false.

**`/llms.txt`** (`src/pages/llms.txt.ts`) is a generated map of the site for assistants:
the claim first, in prose written to survive being quoted out of context, then every tool,
landing, guide and policy page. **`/llms-full.txt`** carries the full text — summary,
steps and FAQ — of every tool page in one ~33KB fetch, so an assistant needs one request
rather than 52. Both come from the registry and the i18n strings.

Two decisions worth not re-making:

- **No per-page plain-text mirrors**, though the roadmap originally called for them. Tool
  pages are static HTML: the heading, steps, privacy note and FAQ are already in the
  markup for anything that reads HTML without running JavaScript. Mirrors would add only
  duplicate URLs competing with the real ones. `/llms-full.txt` covers the real gap.
- **Nothing added to `robots.txt`.** `/llms.txt` is found by convention at the root;
  advertising it with an invented directive like `LLM-Index:` would be noise.

## 4c. Performance budget (roadmap Phase 1)

`tests/e2e/performance.spec.ts`, run as part of `pnpm test:e2e` and gated in CI by
`.github/workflows/ci.yml`. Two layers:

- **Per-chunk ceilings**, read straight off `dist/_astro` on disk — no browser needed.
  Every chunk gets a 250KB ceiling except two named exceptions: the job worker
  (`pdf.worker-*.js`, matched the same way `integrations/service-worker.mjs` matches it)
  gets 750KB, and pdf.js's own renderer — identified by the `GlobalWorkerOptions` string
  rather than by filename, since Vite's chunk names can shift on an unrelated dependency
  bump — gets 500KB. Both are legitimately heavy *and* legitimately off the critical
  path: the worker is warmed on idle (`warmPdfWorker()`, §4a), and the renderer is only
  fetched by a tool that actually draws a page preview.
- **Per-page budgets**, measured in a real browser against a representative page of each
  kind (content: home, pricing, a guide, a comparison page; tool: merge, organize,
  OCR, redact) after one warm-up navigation — repeat-visitor numbers, not cold-start
  ones, since the Phase 1 service worker is what most visitors actually get. Checks
  total JS+CSS weight, HTML weight, LCP and CLS (Google's "good" CLS threshold used
  as-is; LCP set far tighter than the real-world 2500ms "good" figure, because CI has
  none of the network latency that threshold accounts for and a loose number here
  would catch nothing).

**This is not a hypothetical safeguard — it already caught a real bug.** Building it
surfaced that `useTask.ts` imported `PdfInputError` from `lib/pdf/load.ts`, which starts
with `import { PDFDocument } from '@cantoo/pdf-lib'`. That pulled the entire library —
569KB — onto the **main thread** of every single tool page, to use one error class.
Fixed by splitting the class into `src/lib/pdf/inputError.ts`, which has no pdf-lib
import; `load.ts` re-exports from it so the worker-side callers (`ops/repair.ts`,
`ops/unlock.ts`, `pdf.worker.ts`, their unit tests) needed no change, while `useTask.ts`,
`OcrTool.tsx` and `lib/pdfjs.ts` now import the light module directly. Measured effect: a
tool page's main-thread JS+CSS dropped from ~1.48MB to ~272KB. The chunk-ceiling test was
verified against the bug itself before this was written up — reverting the fix makes it
fail with the exact file and both sizes named.

### Unused standard fonts are stubbed out of the worker

`integrations/standard-fonts.mjs`, added 28 October 2026 after measuring where the job
worker's weight actually goes. pdf-lib's `standard-fonts/Font.js` imports the metrics for
all fourteen PDF standard fonts eagerly and files them in a lookup object, which defeats
tree-shaking, so all fourteen shipped — while `StandardFonts.Helvetica` is the only one
named anywhere in `src/`. Aliasing the other thirteen to a sentinel stub took the worker
chunk from **253KB to 173KB gzipped** (595KB to 489KB raw), on the one chunk every tool
fetches.

Two things learned doing it, both worth not rediscovering:

1. **The worker is a separate Vite build.** It is created by
   `new Worker(new URL('./pdf.worker.ts', import.meta.url))`, and Vite bundles workers
   with their own plugin list. A plugin in `vite.plugins` never sees the worker's modules
   — which is most of the weight, since the worker is where pdf-lib lives.
2. **`vite.worker.plugins` replaces that list rather than adding to it.** Setting it to
   just our own plugin built and shipped a worker that threw `invalid zlib data` on every
   single job, because the build had lost the plugins that handle dependency interop. The
   fix is `resolve.alias`, which worker builds *do* inherit, so the stubbing reaches the
   worker without changing how it is built.

The stub is a sentinel string rather than plausible-looking metrics, so a future
`embedFont(StandardFonts.Courier)` fails instead of silently drawing wrong glyph widths.
Because pdf-lib's error there is not self-explanatory, two tests guard it:
`tests/unit/standardFonts.test.ts` fails if `src/` starts naming another standard font,
and `performance.spec.ts` fails if the sentinel stops appearing in the built worker —
which is what a dependency bump that renames those files would look like.

## 4d. Category hub pages (roadmap Phase 1)

`src/pages/tools/[category].astro`, one static page per entry in `categories`
(`organize`, `convert`, `edit`, `secure`), at `/tools/<category>`. Nested under `/tools/`
rather than sitting at the top level on purpose: a bare category id at the site root
risks colliding with a future tool or content-page slug, and slugs can never change once
published.

Each hub carries its own `BreadcrumbList` and `ItemList` (`src/lib/seo.ts`, reused
as-is — no new generator needed), a one-line honest description per category
(`common.categoryHub.intro`), and every tool in that category as a card. Linked in from
two places: the home page's category headings (`<h2>`, previously plain text) and every
tool page's breadcrumb, which gained a real middle step — "All tools / Organize /
Merge PDF" instead of "All tools / Organize" with nothing behind "Organize" to click.

Related-tools, the other half of this roadmap item, needed no work: `[tool].astro`
already computed and rendered a "Related tools" section on every tool page before this
phase started — the roadmap's "not started" note was stale.

## 4e. The recent-work shelf (roadmap Phase 2 item 5)

Files the visitor explicitly chose to keep, on their own device. `src/lib/retention/`:
`durations.ts` is the arithmetic, `shelf.ts` the store; `RetentionPicker` offers it and
`RecentWork` lists it. **No network code at all**, which is what keeps `connect-src 'self'`
an honest proof of the claim for everything it holds.

- **IndexedDB, not OPFS.** OPFS's write path differs by engine (`createWritable` against a
  worker-only `createSyncAccessHandle`) and Safari and iOS cannot be tested here, so the
  API with one write path everywhere removes a risk only a user could have found. The bytes
  are already in memory when a job finishes, so OPFS's streaming advantage buys nothing.
- **The expiry is enforced on read, not by a timer.** Nothing runs in a closed tab, so
  "expired" means "deleted the next time anything looks". Every read sweeps first, over an
  `expiresAt` index so expired rows are deleted without their blobs being loaded, and
  nothing past its expiry is ever returned to a caller.
- **Reached all 43 tools through two shared components** rather than 43 edits — the picker
  inside `ResultFiles`, the shelf in `ToolApp` — the same chokepoint approach `ImageList`
  uses to decode HEIC wherever images are accepted. `RetentionPicker` reads the tool id
  from `getActiveTool()` and the plan from `getCachedPlan()` instead of taking props, for
  the reason `recordRun()` takes no argument.
- **On tool pages, not only `/dashboard`.** The dashboard redirects a signed-out visitor to
  login, so the only entrance there would have made a device-local feature account-only.
- **Three bounds, and they are the design.** Opt-in per result; never remembered between
  runs (a persisted preference would keep a later file because of a decision about an
  earlier one); and 5 minutes / 1 hour / 24 hours, with a Pro custom length capped at seven
  days — a platform limit, since browsers evict this storage under pressure without asking.
- Every call degrades to "no shelf" rather than throwing: a private window or blocked site
  data must leave the tools themselves working.

## 4f. Accessibility (roadmap 6.4, audited 30 October 2026)

`tests/e2e/accessibility.spec.ts` is the audit, kept as a spec because a report is true
only on the day it is written. axe-core (MPL-2.0) runs WCAG 2.0/2.1 A and AA over one page
of each kind the generators produce — axe's "best-practice" rules are excluded, being
opinions rather than a standard to fail a build over.

- **axe injects over CDP, so `script-src 'self'` does not block it.** An injected
  `<script>` tag would have been refused and the suite would have tested nothing, so a
  self-test plants an image with no alt and a nameless button and insists both are found.
- **What axe cannot see is tested directly:** keyboard reachability with a visible focus
  ring, the skip link being the first tab stop and leaving its off-screen parking position,
  reflow at 320px (WCAG 1.4.10 — `mobile.spec.ts` only covers 360px), and
  `prefers-reduced-motion`.
- **Reduced motion means movement, not colour.** `global.css` keeps a 0.15s border-colour
  transition under `prefers-reduced-motion` and drops the `translateY` lift, on the stated
  grounds that the colour change carries the affordance. The test asserts that, rather than
  failing every transition — and a companion test checks the lift exists without the
  preference, so the others cannot pass vacuously.
- **`.prose table` is `display: block; overflow-x: auto`** because of this audit: `width:
  100%` does not stop cells' min-content widths pushing a table past its container, which
  took comparison pages 5px over at 320px. That is the only way to give a Markdown-rendered
  table its own scroll container without a rehype wrapper.
- **The stated limit:** axe covers what is machine-detectable, roughly a third of WCAG. It
  says nothing about whether labels read sensibly, whether focus order matches visual
  order, or whether OCR and batch are usable with a screen reader. A person is still owed
  that pass, and `docs/roadmap.md` Phase 6 says so rather than implying this replaced it.

## 5. Anatomy of a tool

Five places, in this order. `MergeTool.tsx` is the reference implementation.

1. **`src/tools/registry.ts`** — id, URL slug, category, `free | pro`. Pages and the home
   grid are generated from this. **Never change a published slug.**
2. **`src/i18n/en/tools/<id>.ts`** — title, meta tags, summary, how-to steps, FAQ, the
   tool's own UI strings and an `errors` map keyed by `ToolError` code. No hard-coded UI
   text anywhere; counted strings go through `plural()`.
3. **`src/lib/pdf/ops/<op>.ts`** — a pure `async (args, ctx) => result` using pdf-lib,
   registered by name in `ops/index.ts`. Throw `PdfInputError` for unreadable or locked
   input, `ToolError(code, values)` for anything the user can fix.
4. **`src/components/tools/<Id>Tool.tsx`** — default export taking `ToolProps<'<id>'>`,
   lazy-loaded by `ToolApp.tsx` so each tool is its own chunk. Built from
   `src/components/ui/`: `FilePicker`, `usePdfDocument`, `useTask` + `TaskStatusView`,
   `ResultFiles`, `PageGrid`, `PagePreview`, `PageRangeField`, `fields.tsx`.
5. **Tests** — unit tests per operation in `tests/unit/` using `tests/fixtures/pdfs.ts`,
   plus a browser test using `watchPage(...).assertClean()`, which fails on any off-site
   request or console error. `tests/e2e/site.spec.ts` checks every tool page loads clean.

`useTask`'s success path also calls `recordRun()` (`src/lib/recentActivity.ts`), which
stores **a tool id and a timestamp** in `localStorage` for the dashboard — never a file
name, deliberately, because a list of document names on disk is its own exposure.

## 5a. What `copyPages` does not copy

`copyPages` is the foundation of merge, split and `assemble` (the shared core of Remove,
Extract, Rotate and Organize), and three of its behaviours are not visible from its name.
Each cost real exploration to find; they are written down so the next operation that
copies pages inherits the answer instead of re-deriving it.

1. **Nothing that hangs off the catalog comes across.** A page's content, resources and
   annotations arrive because they are reachable from the page object. `/Outlines`
   (bookmarks), `/AcroForm` (the list that makes widget annotations behave as fields) and
   the Info dictionary (title, author, subject, keywords) hang off the *catalog*, so they
   are simply absent from the output. That is why `outlines.ts`, `forms.ts` and
   `metadata.ts` exist: each reads the structure from the source and rebuilds it on the
   destination. The copied form is the sharpest case — the widgets arrive, so the page
   still *looks* like a form, while no reader recognises a single field.
2. **A fresh `PDFObjectCopier` per call, so an object reached two ways is copied twice.**
   The copier dedupes within one `copyPages` call but keys its cache on whatever it was
   handed: a page passed in as a root is cached by its dictionary, the same page reached
   through a reference is cached by that reference, and the two never meet. So a Link
   annotation whose `/Dest` points at another page produces an independent orphan copy of
   that page — *even when that page is being copied in the same call* — and the link ends
   up pointing at the orphan, which has no entry in `/Pages` and which viewers cannot
   navigate to. Internal links therefore never survive a copy on their own, in any
   operation. `links.ts` repairs this: it resolves each link's target against the source
   *before* the copy, then repoints the copy at the real output page, or drops the link
   when its target is not in this output.
3. **`lookupMaybe` throws on a type mismatch.** `PDFDict.lookupMaybe` and
   `PDFContext.lookupMaybe` return `undefined` only for an absent or null value; a value
   of the wrong type raises `UnexpectedObjectTypeError`. Malformed files hit this
   constantly, and so do valid ones using a type we did not expect — a named destination
   where we looked for an array. Every type-checked lookup goes through `tryLookup`
   (exported from `outlines.ts`).

Two limits are accepted rather than solved, and stated on the tool pages rather than
hidden: fields from different inputs that share a name are not disambiguated by a merge,
and a page duplicated within one `assemble` call loses its internal links, because that
extra copy is made in isolation from the rest of the output.

## 6. Identity and sessions

An account is identified by its **email address**, and three methods can reach the same
account in any combination: a magic link, a password, and Google.

- **Magic link** — `POST /api/auth/request-link` → emailed link → `GET /api/auth/verify`.
  Only a hash of the token is stored (`magic_links.token_hash`), single-use via
  `consumed_at`.
- **Password** — PBKDF2-HMAC-SHA256, **210,000 iterations** (OWASP's figure; raise over
  time, never lower), stored as `pbkdf2$<iterations>$<salt>$<hash>`. Minimum length 10,
  maximum 200.
- **Google** — plain authorization-code redirect, scope `openid email` only. Deliberately
  *not* One Tap or Google's SDK: those would need `script-src` and `connect-src` opened
  up, whereas a top-level navigation costs no CSP exception. `users.google_sub` is kept so
  a changed Google email still signs in. `/api/auth/methods` reports whether the
  credentials exist, so the button cannot appear when it could not work.

### Cookies

| Cookie | Flags | Purpose |
| --- | --- | --- |
| `__Host-leaflock_session` | `Secure; HttpOnly; SameSite=Lax; Path=/` | `<sessionId>.<secret>`. Server stores only the id and a SHA-256 of the secret, so a database read alone cannot forge a session. Compared with a timing-safe equality. |
| `leaflock_signed_in` | `Secure; SameSite=Lax` (readable by JS) | A hint, never proof. Lets `useSession()` skip `/api/auth/me` for signed-out visitors, who are nearly everyone. |
| `leaflock_oauth_state` | `Secure; HttpOnly; SameSite=Lax; Max-Age=600` | Rejects an OAuth callback we did not start. `Lax` because the browser returns from Google as a top-level navigation. |

Session TTL is **30 days**, extended on use only when less than a day remains, so a
normal request does not cost a write. `readSessionFromRequest` returns `effectivePlan()`,
not `users.plan` — a cancelled subscription keeps its plan until the period already paid
for runs out, as terms.md §5 promises.

Because the site is static with no SSR, a client island cannot read the HttpOnly cookie;
`src/components/ui/useSession.ts` calls `/api/auth/me`, which always answers 200 (null
when signed out) so signed-out visitors do not log a console error on every page.

### Rate limits

Fixed-window counters in D1 (`src/lib/server/rateLimit.ts`), one atomic upsert so
concurrent requests cannot race past the limit. Magic links: **3 per email / 15 min**,
**10 per email / day**, **10 per IP-hash / 15 min**.

**No raw IP is ever stored.** `hashIp()` keeps a salted SHA-256 using `SESSION_IP_SALT`,
and that is what goes in `magic_links.request_ip_hash` and the anonymous usage key.

## 7. Usage metering

| | Daily jobs |
| --- | --- |
| No account | `ANONYMOUS_DAILY_JOBS = 5`, per hashed IP |
| Free account | `FREE_ACCOUNT_DAILY_JOBS = 30`, per user |
| Pro / lifetime / business | not metered at all |

Both numbers are still marked `[TO CONFIRM: owner]` in `src/lib/server/usage.ts`, and the
dashboard now shows the free one to users, so they are no longer invisible.

- `POST /api/usage/claim` counts one job and says whether it was allowed. One row per user
  per UTC day, so the daily reset is implicit in the period key and needs no rollover job.
- `GET /api/usage/today` reads the count **without incrementing**, for the dashboard meter.
- Paid plans skip the call entirely client-side via `src/lib/planCache.ts`, so a paying
  customer's work never waits on the network. The cache is a latency optimisation and
  never a security boundary — the endpoint re-checks the real session.
- The cap is a nudge, not a lock: the work runs on the visitor's device either way, which
  is also why `requiresUpgrade()` is honest about being a paywall rather than a lock.

## 8. Payments

**Dodo Payments is the merchant of record for everything built so far** (terms.md §5):
it takes the money, holds the card details and issues the invoice. We store which plan
an account is on and when the period ends — nothing else. Checkout is a redirect to
Dodo's own hosted page, so no card field and no third-party script ever touch our
origin, and the CSP needs no exception.

**Decided but not yet built, 28 October 2026** (`docs/roadmap.md` Phase 4,
`docs/legal-checklist.md` §2): the merchant of record becomes **dual-provider, routed
by region** — Dodo stays for India, Paddle takes everywhere else, chosen for confirmed
iDEAL and Pix support and a flatter fee structure for international subscriptions.
Everything below in this section describes the Dodo-only implementation that exists
today; it needs a second implementation for Paddle plus region-routing logic before that
decision is actually in the code, and this section should be rewritten once it is.

Prices (`src/lib/pricing.ts`, one place to change them). Decided 30 October 2026 (§13) and
**in the code since item 4.9 shipped the same day**:

| | Price | Sells |
| --- | --- | --- |
| Pro | $4/month, $24/year | the daily limit removed, device retention |
| Pro, ten years | $120 once | the same, for a defined ten-year term |
| Practice | $249/year | the six professional tools, the click-through DPA, the trust page |
| Business | $499 early, $750 target | the self-hosted edition |

Four things 4.9 changed beyond the numbers, each worth knowing before touching this again:

- **`tier` in `src/tools/registry.ts` is `'free' | 'pro' | 'practice'`**, and the six
  professional tools carry `practice`. Pro deliberately gates no tool of its own; what it
  sells is the removed daily limit and retention. `tests/unit/proCopy.test.ts` pins both
  halves, including that no Practice tool is ever advertised as a Pro feature.
- **Access ranks rather than toggling.** `src/lib/proAccess.ts` ranks tiers and plans and
  asks whether the plan reaches the tier. The old boolean — any paid plan unlocks every
  gated tool — stops being true the moment two paid tiers sell different things.
- **`plan` in the database gained `practice`** (`migrations/0004_practice_plan.sql`). The
  column carries a CHECK constraint, and SQLite cannot alter one in place, so the table is
  rebuilt. `lifetime` was *not* renamed: it is the stored value for the ten-year term, and
  renaming it would mean a second rebuild plus a data update for no behaviour change.
- **Prices stated in prose now have a test.** `tests/unit/statedPrices.test.ts` reads the
  shipped Markdown and i18n text and fails on any dollar figure `pricing.ts` does not hold.
  It earned its place immediately: it caught the Business page's frontmatter description
  still advertising $299 after the price section above it had been corrected.

Two flags, and the dependency between them matters:

```ts
export const paidPlansAvailable = false;   // can anything be bought at all
export const proToolsGated = paidPlansAvailable;  // do Pro tools require a plan
```

`proToolsGated` is *derived*, never set independently: locking a tool while there is no
way to buy Pro would strand everyone using it. Payments may be open while Pro tools stay
free, never the reverse. Switching either on also makes two pieces of text wrong —
`toolPage.proNote` in `src/i18n/en/common.ts` and the early-access paragraph in terms.md
§5 — so they change in the same breath.

**`POST /api/billing/checkout`** requires a session (so the webhook has an account to
attach the plan to), accepts `{ plan: 'proMonthly' | 'proYearly' | 'lifetime' }`, caps the
body at 256 bytes, and answers **503** when the products or API key are missing.

**`POST /api/billing/webhook`** is the only authority on who has a paid plan; the client
is never trusted for it. Verification follows Standard Webhooks: HMAC-SHA256 over
`id.timestamp.body`, keyed by the secret with its `whsec_` prefix stripped and the rest
base64-decoded, compared timing-safely, rejecting anything more than **5 minutes** out of
date. Dodo retries until it gets a 2xx, so every delivery id is recorded in
`webhook_events` and replays are ignored. An account is found by the `user_id` we sent at
checkout, then by subscription id, then by email.

Test and live are **different hosts** (`test.` / `live.dodopayments.com`), selected by
`DODO_MODE`, not a flag on the request.

## 9. Data model

Three migrations in `migrations/`. What matters as much as the columns is what is absent:
no file names, no file content, no page counts, no raw IPs, no card details, no billing
addresses.

- **`users`** — id, email (unique), created/last-login, `plan`
  (`free|pro|lifetime|business`), `status` (`active|disabled`), `password_hash`,
  `google_sub` (unique where not null), `dodo_customer_id`, `subscription_id`,
  `plan_status` (`none|active|past_due|cancelled|expired`), `current_period_end`
  (null for lifetime).
- **`magic_links`** — token hash, expiry, `consumed_at`, `request_ip_hash`.
- **`sessions`** — `secret_hash`, expiry, last seen, and `browser` as family plus major
  version only ("Chrome 141").
- **`usage_counters`** — `(user_id, period, metric)` → count. Counts only.
- **`rate_limits`** — `(key, window_start, count)`.
- **`webhook_events`** — delivery ids already processed.

`GET /api/account/export` and `POST /api/account/delete` exist for the data-subject rights
the policy pages promise.

## 10. Theme and skins

Every colour is defined once with `light-dark()` on `:root` in `src/styles/global.css`.
`html[data-theme]` (set by `ThemeToggle.astro`, applied before paint by an inline script
in `Base.astro`) forces one side. Use the variables, never a hard-coded colour.

**Default is always Light, and the picker is one button — changed 7 November 2026, owner
instruction.** It replaces the three-way System/Light/Dark control. (The owner briefly asked
for System as the default the same day, then withdrew it: the default stays Light.) A visitor
with nothing in `localStorage` gets `data-theme="light"` from the pre-paint script; only a
stored `dark` gives dark, and an old stored `'system'` reads as Light. `ThemeToggle.astro` is
a single icon-only button showing the mode you are in (a sun or a moon; the accessible name
carries the words). Which icon shows is decided in CSS from `html[data-theme]`,
which is always set, so it is right at first paint; the script only writes the choice on
click and keeps the tooltip pointing at the mode a click leads to. **Stated limit:** System
is no longer offered. The `system` string in `common.ts` is unused now but stays, because the
other locales' catalogues are generated and would need regenerating to drop it.

**Default visual system is "Playful Rounded" — changed 2 November 2026** from the
original ("Soft Product", now an alternate skin, see below). Big soft radii
(`--radius: 22px`, `--radius-small: 14px`), a chunky solid offset shadow rather than a
blur (`--shadow-card: 0 4px 0 light-dark(#f0e7e2, #3a2a44)`), warm coral accent
(`#b93824` light / `#ff7a63` dark — the light value was darkened 3 November 2026 from
the style-lab's brighter `#e5533d`, which read fine as a button fill but failed WCAG AA
as text; see the CSP/contrast note below). `docs/style-lab.html` is where all fifteen directions
were compared side by side before this one was picked; it still renders all fifteen,
including the three ("Dashboard-style", "Paper & Ink", "Bold Editorial") built as full
standalone demos first (`docs/dashboard-style-demo.html`, `docs/paper-ink-demo.html`,
`docs/bold-editorial-demo.html`) and folded back into the lab afterwards. `docs/
landing-gallery.html` (24 thumbnails, not all shipped as skins) is the wider visual survey
that preceded narrowing to fifteen.

**Fourteen alternate skins** — `src/styles/skins.css`, each overriding the exact same
token set as `:root` under `html[data-skin="<id>"]`, so any component already built
against `--color-*`/`--radius*`/`--shadow*` re-skins automatically; nothing here touches
markup. Picked from `SkinPicker.astro`, a compact dropdown in the header next to
`ThemeToggle` — **a dropdown, not a page**: an earlier `/appearance` route was replaced
with this after the first version shipped, on the owner's instruction that a full page
was too much for what is a quick preference. The choice persists in a `leaflock_skin`
cookie, applied before first paint by the same inline-script technique `ThemeToggle`
uses, with the roster listed in `src/lib/skins.ts`. Selecting "Playful Rounded" (marked
default) **clears** the cookie rather than writing `skin=default`, so the reset stays
correct even if the default changes again later. One skin, `glass-depth`, is a flat
approximation of the original gradient-and-blur mockup: `light-dark()` only accepts
plain colours, so a true CSS gradient can't go through it.

**Remembering it between visits is a Pro/Practice perk, by owner instruction.** Picking a
skin always applies it; whether the cookie survives the browser closing depends on plan,
checked only at the moment of picking (never just from opening the panel, to avoid a
request on every page view):
- **Pro, Lifetime, Practice or Business** (`isPaidPlan`-equivalent check against
  `/api/auth/me`'s `plan` field) → a 1-year cookie, same as before this gate existed.
- **Free or signed out** → the `Max-Age` is omitted entirely, making it a session cookie —
  applied for every page view until the browser closes, then gone. The check is skipped
  outright (treated as free, no request made) when `leaflock_signed_in` — the same
  non-HttpOnly hint `useSession.ts` reads — is absent, which is the common case.

**Known gap:** even the persistent cookie is per-browser. A Pro/Practice visitor's skin
choice does not follow them to a second device — that would need a small D1 column and an
API route in addition to the plan check above, not built, because it was never confirmed
as required.

**No inline `style="…"` in `.astro` markup** — the CSP blocks it. React `style={{…}}` in
a client-only island is fine, because it goes through the CSSOM; the dashboard's usage
meter relies on exactly that. SkinPicker's swatch dot learned this the hard way: a
`style={`background:${skin.swatch}`}` fired a CSP console error on every single page
(the header renders everywhere), which broke the shared `assertClean()` e2e helper on
~166 unrelated specs. Fixed with a plain `[data-skin-id="<id>"] .skin-picker__dot`
attribute-selector rule per skin in `skins.css` instead.

**`<script is:inline>` and Astro's CSP hashing don't mix.** `security.csp` in
`astro.config.mjs` auto-hashes inline scripts so the browser will run them — but only
the ones Astro's own bundling pipeline sees, and `is:inline`'s entire point is to skip
that pipeline. The two pre-paint scripts in `Base.astro` (theme/sidebar/skin, and the
one measuring header height) are `is:inline` for a real reason — they must run before
first paint — and were silently unlisted, self-blocking on every page. Fixed with
`Astro.csp.insertScriptHash()` in the frontmatter, hashing the exact string rendered via
`set:html` so the two can never drift apart again. One trap in the API: pass a **bare**
hash string, not `{ hash, kind: 'element' }` — `kind: 'element'` scopes into a separate
`script-src-elem` directive that does not inherit `'self'`/`'wasm-unsafe-eval'` from
`script-src`, which blocked every React island's module chunk on every page until
caught.

## 10a. Navigation chrome

- **The tools sidebar** — `src/components/ToolsSidebar.astro`, opt-in via `Base.astro`'s
  `toolsSidebar` prop (tool pages and the category hubs only; marketing pages stay
  uncluttered). Categorised, collapsible tool list (one `<details>` per category, the
  active tool's category open by default, others collapsed), a search box that filters
  the list and auto-opens matching categories, dockable to the left or right edge
  (`html[data-sidebar-dock]`), hide/show (`html[data-sidebar-state]`), and footer
  quick-links (About/Business/Help/Contact). `position: fixed`, not `sticky` — pinned to
  the viewport from the first frame, genuinely unaffected by scroll. Both the dock and
  visibility choice persist in `localStorage` (not a cookie, unlike the skin picker:
  there is no reason for this one to be readable from a non-JS context). Its header
  starts below the site header's real rendered height, not a guessed constant —
  `--tools-chrome-h`, measured by a `ResizeObserver` on `.site-header`/`.privacy-strip`
  so a web-font swap or a locale's longer nav text can't leave a sliver of header
  visually behind the sidebar's top edge.
  - **z-index 30, deliberately above ordinary content but below the header's own
    dropdowns (40).** The tools menu's and skin picker's panels learned this the hard
    way: both originally sat at z-index 20, so a visitor with the sidebar docked right
    would see the sidebar paint over either dropdown, making skin-picking look like it
    "only worked on the home page" (the one page type with no sidebar). Any future
    header dropdown needs a z-index above 30 for the same reason.
- **The "All tools" mega-menu** (`ToolsMenu.astro`) grid is `repeat(auto-fit,
  minmax(10rem, 1fr))`, not a fixed column count — it used to be exactly 4 columns above
  48rem and exactly 2 below as two hard breakpoints, which overflowed or left dead space
  at in-between widths.
- **The home page's category sections** (`src/pages/index.astro`) are `<details>`, not
  plain `<section>` — the first category starts open, the rest collapsed, each with a
  tool-count badge, so a first-time visitor sees one full category and three headings
  instead of all 43 tools in one scroll. A "See all `<category>` tools" link into the
  category hub remains for the tools that stay collapsed.
- **The header brand mark is inline SVG, not `<img src="/favicon.svg">`** — its two
  fills are `var(--color-accent)` and `var(--color-on-accent)`, so it recolours with
  whichever skin is active.
- **The browser-tab favicon and the mobile `theme-color` meta also recolour**, by owner
  instruction — a small script in `Base.astro`'s `<head>` rebuilds the same leaf-and-lock
  SVG as a `data:image/svg+xml,` URI and rewrites `#siteFavicon`'s `href` and
  `#siteThemeColor`'s `content`. Both tags ship a static default first (the plain
  `/favicon.svg` file, `#e5533d`, also updated — it used to be the old green) so there's
  something correct before the script runs or if it's ever blocked. The
  `Organization.logo` in structured data (`src/lib/seo.ts`) and the PWA manifest's
  `theme_color`/`background_color` (`src/pages/manifest.webmanifest.ts`) stay static too:
  the first is read by crawlers, not a live browser tab; the second paints a launcher
  splash screen before any JS runs, so it can only ever reflect the default skin.
  - **`getComputedStyle(docEl).getPropertyValue('--color-accent')` does not work for
    this** — a custom property is untyped, so the browser hands back the literal
    `light-dark(#e5533d, #ff7a63)` text instead of resolving it, and that text is simply
    invalid as an SVG `fill` or a `theme-color`, silently. First version of this script
    shipped with exactly that bug. The fix: apply the custom property to a throwaway
    element's real `color` (a typed property) and read `.color` back off *that* —
    `light-dark()`, and `var()` generally, only resolves through a property that isn't
    itself a custom property.
- **The header and privacy strip are `position: sticky` together**
  (`.site-chrome` wraps both) — not for their own sake, but because the sidebar's `top`
  offset (`--tools-chrome-h`, above) is only correct while this chrome is actually still
  at the top of the viewport. Before this wrapper existed, header and strip scrolled away
  normally while the sidebar kept reserving that same height, opening a visible gap above
  it the moment a page scrolled past where the header used to be.
- **The site footer's tool-category columns and its Product/Company/Legal columns are
  two separate grids**, not one — put in one `auto-fill` grid together, the three link
  groups wrapped into a short second row under only the first two category columns,
  ragged because nothing tied a group's position to what it was semantically next to.
  Split, with a hairline divider between them, each row now wraps on its own terms.
- **The header condenses to just the brand mark once scrolled past a small threshold**
  (`.site-chrome--condensed`, toggled by a scroll listener at the bottom of
  `Base.astro`) — reported from an actual phone, where the full header permanently ate
  a real share of the viewport on every page. Nav, the skin picker and the theme toggle
  collapse away; the privacy strip (`.privacy-strip`) deliberately doesn't, on the
  owner's instruction — it stays visible through the whole scroll, not just at the top.
  The same listener re-measures `--tools-chrome-h` on every toggle, for the same reason
  the sticky-chrome wrapper above exists: that variable is set once before first paint
  for the *uncondensed* height, and condensing without re-measuring it would reopen the
  exact gap-above-the-sidebar bug the wrapper was built to close, just from a different
  trigger.
- **Condense and expand use two different thresholds (64px / 16px), not one.**
  `.site-chrome` is sticky, which still means it occupies normal document flow space —
  condensing it shrinks that space and shifts everything below it upward, including
  whatever the visitor (or Playwright's own scroll-into-view during a `.click()`) was
  scrolling toward. A single shared threshold lets that shift itself re-cross the
  threshold, flipping the state back, shifting again, forever — this is exactly what
  broke `secure.spec.ts`'s download-link click in CI, intermittently, until bisected.
  A wide dead zone between the two thresholds means one toggle's own shift can never
  be large enough to cross back over the other side.

## 10b. Scroll reveal

A fade-and-rise for `.tool-info > div`, `.faq > details`, `.card-list li`, `.tool-grid
li` and `.category` as they enter view — one selector list, no per-page markup, since
`.tool-grid` alone already covers the home page's category grids, every tool page's
"Related tools", and the category hub grids. Script at the bottom of `Base.astro`;
CSS in global.css's "Scroll reveal" block.

**The mechanism, and why it's shaped this way:** on `DOMContentLoaded`, the script
checks each matching element's `getBoundingClientRect().top` against `innerHeight` —
only elements **already below the fold** get `.reveal-pending` (`opacity: 0; transform:
translateY(14px)`) and an `IntersectionObserver`; anything on screen at that moment is
left alone, rendering at its normal opacity from first paint. A simpler version that
hides everything matching the selector unconditionally would flash hidden content before
the script runs, and risks LCP specifically if the page's largest element happens to
match one of these selectors and starts invisible — `tests/e2e/performance.spec.ts`
would have caught the second one, not the first.

**Must live inside `@media (prefers-reduced-motion: no-preference)`, the `transition`
declaration included, not just the class that triggers it.**
`tests/e2e/accessibility.spec.ts`'s reduced-motion probe fails on any element with a
live `transition-property: transform`, whether or not that transition is ever actually
triggered — an unconditional `transition: opacity .5s, transform .5s` on these selectors
failed the probe even though `.reveal-pending` itself was correctly gated in JS. Same
trap the category and sidebar chevron icons hit when CI was fixed earlier the same day.

## 11. Testing and commands

Run `source ~/tools/leaflock-env.sh` first in any new shell: the machine's default `node`
is v20.9.0 and `package.json` requires `>= 22.22.0`. The script puts portable Node 24 and
a corepack `pnpm` on `PATH` and points npm at the public registry.

| Command | Does |
| --- | --- |
| `pnpm dev` | Astro dev server, no CSP, **no Pages Functions** |
| `pnpm build` | `astro check` then production build |
| `pnpm test` | Vitest unit tests |
| `pnpm test:e2e` | Builds, previews, runs Playwright (Edge locally, Chromium in CI) |
| `pnpm exec wrangler pages dev dist` | The only way to exercise `/api/*` locally |

Parallel e2e runs: `LEAFLOCK_PORT=4401 LEAFLOCK_OUT_DIR=dist-a pnpm test:e2e tests/e2e/<spec>.ts`.

`watchPage(...).assertClean()` is the privacy regression test: it fails on any request
leaving our origin and on any console error, which is how a CSP violation shows up.

**Never assert on a pdf-lib object.** Every PDF object holds a reference back to its
`PDFContext`, and the context holds every indirect object in the file, so one failed
`expect(annots).toBeUndefined()` prints the entire document and the assertion itself
scrolls away. Assert on a primitive derived from the object instead:
`expect(annots?.size() ?? 0).toBe(0)`.

Run e2e in batches of related specs rather than one spec at a time, and give concurrent
runs their own port and out-dir (above). Two runs sharing a port fail with
`net::ERR_ABORTED` on navigation, which reads as a product bug and is not.

## 12. Deployment and configuration

Cloudflare Pages, `pages_build_output_dir = "dist"`, D1 bound as `DB`.

The hostname is the **apex**, `leaflockpdf.com`, set once as `site` in `astro.config.mjs`.
`Astro.site` is what every canonical, hreflang, sitemap entry and OG URL is built from, so
the apex is not a preference — it is the address the build already claims. Two
consequences, worth having written down before DNS is touched rather than after:
`www` must **301 to the apex** instead of serving the build, because a second hostname
serving the same pages contradicts their own canonicals *and* breaks Google sign-in (the
redirect URIs below are derived from the request origin, and only the apex is registered);
and the Pages project must exist, building from the repo, before a custom domain can attach
to it, which puts roadmap 6.2 ahead of any DNS work. The records themselves are tracked in
`docs/TODO.md` §0. *As built, checked 5 November 2026:* the apex serves the site, `www`
returns a 301 to it, and the zone is on Cloudflare — so both consequences above held.

Secrets are set with `wrangler pages secret put <NAME>` and, for local development, in
`.dev.vars` (gitignored). Full list in `functions/env.d.ts`:

| Variable | Without it |
| --- | --- |
| `SESSION_IP_SALT` | required — IP hashing and anonymous metering |
| `RESEND_API_KEY`, `EMAIL_FROM` | falls back to `src/lib/email/consoleSender.ts` in dev |
| `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_MODE`, `DODO_PRODUCT_*` | checkout answers 503 |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | the Google button is hidden |
| `PUBLIC_USAGE_LIMITS=off` | how the Business edition is built: no metering calls at all, for networks with no internet |
| `PUBLIC_ERROR_REPORTING` | crash reporting switch |

Google OAuth needs both redirect URIs registered exactly, because `redirectUri()` derives
them from the request origin: `http://localhost:8788/api/auth/google/callback` and
`https://leaflockpdf.com/api/auth/google/callback`.

## 13. Decisions already made, so they are not re-litigated

- **No AGPL/GPL dependencies**, ever — the product is closed source and ships a
  self-hosted edition. MIT, Apache-2.0, BSD, ISC and MPL are fine. This rules out
  Ghostscript for compression or PDF/A, and makes LibreOffice-in-WASM (partly LGPL, and
  hundreds of megabytes to vendor) the reason Office→PDF will only ever ship as an honest
  subset.
- **No AI document features.** Not deferred — declined, because they cannot be done
  without sending page text to a server. It becomes copy: *we cannot read your document,
  which is why we don't offer features that need to.*
- **No saved-workflow UI until there is a workflow engine.** `ux-lab.html`'s dashboard
  mocks one; a panel that does nothing is worse than no panel.
- **The dashboard shows tools, not files** — *revised 29 October 2026, and the revision is
  scoped deliberately.* The original line read "We hold no files and store no names", which
  bundled two different promises: that **we** hold nothing, and that **nothing is held
  anywhere**. Only the first is load-bearing, and only the first is what the CSP proves.
  Retention now ships in two parts, placed far apart in the plan on purpose:
  - **On the device — shipped 30 October 2026**, `docs/roadmap.md` Phase 2 item 5 (tracker
    id 2.11). A recent-work shelf in **IndexedDB** (not OPFS, for the engine reasons in
    `src/lib/retention/shelf.ts`), expiring at 5 minutes, 1 hour or 24 hours by the
    person's own choice, with a custom length up to seven days on Pro. Nothing is sent
    anywhere, so the original promise is untouched: we still hold no files, and
    `connect-src 'self'` still proves it. This half is not a reversal at all — it is the
    same promise with a feature attached. It does reverse a second thing worth naming:
    `recentActivity.ts` deliberately stores no file names, so keeping the files is bounded
    to opt-in, off by default, and minutes-to-a-day rather than weeks.
  - **On our server, encrypted in the browser** — Phase 2 item 6 (tracker id 2.12; this was
    id 4.8 until 30 October 2026, moved so server retention is one item rather than two
    descriptions in different phases). Opt-in per file,
    AES-GCM, with the key in the URL fragment, which browsers never send in a request. We
    hold ciphertext we cannot read. **This half is a real reversal**, and it carries a cost
    worth naming here rather than discovering later: `connect-src 'self'` permits a
    same-origin upload, so the directive stops being proof on its own, and the claims pages
    (Phase 3) have to state *what* leaves the device and *when* instead of resting on "it
    cannot".
  - **Plain server storage of readable files stays declined** — not on effort, but because
    it converts a browser-enforced impossibility into an unverifiable promise, which is the
    one thing this product sells. A breach of stored contracts, payslips or medical letters
    is terminal for a privacy brand in a way no feature offsets.
- **The name stays LeafLock PDF — confirmed by the owner 30 October 2026 after a rename
  review.** ContraPDF was the proposal; Hush, Opaque, Intra, Charta, Patra, Fable and
  others were considered. Every alternative that was actually checked failed one of two
  gates, so this is recorded to stop the exercise being repeated:
  - **CONTRA** — crowded root: a registered mark to Contra.work, a live 2025 filing in
    computer & software services, Konami maintaining CONTRA in class 9, and App4Legal
    shipping "Contra" for legal documents. Also means *against* in Spanish, our first
    launch locale.
  - **HUSH** — Hush Communications holds HUSHMAIL in software and filed HUSHCHAT: a
    *Hush + noun* family already exists in privacy software.
  - **OPAQUE** — Opaque Systems, Inc. holds a registration covering privacy-enhancing
    software. Exact word, our field.
  - **CHARTA** — Charta Ventures, Inc., software for *creating and generating contracts and
    documents*. Our exact goods and classes. Also pronounced identically to **Carta** in
    Spanish.
  - **INTRA** — the only one that came back clean, and `intrapdf.com` is taken.
  - **FABLE** — means fiction, which is a poor fit for a product selling provable claims,
    and Microsoft's Fable occupies class 9.
  - **DELTAX** — three elements, unsayable aloud, and "Delta" plus a bare "X" is the most
    crowded combination considered.

  What LeafLock has that none of them do: **no LEAFLOCK software mark exists**, and the
  domain is available to us. `leaflock.com` redirects to a **gutter-guard product** — an
  unrelated class, so coexistence rather than conflict, and it is why the wordmark keeps
  "PDF": it disambiguates from that product and matches the domain. Searching found only
  LEAFLOCKER (packaging), LEAFLOGIX, LEAF TRADE, LEAFPAY, LEAFPON — all distinct.

  **Two things were deliberately accepted, not overlooked.** "Leaf" reads botanical before
  bibliographic, which the gutter guard confirms — a cosmetic cost, not a legal one. And
  **LifeLock** is a phonetic near-miss in an adjacent field (identity protection); that is
  the one open question, and it goes to the lawyer with roadmap 6.3. All of the above came
  from secondary databases (Justia, Trademarkia, uspto.report), US-only, and **is not
  clearance** — `docs/legal-checklist.md` §6 still owns that.

  **Second pass, 30 October 2026 — three more raised and dropped.** The first pass checked
  one gate (a crowded mark) and a second by accident (the domain). These three each failed
  a *different* gate, which is why they are recorded rather than waved off: the gate list
  is the reusable part.
  - **ALMOSTPDF** — no legal problem; dropped on meaning. The product's one differentiator
    is provability (items 3.4 and 3.5 exist because rivals' claims contradict their own
    pricing pages), and it ships real documented limits: `copyPages` drops bookmarks, forms
    and links, PDF → Word infers no tables, HEIC reads the primary frame only. Today those
    read as unusual candour. Under a name meaning *almost*, a reviewer reads them as the
    brand conceding the point. It also cannot be put on a $249/yr invoice to a law firm,
    which is category 4, the best revenue per hour on the plan.
  - **STORMPDF** — the domain is free; the mark is the worst exposure of any candidate so
    far. **Content Guru Limited sells a software platform called `storm®`** (cloud contact
    centre, UK, global) and is **actively enforcing it**: on 10 June 2026 it filed four
    TTAB proceedings as plaintiff against Storm AI LLC — serials 99302164 (STORM), 99302187
    (STORM AI), 99302201 (STORM MCP), 99302207 (STORM TOOLS). Two of those four are
    `STORM` + a descriptive noun, which is exactly the shape of `StormPDF`, so the usual
    hope that compounding buys distance is the specific thing being litigated against.
    JetBrains also holds WEBSTORM (4163664) and PHPSTORM (4236138) in class 9, and STORM
    PROXIES (5548614) sits in privacy-adjacent tooling. The one harmless STORM in class 9
    is Akron Brass's (5431473) — fire hose nozzles and water cannons, i.e. the gutter-guard
    situation again, and a useful illustration that same class with different goods is
    survivable while same field is not.
  - **NORDICPDF** — passes the crowding gate (Nordic Semiconductor's class 9 family is
    radio and semiconductors; Nordic Consulting Partners, 90896604, is healthcare IT) and
    fails an absolute statutory one. **Lanham Act §2(e)(3), primarily geographically
    deceptively misdescriptive**, is a four-element test and all four are met: "Nordic" is
    a generally known place with no competing primary meaning; our governing law is India
    (`docs/legal-checklist.md` §1); buyers would plausibly believe Nordic origin; and the
    misrepresentation is **material**, because for a privacy product "Nordic" is not
    decoration but a claim about EEA domicile and GDPR. The appeal of the name *is* the
    element that condemns it. Post-NAFTA it cannot be cured by acquired distinctiveness
    under §2(f) — permanent refusal — and TMEP 1210.01(b) is explicit that the deceptive
    matter "need not comprise the entire mark, or even the dominant portion", so the `PDF`
    suffix does not save it. Worse in the registries that matter most: §6 wants EU and
    Indian filings, and at EUIPO the claim would be asserted inside the EEA. Strategically
    it is AlmostPDF's mirror image — *Almost* undersells what we can prove, *Nordic*
    oversells it — and it concedes that jurisdiction is what protects the user, when our
    actual claim is architectural and therefore stronger.

  **The gates, as they now stand.** A candidate has to clear all five, and each was learned
  the expensive way: (1) no live mark for the root in software or document goods — CONTRA,
  HUSH, OPAQUE, CHARTA, STORM; (2) the domain is obtainable — INTRA; (3) no unintended
  meaning in `es`/`de`, the Phase 5 locales — CONTRA, and RECTO below; (4) the word does
  not undercut or oversell the claim — FABLE, ALMOST, NORDIC; (5) no statutory bar —
  NORDIC. Note that (2) is the cheapest to satisfy and the least protective: STORMPDF and
  NORDICPDF both have free domains, and an available domain is no defence against an
  opposition.
- **A contingency shortlist exists, and is not a rename proposal — 30 October 2026.** The
  live naming risk is not aesthetic: it is the LIFELOCK question above, which goes to the
  lawyer with roadmap 6.3. If that comes back badly we would be renaming under time
  pressure with the domain already bought, so three candidates were screened in advance.
  **Nothing here is recommended over LeafLock PDF**, which still clears every gate.
  - **SORRELPDF**, **SEDGEPDF**, **TANSYPDF** — all three botanical, which is deliberate:
    it keeps the existing wordmark and logo usable, so a forced rename stays a text change
    rather than a redesign. No software mark found for any root. SORREL returns footwear,
    beverage and wine marks and one class 9 SOREL that was **cancelled in 2003**; SEDGE
    returns only herbicides (SEDGE STOP 6449278, SEDGEHAMMER); TANSY returns only an
    abandoned clothing mark. `sorrelpdf.com`, `sedgepdf.com` and `tansypdf.com` were all
    **404 at Verisign RDAP** on 30 October, i.e. unregistered.
  - **The caveat that applies to all three, and is a real cost for this product
    specifically:** they are common botanical nouns, so they compete in search with
    gardening and herbal content — and SEDGE's top results are *herbicides for killing
    sedge*. For a product whose entire Phase 3 is organic search, that is a tax LeafLock
    does not pay. If the shortlist is ever actually needed, a **coined** root is the better
    answer, and the gates above are how to test one.
  - **Dropped while building it, with the reason, so they are not re-proposed:** QUIRE —
    bibliographic and ideal on theme (a quire is a gathering of leaves), but `quire.io` is
    live project-management software from Potix and Quire, LLC holds a SaaS mark. RECTO —
    clean in software and the best fix for "leaf reads botanical", but *recto* in Spanish
    is both "straight" and the rectum, and Spanish is the first launch locale, which is
    gate (3) and exactly how CONTRA died. FOLIUM — Latin for leaf, but it is a widely used
    Python mapping library, so the developer namespace is occupied. MORTISE — a mortise
    lock is on-brand, but it reads as *mortis*. BRAMBLE — free and clean, but thorns and
    entanglement are the wrong connotation for a tool people trust with documents.
  - **Method, and its limits:** secondary trademark databases plus USPTO TTABVue, and
    Verisign RDAP for the domains (an authoritative 404 for `.com`, unlike a DNS probe —
    an NS lookup from the owner's machine reports "no nameserver" even for `google.com`,
    so DNS is not a registration test). US-focused, and **not clearance**.
  - `leaflockpdf.com` was re-confirmed unregistered by RDAP on 30 October and **bought the
    same day**, so gate (2) is closed for the name we are keeping and the shortlist above is
    the only part of this section still hypothetical. What the purchase did *not* settle is
    in `docs/TODO.md` §0: auto-renew, registrar 2FA, and a mailbox for `hello@`.
- **Self-serve only, and bespoke enterprise is deferred rather than declined — decided
  30 October 2026.** Everything in a paid tier must be zero-touch: a click-through DPA, a
  published trust page instead of per-prospect questionnaires, provider-issued invoices,
  customer-configured SSO, a licence key and a document for self-hosting. The constraint is
  not infrastructure — the architecture already removed that — it is **human-hours per
  customer**, and the test for any revenue stream is *can it be done once and consumed many
  times?* Negotiated contracts, bespoke security reviews and procurement calls serve dozens;
  standard terms and published answers serve thousands.

  **Bespoke enterprise stays in the plan** as `docs/roadmap.md` Phase 7, entered only when
  five preconditions hold (insurance, a pre-drafted MSA, SOC 2 underway, deals above
  ~$10k/yr, and either a second pair of hands or revenue for lawyer-per-deal). The forfeit
  until then is real and recorded: the six-figure contracts in this market are Adobe's and
  Nitro's, and we are choosing not to chase them yet.
- **Price leadership, applied per category — settled by the owner 30 October 2026.** The
  rule is *beneath or just above the cheapest credible rival in that category*, not beneath
  the market's single lowest price: the categories have different buyers and different
  floors, and one global number would put the legal bundle at consumer rates.

  | Tier | Price | What it adds | Undercuts |
  | --- | --- | --- | --- |
  | **Free** | $0 | 37 tools, no file-size limit, 20/day anonymous and 60/day with an account, device retention at 5 min / 1 hour / 24 hours | everyone — nothing is cheaper than free |
  | **Pro** | **$24/yr** or **$4/mo** | no daily cap, custom retention length | iLovePDF ~$35–48 |
  | **Pro, 10 years** | **$120 once** | Pro for a defined ten-year term | $1/month equivalent |
  | **Practice** | **$249/yr** | the six professional tools — redaction, Bates numbering, PDF/A, extract tables, compare, batch — plus the click-through DPA and the trust page | SealedPDF $468 |
  | **Business** | **$499/yr**, target $750 | self-hosted and air-gapped, SSO, invoicing, audit log | Stirling-PDF $1,188 team |

  **The six professional tools sit in Practice, not Pro.** The tiering decision below
  (which tools are gated) is unchanged; they are gated one tier higher, because at $24 a
  Pro containing them would leave Practice with nothing to sell. Those six are the only
  tools in the catalogue with externally demonstrated willingness to pay.

  **Monthly is $4, not $2.** After payment fees a $2.50 monthly charge nets the same ~$22 a
  year as a single $24 annual charge, because a flat 50¢ per transaction dominates at that
  size — so the low price is carried by the annual plan and monthly is priced to survive
  its own processing cost.

  **Ten years rather than "lifetime", deliberately.** $120 against $240 of annual
  subscriptions is a 50% discount, accepted because cash now funds the lawyer, insurance
  and a possible SOC 2 — and a *defined term* is far easier to write terms for, and to
  honour, than an indefinite promise. `docs/legal-checklist.md` §4 carries the wording.

  Zero marginal cost is what makes all of this sustainable where server-side rivals cannot
  follow. The forfeit stays visible: we can never run ads, which is a revenue line iLovePDF
  has and sells "ad-free" against.
- **The Pro set is six tools, confirmed by the owner 30 October 2026**: redact, compare,
  batch, extract tables, Bates numbering, PDF/A. No tool changed tier in the re-tiering
  pass (roadmap 4.1) — the decision was to stop, not to expand, because the 28 October
  revenue review found usage limits convert at 5–15% against 1–4% for feature limits. Two
  things are settled with it: **Sign PDF stays free**, the one candidate considered, because
  signing a contract that never leaves the machine is the clearest demonstration of the
  product and gating the best demo costs more than it earns; and **OCR and every compress
  level stay free**, which `src/content/compare/en/` already promises in print.
  `tests/unit/proCopy.test.ts` pins all of it.
- **Launch happens when the roadmap is done**, not in stages. The cost — domain and page
  age, the one ranking input that cannot be bought later — is recorded in
  `docs/roadmap.md` as a choice.
- **Twenty locales routed, ten published, machine-translated** — *revised 6 November 2026,
  reversing the 28 October "two locales, real translation" scoping; narrowed to the first ten
  on 7 November.* What changes: the number of locales (20, from `src/i18n/locales.mjs`; the
  first ten in that list are published, the other ten stay routed as English under `noindex`
  "for now") and who translates (a model). The statement that translations are machine-made is
  made **once, on the Claims page** ("Honest limits"), not on every page; the per-page note was
  removed on 7 November by owner decision. What does **not**
  change: legal pages stay English and govern; guides stay English-only; no translation is
  done at runtime or by a third party, because that would break `connect-src 'self'`; and a
  locale with no translation is `noindex` and absent from hreflang and the sitemap. The
  safeguard that replaced "a person translates" is "a person reviews the trust claims, pricing
  and error strings before the Claims statement can be dropped" (roadmap item 5.7).

## 14. Known gaps in this design

- The dashboard's browser tests stub `/api/auth/me` and `/api/usage/today`, because
  `astro preview` has no Functions. Real end-to-end sign-in needs a wrangler-based harness
  with a seeded local D1.
- `googleConfigured()` only checks that the two variables are non-empty, so a placeholder
  renders a button that fails at Google rather than staying hidden — which is the opposite
  of what `LoginForm.tsx` intends.
- The header's signed-in link now goes to `/dashboard`, so account settings are one click
  further away (reached from the dashboard).
- Daily allowances and `SESSION_TTL_MS` are still `[TO CONFIRM: owner]`.
