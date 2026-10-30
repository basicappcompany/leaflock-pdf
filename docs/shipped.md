# Shipped log

Newest first. **Ten lines per tool, maximum** — `docs/process.md` §7 sets that cap and
explains why: the roadmap grew 394 → 926 lines carrying this kind of detail, and a planning
document that has to be read in full to find what is *left* costs something every session.

This file exists so that cap can actually hold. Ship notes land here; `docs/roadmap.md`
keeps the plan and marks items done with a single line. Nothing here is read to decide what
to build next, so it can grow without making planning more expensive.

What a note is for: the **non-obvious finding** a future session would otherwise re-derive,
and the **stated limit** that went on the tool page. Not mechanism — that goes in
`docs/design.md`, next to the code. Not counts — `pnpm counts` has those.

Entries before 29 October 2026 are in `docs/roadmap.md` under their phase items, left in
place deliberately: rewriting them would be the rework this file exists to prevent.

---

## 30 October 2026 — Verifiability page (roadmap 3.4)

`/verify`: three panels, each reporting something only the visitor's browser can say —
every request the page has made and where it went, a cross-origin fetch the browser
refuses in front of you, and a network-state line that changes on its own when you
disconnect. No developer tools needed.

**The finding worth keeping, and it changed the design:** probing first (`CLAUDE.md`'s
rule) showed that a request blocked by `connect-src 'self'` fires `securitypolicyviolation`
with the directive and blocked URI, rejects the fetch with `TypeError: Failed to fetch`,
and leaves **no Resource Timing entry at all**. So the request list cannot show the block,
and the two panels have to answer different questions — which is also the honest framing:
one shows where requests went, the other shows what the browser forbids. A design that
assumed the blocked request would appear in the list would have shipped a demo that
silently showed nothing.

**Stated limit on the page:** it proves where requests went and what the policy forbids,
not that no document went to *us* — `connect-src 'self'` permits our own origin. The
offline test is what covers that, and the page says so.

---

## 30 October 2026 — Citable claims page (roadmap 3.5)

`/claims`: the one-sentence claim, what stays on the device, what the browser forbids, the
five things we receive, what is stored locally, what is planned, honest limits, and a
security-questionnaire table. Also Practice's trust page, so it is paid for twice.

**The finding worth keeping:** writing a page to be quoted verbatim is mostly an audit of
the claims already shipped, and three had been falsified by features landing elsewhere —
`security.md` promised "No cookies" and "No account" after auth shipped, and said files
were kept neither on your device nor ours after the recent-work shelf began keeping them
on the device. A trust claim fails silently in a way a number does not: nothing recomputes
it. `tests/unit/statedClaims.test.ts` now fails on the absolute phrasings, including the
ones 2.12 would falsify, and ties the cookie name to the constant.

**Stated limit on the page:** nothing leaves your device *unless you ask it to* — chosen
over the stronger wording precisely because 2.12 is planned.

---

## 30 October 2026 — Practice tier and the price reset (roadmap 4.9)

The six professional tools moved Pro —> Practice; Pro keeps no gated tool of its own and
sells the removed daily limit plus device retention. Prices reset to the 30 October
decision: Pro $4/mo, $24/yr, ten years $120, Practice $249/yr, Business $499/yr.

**The finding worth keeping:** a second paid tier turns access from a boolean into a
ranking, and the boolean was load-bearing in more places than the plan named. `isPaidPlan`
was an allow-list of plan names; the dashboard offered batch to anyone not on free, the
moment batch became a Practice tool; `CheckoutButton` carried its own copy of the plan-key
union, already stale. One estimate-breaking constraint: the `plan` column's CHECK cannot be
altered in SQLite, so widening it is a table rebuild (`migrations/0004_practice_plan.sql`).

**Stated limit on the page:** every tool stays free during early access; the Practice
badge names the plan, not a lock — the work still runs on the visitor's device either way.

---

## 30 October 2026 — Accessibility audit (roadmap 6.4)

A spec, not a report: a report is true the day it is written, and pages keep being added.
`tests/e2e/accessibility.spec.ts`, 20 checks, axe-core (MPL-2.0, devDependency only).

- **Finding — one real WCAG failure: 1.4.10 Reflow.** Markdown tables took the comparison
  page 5px past a 320px viewport. `width: 100%` does not stop cells' min-content widths
  pushing a table wider than its container, and no element was itself over-wide, so it only
  showed as a document `scrollWidth`. Fixed with `display: block; overflow-x: auto` on
  `.prose table` — the only way to get a scroll container around a Markdown-rendered table
  without a rehype wrapper. `mobile.spec.ts` tests 360px and never caught it.
- **Finding — axe injects over CDP, so our CSP does not block it.** An injected `<script>`
  tag would have been refused by `script-src 'self'` and the suite would have silently
  tested nothing. A self-test plants an image with no alt and a nameless button and insists
  axe reports both, so a clean run means something.
- **Stated limit:** axe covers only what is machine-detectable — roughly a third of WCAG.
  It says nothing about whether labels read sensibly, whether focus order matches the
  visual order, or whether the OCR and batch flows are usable with a screen reader. Those
  need a person, and 6.4 does not claim to have replaced one.
- Three things axe cannot see are tested directly: every control is keyboard-reachable
  with a visible focus ring, the skip link is the first tab stop and leaves its off-screen
  parking position when focused, and `prefers-reduced-motion` stills the hover lift.
- The reduced-motion test asserts what the stylesheet itself says — movement is the hazard,
  a 0.15s colour fade is the affordance — rather than failing every transition.
- The new retention picker and shelf are scanned in their real states, so the day's other
  feature did not ship unaudited.

## 30 October 2026 — Device-local recent work (roadmap Phase 2 item 5)

Keeping a finished result on the device, opt-in per result: 5 minutes, 1 hour or 24 hours,
with a custom length on Pro. Reverses half of `docs/design.md` §13, which now records the
reversal and its scope.

- **Finding — IndexedDB, not the OPFS the item specified.** OPFS's write path differs by
  engine (`createWritable` against a worker-only `createSyncAccessHandle`) and Safari and
  iOS are exactly what cannot be tested here, so the API with one write path everywhere
  removes a risk only a user could have found. A finished job's bytes are already in
  memory, so OPFS's streaming advantage bought nothing.
- **Finding — the expiry has to be enforced on read.** There is no timer in a closed tab,
  so "expired" means "deleted the next time anything looks": every read sweeps first, over
  an `expiresAt` index so expired rows go without their blobs being loaded. A browser test
  backdates a row and asserts it is gone, because an expiry that is only a label is the
  one failure mode here that leaves a file on the device indefinitely.
- **Reached all 43 tools through two shared components** — the picker inside `ResultFiles`,
  the shelf in `ToolApp` — rather than 43 edits, the same single-chokepoint approach
  `ImageList` uses for HEIC. Every performance budget still passes unchanged.
- **The shelf is on tool pages, not only `/dashboard`:** the dashboard redirects a
  signed-out visitor to login, so the only entrance there would have made a device-local
  feature account-only — the opposite of the argument for building it.
- **Stated limit:** seven days is the ceiling on a Pro custom length, and it is a platform
  limit rather than a pricing one — browsers evict this storage under pressure without
  asking. Lifting it is roadmap Phase 2 item 6 (2.12).
- **Not remembered between runs, deliberately.** A persisted retention preference would
  mean a later file is kept because of a decision made about an earlier one, which is how a
  privacy feature becomes a privacy problem.
- **Precedent it had to reverse, beyond §13:** `recentActivity.ts` stores only a tool id
  and a timestamp, because a list of document names on a shared computer is a new place for
  someone else to read what the user has been working on. The owner's short durations are
  what make keeping the files themselves defensible; the originally planned 30-day option
  would not have been.

## 29 October 2026 — HEIC decoding, everywhere images are accepted

Not a new tool: `.heic` now decodes inside JPG→PDF, Scan and OCR, through libheif
compiled to wasm. Closes `docs/TODO.md` §6a's build half.

- **Finding — emscripten's `locateFile` resolved the `.wasm` against the page and 404'd**,
  which only showed up in a browser (the Node probe passed `wasmBinary` directly and never
  touched that path). Fetching the `.wasm` ourselves and handing over `wasmBinary` removes
  the guesswork, and a same-origin fetch is what `connect-src 'self'` already allows.
- **Finding — libheif-js ships no encoder.** Decode-only is the materially lower-risk side
  of the HEVC patent question in §6a, and it also means the library under test cannot
  produce its own fixture: `tests/fixtures/sample.heic` is generated once by
  `scripts/make-heic-fixture.py` (pillow-heif, a dev tool, not a dependency).
- **Placement:** main thread, by two independent constraints landing on the same answer —
  the job worker is `iife` and would inline 1.5MB of codec into the chunk every tool
  fetches, and LGPL-3.0 requires the codec stay a replaceable component rather than
  something fused into our build. Vendored to `public/vendor/libheif/` alongside pdf.js
  and tesseract; the worker chunk came out byte-identical at 555,523.
- Native decode is tried first, so Safari and iOS use the OS codec and never fetch the
  1.5MB. Windows and Android — where someone searching "HEIC to PDF" actually is — get
  libheif.
- **Stated limit:** the primary image only. A HEIC can hold a burst or a live-photo
  sequence; the other frames are not extracted.
- **Still open, and it is not engineering:** §6a also asks for a confirmatory legal read on
  HEVC patent exposure before this reaches the public. The build was explicitly "not
  blocking" on it, but shipping to strangers is.

## 29 October 2026 — PDF → Markdown (`pdf-to-markdown`)

Zero new inference: reads the same `Block`/`Span` outline `structure.ts` already infers for
PDF → Word, so it is one more renderer on one engine, with no dependency and therefore no
worker/main-thread question at all.

- **Finding:** adjacent spans pdf.js splits mid-run render as `**Hel****lo**` unless
  same-style spans are merged before wrapping. Harmless to a renderer, ugly in a file.
- **Stated limit:** no tables, images, fonts or colours — same inferred outline as
  PDF → Word, so the same limits, written once on both pages.
- Markdown-significant characters in real PDF text (`*`, `_`, `` ` ``, `[`, `]`, `\`) are
  escaped, or a footnote asterisk silently becomes emphasis.

## 29 October 2026 — Extract embedded images (`extract-images-from-pdf`)

`compress.ts` already scanned image XObjects to *shrink* them; that scan moved to
`src/lib/pdf/images.ts` so this tool reuses it instead of re-deriving "which XObjects are
content, not masks".

- **Finding:** a `DCTDecode` stream *is* a standalone JPEG per the PDF spec, so extraction
  is a byte copy — no decode, no re-encode, no quality loss. Verified against the source
  bytes rather than through a round trip.
- **Stated limit:** CMYK, indexed-palette, 16-bit, predictor-filtered, CCITT-fax and
  JPEG2000 images are not decoded, and the result reports how many were skipped.

## 29 October 2026 — Page labels (`add-page-labels`)

A `/PageLabels` number tree at the catalog level, flat `/Nums` with no `/Kids` (correct for
any page count this product sees). Distinct from `addPageNumbers.ts`, which draws digits on
the page; this sets what the reader's own page box and thumbnails show.

- **Finding:** PDF's letter numbering style is not base-26 positional — the 27th value is
  "aa", not "ab". Confirmed against the spec; a test pins it.
- `src/lib/organize/pageLabels.ts` holds the pure logic, so the UI's preview and the
  operation's validation cannot disagree about what is valid.
