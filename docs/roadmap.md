# Roadmap: phase-wise development

Written 23 October 2026. The goal is to beat iLovePDF, Smallpdf and Adobe Acrobat online
on features, page surface, SEO, visibility inside AI answers, performance and cost.

Those three are the volume competitors this plan measures against: ~264–325M monthly
visits (iLovePDF), ~43–57M (Smallpdf), and the category's brand leader (Adobe).

**Revised 28 October 2026 after a competitive review.** Two of that review's findings
changed assumptions this plan was resting on, so they are recorded here rather than left
in a chat log:

1. **"Free-forever open-source projects are not targets" was wrong**, and is withdrawn.
   Two of them compete directly. **Stirling-PDF** (~95k GitHub stars, open-core with its
   own paid Server/Enterprise tier, 50+ tools, pipeline mode, a full API, self-hosted on
   a $4–7 VPS) is the direct competitor to our Business edition — and it is *not* AGPL,
   so the "procurement-friendly answer to AGPL-licensed alternatives" pitch in Phase 4
   does not land and needs rewriting. **ihatepdf.cv** ships our exact positioning:
   client-side WASM, no upload, no watermark, no sign-up, no size cap, offline. Its
   traffic is negligible and its tool count contradicts itself across its own surfaces
   (28 on its MIT GitHub, 46 in a directory, "60+" on its home page), but the claim is
   no longer ours alone.
2. **Privacy alone is no longer a differentiator** — only *provable* privacy is. The
   enforcement mechanism (`connect-src 'self'`, checkable in DevTools) becomes the
   headline, not the promise. ihatepdf.cv simultaneously advertises client-side-only
   processing and chat-with-PDF summarisation, which cannot both be true; we can point
   at a directive the browser enforces, and they cannot.

Sejda (~38M visits, 40+ tools) and PDF24 (~12M) are tracked for feature coverage.

**Revised again 30 October 2026 after a second competitive review**, widened to 18 players
including the desktop and enterprise vendors the first sweep skipped. Four findings, each
changing something below rather than confirming it:

1. **Tool count is no longer a differentiator, and "more features than all" is withdrawn.**
   Four client-side rivals surfaced that did not exist in the 28 October landscape:
   **PDFCraft** (90+ tools, free, open source, in-browser), **KAOpdf** (35+ in production),
   **AmberPDF** (18) and **SealedPDF** (13). Our 43 is now mid-pack against a free GitHub
   project. The "Two honest limits" section below already said coverage at depth was the
   target and the count a consequence — that is now the stated position, not a caveat.
2. **The claim is crowded; the proof is not — and a rival's own pages prove it.**
   AmberPDF's home page says "Nothing leaves your browser"; its pricing page sells
   "auto-delete after processing" and cites GDPR. If nothing leaves the browser there is
   nothing to auto-delete. That is the second time in this category a client-side claim has
   contradicted itself in writing (ihatepdf.cv was the first). **This promotes Phase 3 items
   3.4 and 3.5 out of "additive after launch"** — see Phase 3.
3. **Pro at $59/year is the cheapest professional PDF product found anywhere.** Annual
   prices for a comparable feature set: Nitro $180, Adobe $180–300, Foxit $130–160,
   pdfFiller $96–180, Xodo $108, PDFelement $80–90, LightPDF $60, UPDF $50. SealedPDF
   charges **$468/year** for 13 client-side tools aimed at the same solo-attorney buyer our
   six professional tools serve. We ship redaction, Bates, PDF/A, compare and batch for
   $249, and OCR free (repriced from $59 by item 4.9 on 30 October 2026).
   **This reopens the Pro price in Phase 4** — the number only, not the tiering settled on
   30 October.
4. **The moat is being contractable, not being private.** PDFCraft has 90 tools, no DPA, no
   SSO, no SOC 2 and no entity a law firm can buy from. Every client-side rival found is a
   product; none is a vendor. **Procurement readiness moves from Phase 4 housekeeping to the
   actual differentiator** — the one thing a free competitor structurally cannot copy.

Full review, with the landscape table and sourcing caveats:
`https://claude.ai/artifact/7WuLkYMSjnoyL84PnN3bYt`. The desktop and enterprise prices come
from comparison articles rather than vendor pages — the labelled fallback — so confirm any
single figure at source before quoting it publicly or setting our own number against it.

**Cost pass, 28 October 2026.** The order below was built to minimise *rework*. Measured
against cost and elapsed time instead it mostly holds, with three corrections — recorded
here because each changes what gets done when, not just how.

1. **Phase 3, not Phase 2, is the expensive phase.** Phase 2 is the long pole in effort
   and is called that below, but the guides run ~100 lines each
   (`src/content/guides/en/`: 603 lines for six). One guide per tool, 40+ landings and six
   comparison pages is 6,000+ lines of prose no test can verify, and Phase 5 then
   multiplies all of it by every locale. **Phase 3 × Phase 5 dominates the plan**; the
   tool code does not come close.
2. **So the locale decision comes before Phase 3's page count, not after.** As ordered,
   Phase 3 sets the page count and Phase 5 discovers what multiplying it costs — the
   expensive way round, since the multiplier is what makes the count matter. Settled in
   Phase 5 below.
3. **A tool's copy is nearly free while the tool is being built, and expensive
   afterwards.** "Copy comes after the tools it describes" counts rework in pages
   rewritten and misses rework in context reloaded: describing an operation months later
   means reconstructing everything that was in front of us while writing it. The fix is
   not writing the pages early, which that rule correctly forbids, but writing the
   **checkable facts** — what it preserves, what it drops, what the stated limit is — into
   the tool's own strings file in the same commit, now a convention in `CLAUDE.md`. Phase 3
   then assembles pages from facts instead of researching them again.

**The site launches when the whole thing is done**, not in stages. That decision sets the
order below: with no revenue clock running, the thing worth optimising is *rework*. So
anything every later page or tool inherits comes first, copy comes after the tools it
describes, and translation comes after the copy is final. Each phase ends at a state the
next one builds on without rewriting it.

One cost of launching late, recorded so it is a choice and not an oversight: domain and
page age is the one ranking input that cannot be bought later. If that becomes a worry,
the cheap hedge is to put the home page and the policy pages up early and let them sit
while the rest is built.

## Where we stand today

| | LeafLock | iLovePDF | Smallpdf | Adobe online | Sejda | Stirling-PDF | ihatepdf.cv |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Tools | **43** (37 free, 6 Practice) | ~30 | ~40 | ~25 | 40+ | 50+ | 28–60 (claims differ) |
| Landing variants | see `pnpm counts` | many | many | many | many | — | — |
| Comparison pages | **7** | — | — | — | — | — | 3 |
| Guides | 6 | large library | large library | large library | — | — | 40+ |
| Locales live | 10 (`en`, plus `hi`, `bn`, `pt-BR`, `id`, `ru`, `de`, `es`, `fr`, `tr` machine-translated); 10 more routed, deferred | 21+ | 24 | ~30 | — | — | 1 |
| Processing | on device | server | server | server | server (desktop app offline) | customer's own server | **on device** |
| Marginal cost per job | **~0** | server compute | server compute | server compute | server compute | customer's | ~0 |
| Can run with no network | **yes** (service worker) | no | desktop app only | no | desktop app only | self-hosted | yes |
| Ads | never possible | yes (Premium removes them) | no | no | no | no | no |
| Entry price | **$4/mo · $24/yr** (decided and shipped 30 Oct, item 4.9) | ~$6/mo · ~$35/yr | $15/mo · ~$108/yr | $14.99–24.99/mo | week pass | free | free |
| Free-tier cap | 20/day anon, 60/day account | 25 merge / 1 split / 2 compress **per month** | limited downloads | 1 transaction / 30 days | limited | none | **none** |

Traffic and price figures are third-party estimates or vendor list prices, checked
28 October 2026; they disagree between sources by up to 25%, so treat them as orders of
magnitude. The two rows that matter most are the last two: our free tier is currently
**more restrictive than ihatepdf.cv's**, while our pitch is the generous one.

**This table is incomplete as of 30 October 2026, and deliberately left so rather than
rewritten.** The second review added eleven more players, including the price anchors this
one omits entirely — Adobe desktop, Nitro, Foxit, pdfFiller, Xodo, PDFelement, UPDF,
LightPDF — and four new client-side entrants: **PDFCraft** (90+ tools, free, open source),
**KAOpdf** (35+), **AmberPDF** (18) and **SealedPDF** (13). The full landscape lives in the
review artifact linked above, where the price bands are kept visibly separate; reproducing
eighteen rows here would make this file the thing it warns against. What matters for the
tool row: **43 is no longer the largest catalogue in the client-side category.**

Built and tested: every tool in `src/tools/registry.ts`, auth (email link + Google), D1
usage metering, Dodo billing scaffolding, `/dashboard`, scrubbed crash reporting, OG image
generation, JSON-LD (Organization, WebSite, WebApplication, FAQPage, BreadcrumbList,
Article), sitemap, hreflang, canonicals. Tools outnumber operations because several share
one (`assemble` backs Remove, Extract, Rotate, Organize and Mix pages; `imposePages` backs
N-up and Booklet; `tableToPdf` backs Excel and CSV → PDF).

**Counts are not maintained in this file.** Run `pnpm counts` for tools, tiers,
operations, tests, guides and landings; `pnpm build` prints the page count. Kept by hand
they drifted in three places at once — two of them typed the same day they went stale —
and every correction was rework that bought nothing (`docs/process.md` §8). Two things
below are deliberately left alone: the comparison table above, where our own figure only
means something next to a competitor's, and the figures inside the dated ship entries in
Phase 2, which are historical records of a moment rather than claims about now.

Deferred and tracked in `docs/TODO.md`: real credentials, remote D1, reviewed legal text.
All of it now belongs to Phase 6.

## Timeline, and whether we are late

**Nothing here has ever had a target date**, so there is no plan-vs-actual variance to
report and any figure claiming one would be invented. This document sets an *order*, and
says plainly above that the site launches when the whole thing is done, with no revenue
clock running. What follows is therefore a record, not a schedule.

| Date | What | |
| --- | --- | --- |
| 21 Oct 2026 | `docs/legal-checklist.md` prepared — earliest dated artefact in the repo | |
| 23 Oct 2026 | This file written, `docs/TODO.md` started; the base catalogue already working | ~24 tools |
| 24–27 Oct 2026 | No dated artefacts — no record either way | |
| 28 Oct 2026 | Depth pass, PDF→Word, PDF→Excel, the three metadata tools, mix pages, reverse/blank landings, N-up, booklet; the competitive and cost reviews | +10 tools |
| 29 Oct 2026 | Office→PDF completed (Word, Excel, CSV, RTF), Bates numbering, PDF/A, extract tables, page labels, extract images, PDF→Markdown | +9 tools |

Day granularity is all that was ever recorded, and for everything up to 31 October there are
no commit timestamps to check it against: the first commit was made on 30 October and pushed
on the 31st (item 6.2). From there on, git history is the record and this table is not.

**The measured pace: 19 tools across the two working sessions of 28–29 October**, with
Phases 1 and 2 now complete bar one externally-gated decoder. Two things that number does
*not* support, and should not be stretched to cover:

- **Three of the four remaining phases are not tool-building.** Phase 3 is ~77 pages of
  prose (~7,400 lines at the six existing guides' average), Phase 5 needs translators and
  Phase 6 needs a lawyer. Tools per session predicts none of them.
- **Remaining engineering** — Phase 4's billing and SSO, Phase 6's setup — is roughly two
  to three sessions at the observed pace. That part, and only that part, is comparable.

The one genuine clock is the one already recorded above: domain and page age is the single
ranking input that cannot be bought back later, and every pre-launch day spends some of it.

### The first baseline — set 29 October 2026

Projections, not commitments, and the first dates this project has had. They exist so that
from here on an actual ship date has something to be measured against. `docs/status.html`
computes them from each item's estimate and one cadence constant, so changing an estimate
moves the dates rather than leaving a stale number behind.

**Three things gate the launch, and none of them is engineering.** It was five on
29 October; 4.1 and 6.4 both closed on 30 October. The live list is in `docs/status.html`,
which counts them from the item data; this table is the baseline as first set, kept so the
two can be compared. **Expect the tracker's dates to sit later than this table, and by a
growing margin.** It anchors its projections to the current date rather than a stored one
(it was pinned to 29 October and was a day stale by the 30th), and every remaining blocker
is pure lead time that starts when a person starts it — so an unstarted blocker genuinely
recedes a day per day. The gap between the two is how long the critical path has been
waiting, which is the comparison this table exists for:

| Target | Item | |
| --- | --- | --- |
| ~~30 Oct 2026~~ | ~~4.1 Re-tier the catalogue~~ — **done 30 Oct, no tier changes** | ~~0.5 working days~~ |
| ~~30 Oct 2026~~ | ~~6.2 GitHub repo, first commit, CI green~~ — **done 31 Oct, green first run** | ~~owner, 1 day~~ |
| ~~2 Nov 2026~~ | ~~6.4 Accessibility audit~~ — **done 30 Oct, three days early** | ~~1 working day~~ |
| 3 Nov 2026 | 6.1 Credentials (Google, Resend, Dodo, D1) — Resend and D1 done; Google, Dodo and Paddle open | owner, ~5 days |
| **19 Nov 2026** | **6.3 Legal review of the policy pages** | **lawyer, ~21 days** |

- **Launch-ready, blockers only: run `pnpm tracker`.** Both dates in this section used to be
  typed here and both drifted, which is what the tracker exists to prevent: it recomputes
  from today's date plus each item's own estimate, so any copy is stale the next morning.
  What is worth writing down is the shape rather than the number. The blocking engineering
  reached **zero** on 31 October — 1.5 days on 29 October, then 4.1 closed with no tier
  changes, 6.4's audit shipped, and 6.2 went to GitHub with CI green — and then went back up
  to **one day**, because adding item 4.12 on 31 October put a blocker with build work in it
  for the first time since. That is the honest shape: **two of the three blockers wait on a
  person** (6.1's credentials, 6.3's lawyer) and the third is a day of our own work that
  cannot start until 6.1 provides the product ids. So the launch date still moves only when
  someone else starts something — but it is no longer true that nothing we build touches it.
- **Whole roadmap before going live:** the same command prints it, and the gap between the
  two dates is the real price of launching complete rather than staged. The category
  ordering above is the argument for not paying it: about eight of those days open three
  revenue categories, and nineteen serve the one that cannot be won.

  That page count is derived in `docs/status.html`, not fixed here: "one guide per tool"
  moves with the catalogue, so the ~74 written on 29 October was short by three before the
  day was out. Read it off the tracker rather than from this sentence.

  Retention is a worked example of this baseline doing its job. The two items added seven
  days on 29 October (Phase 2 item 5 at two, server retention at four to five); item 5 then
  **shipped on 30 October**, taking its two back out, and the server half moved to Phase 2
  item 6 carrying its five with it. **Neither ever moved the first date**, because neither
  is a launch blocker. That is the point of keeping the two numbers apart: scope added
  after a baseline shows as scope, work finished shows as progress, and neither is
  disguised as the other.

Everything outside those five is additive after launch, which this plan already says of
locales ("purely additive after launch — no retrofit") and is equally true of guides,
landings, Business-tier features and the HEIC decoder.

Both dates assume **three working days a week**, which is what the seven days to 29 October
actually contained. At five, the full plan lands near 2 January 2027 instead. The cadence
moves these dates far more than any estimate here does.

## Two honest limits on "more features than all"

Both follow from the non-negotiables in `CLAUDE.md`, not from effort:

1. **Office → PDF at competitor fidelity.** Needs LibreOffice in WASM: hundreds of
   megabytes, partly LGPL, and it would have to be vendored under our own origin to keep
   `connect-src 'self'`. Phase 2 ships an honest subset instead (DOCX/XLSX/CSV/RTF via
   MIT libraries, fidelity stated plainly), not a parity claim.
2. **AI summarise / translate / chat-with-PDF.** All three competitors now ship these.
   Every one sends page text to a server, which the first non-negotiable forbids. These
   are not deferred; they are declined, and the decline becomes copy: *we cannot read
   your document, which is why we don't offer features that need to.*

Everything else on their lists is reachable. The target is **coverage of the highest-volume
queries at best-in-class depth**, not a tool count — see Phase 2, where the ordering was
revised on 28 October 2026 — plus a category they cannot enter at all (Phase 1).

**Office → PDF — done, 28–29 October 2026.** Word, Excel, CSV and RTF → PDF all shipped.
The library survey found nothing off the shelf: every client-side option is a commercial
SDK, and every reading library for a format we needed (`mammoth` for DOCX) checked out
clean on licence (BSD-2-Clause) and on the thing `exceljs` failed at Phase 2 item 1's own
survey — real browser support, not Node-fs baggage carried along for the ride (verified
by building each candidate's own `/browser` entry through this project's actual Vite
pipeline rather than trusting a registry description, the same way `docx` and
`write-excel-file` were checked). `read-excel-file` was installed during that survey and
removed again once Word → PDF shipped without needing it — it has nothing to do yet, and
an unused dependency is exactly the kind of thing worth not leaving lying around for a
future session to wonder about.

Word → PDF reads via `mammoth` (HTML) and writes via the **same** `Block`/`Span` shape
PDF → Word already produces the other way, so `blocksToPdf.ts` (new: pdf-lib pagination
and word-wrap) is the one genuinely new renderer, not two. `docxToBlocks.ts` parses
mammoth's HTML with a 150-line hand-rolled tokenizer rather than a jsdom dependency,
since mammoth's output is bounded and well-formed and the tokenizer is fully unit-testable
against literal HTML strings without one. Tables and images are dropped, counted, and the
result says so — the same stated-limit honesty as PDF → Word's reverse direction.

Two real findings, each caught before they shipped:
- **The four-font gap.** `integrations/standard-fonts.mjs` only kept Helvetica's metrics
  in the bundle (§4c of `docs/design.md`); rendering real documents needs bold, italic
  and bold-italic too, or `embedFont` throws. `standardFonts.test.ts` caught this
  immediately — it is specifically built to fail the moment `src/` names a standard font
  outside `KEPT`, and did exactly that until `KEPT` was updated to the four Helvetica
  weights.
- **mammoth earns a third ceiling exception.** 301KB raw / 92KB gzipped for DOCX-to-HTML
  parsing, over the default 250KB chunk ceiling — but it is lazy-loaded from
  `docxToBlocks.ts` and fetched only when someone actually converts a .docx, the same
  shape as the two existing exceptions (the job worker, pdf.js's renderer). Matched by its
  own exported `convertToHtml`, for the same filename-instability reason the pdf.js
  exception matches `GlobalWorkerOptions` rather than a chunk name.

`blocksToPdf.ts` is a worker operation — the reverse of `docx.ts`/`xlsx.ts`'s main-thread
choice, and for a mirrored reason: pdf-lib already lives in the worker and this step is
nothing but pdf-lib, so there is no heavy new dependency to keep off the main thread here,
only the usual drawing work the worker already does for every other tool. Verified by
building a real .docx with `docx` (the writer from Phase 2 item 1) and round-tripping it
through Word → PDF, then reading the PDF back with the exact pdf.js `commonObjs` route
PDF → Word uses — so both conversions are checked against each other, not just against
themselves. 363 unit tests, 208 browser tests, 68 pages.

**Excel → PDF and CSV → PDF — shipped 29 October 2026**, `excel-to-pdf` and `csv-to-pdf`,
sharing one new renderer (`tableToPdf.ts`, a bordered grid, pdf-lib, worker-side) the way
N-up/Booklet and PDF→Word/Excel shared theirs — `csv-to-pdf` cost almost nothing on top of
`excel-to-pdf` once the grid existed. Readers: `read-excel-file` (reinstalled; MIT, 12KB
gzipped lazy-loaded, no exception needed) for .xlsx, a hand-rolled RFC 4180 parser for
.csv (`csv.ts`) — small enough grammar that a dependency wasn't worth it. Stated limit:
no formulas, styling, colours or merged cells, equal-width columns. Zero hits against the
four build traps in `CLAUDE.md`/`docs/process.md` this time — the worker chunk stayed at
535KB, confirmed by measuring, not assuming. 384 unit tests, 214 browser tests, 70 pages.

**RTF → PDF — shipped 29 October 2026**, `rtf-to-pdf`, closing out this item. Reuses
`blocksToPdf.ts` outright (a third reader onto the one renderer); the only new file is
`rtfBlocks.ts`, a hand-rolled scanner — nothing current and browser-safe exists for RTF
either (`rtf-parser` is Node-only, stream-based, last published 2019), and RTF's grammar,
scoped to paragraphs/bold/italic, is small enough for one. Deliberately narrower than
Word → PDF: **no headings, no lists** — RTF has no `<h1>`-equivalent, only a paragraph
style name resolved against a stylesheet table, and guessing from font size would be the
approximation this whole item has avoided everywhere else. Zero dependency, so this is
also the only one of the four that needed no worker/main-thread placement decision at
all — no library to misplace. Three real bugs the parser's own tests caught before the
browser test ran: a destination-skip regex that required two backslashes when the common
form (`\fonttbl`) has one; a malformed condition that would have swallowed `\-`/`\_`
silently instead of as the intended no-ops; and `\uN`'s ANSI fallback character never
being discarded, which would have doubled every non-ASCII character in the output.
Verified end to end with a real `{\fonttbl...}` group present in the input, confirming
its font name never reaches the PDF as text while `\b`/`\i` survive. 399 unit tests, 217
browser tests, 71 pages.

**Office → PDF done**: Word, Excel, CSV and RTF all ship. Next in Phase 2: the
commercial-intent track (Bates numbering, PDF/A, extract tables), which the roadmap
scoped to run *alongside* this item rather than after it.

**Bates numbering — shipped 29 October 2026**, `bates-numbering`, first of the three
commercial-intent items. No new dependency: `batesNumber.ts` reuses the same
`prepareText`/`pageFrame` drawing path `addPageNumbers.ts` already has, so this needed
no worker/main-thread placement decision either. The one real difference from page
numbering, and the reason it is its own tool rather than an option on that one: the
sequence has to run *continuously across a whole set of files*, in the order they're
listed, because the point of a Bates number is that a reviewer can cite "ABC000142" and
find that exact page regardless of which file in the set it landed in — resetting per
file would defeat the format. The UI is `MergeTool.tsx`'s reorderable file list plus
`PageNumbersTool.tsx`'s position/size/colour controls; one output per input, named and
stamped as it goes. Pro tier, per the roadmap's "Pro-tier depth" scoping, with early
access still free. Zero hits against the four build traps. 404 unit tests, 218 browser
tests, 72 pages.

**PDF/A conversion — shipped 29 October 2026**, `pdf-to-pdfa`, second of the three
commercial-intent items, targeting PDF/A-**2b** (basic visual reproducibility — what most
archive/compliance intake actually requires, and looser than 1b on transparency and
JPEG2000, which real-world PDFs already use). The one real new-dependency question this
item was expected to raise turned out to have a cheaper answer than installing anything:
PDF/A requires an embedded sRGB ICC colour profile, and every common one (the file
Chrome, Ghostscript and most PDF libraries ship) carries its own distribution terms —
exactly the kind of borrowed-licence question `docs/design.md` §13 already rules
Ghostscript out over. `srgbIcc.ts` instead hand-builds a minimal ICC v2.1 profile at
runtime from the published ICC format and the sRGB spec's own transfer-function constants
— no third-party file, no licence to track, and it is the one tool in this item with no
worker/main-thread question at all, because there was never a dependency to place.

That file earned its own verification before it went anywhere near a PDF: a real bug —
the TRC tag held the sRGB *encoding* curve (linear→device) where an ICC matrix/TRC
profile needs the *decoding* curve (device→linear) — passed every check that only looked
at the binary layout (tag offsets, required tags present, white point matching the PCS
illuminant) and even passed black/white/pure-primaries colour round-trips, because those
happen to be fixed points of both directions. It only showed up testing a midtone
(128,128,128 came back as (223,223,223)) through LittleCMS via Python's Pillow —
independent verification from outside the codebase entirely, the same category of check
as building a real `.docx` through its own writer rather than trusting a parser against
itself. Fixed, then every primary, black, white and three arbitrary colours round-tripped
exactly through `ImageCms.profileToProfile` against LittleCMS's own sRGB profile.

The honest limit, stated on the tool's own page rather than guessed at: PDF/A also
requires every font be embedded, and a conversion tool can't retroactively embed a font
it was never given — that is a font-substitution engine, out of scope the same way
LibreOffice-fidelity Office→PDF was declined. `pdfToPdfA.ts` reports any non-embedded font
by name instead of silently claiming conformance; checking it against this product's own
other tools surfaced something worth knowing regardless of this item — `embedFont(
StandardFonts.X)` across pdf-lib never embeds a font program at all (it is a bare Type1
reference to the reader's built-in Helvetica), so every PDF this product writes via the
standard 14 fonts is itself not font-embedded. Not a defect anywhere else — ordinary PDF
viewers render the standard 14 without needing them embedded — just a fact worth having
on record given this item asked the question directly.

One more real bug, caught the same way as the ICC curve — by checking against an
independent parser rather than trusting the writer's own round-trip: `context.stream()`
takes a plain JS string through pdf-lib's own `typedArrayFor`, which keeps only the low
byte of each character code. That's harmless for the XMP packet's ASCII structure but
silently mangles the packet's required literal BOM marker (and would mangle any non-ASCII
character in a title or author) into a stray byte. `pikepdf` — a different Python PDF
library, wrapping qpdf rather than anything in this codebase's own dependency tree — is
what caught it failing to decode as UTF-8; encoding to real UTF-8 bytes before handing
them to `context.stream()` fixed it, and the same pikepdf check then round-tripped the
whole catalog (output intent, ICC stream, XMP packet) cleanly.

Also rejects any encrypted input, including a restriction-only file that every other tool
opens with an empty password without asking: PDF/A forbids encryption outright, so this
had to be stricter than `loadPdf`'s usual leniency, not reuse it. Pro tier. Zero hits
against the four build traps *in the application code* — both real bugs this time were in
the hand-built binary format underneath it, caught by verification this product's process
already called for, not skipped. 416 unit tests, 220 browser tests, 73 pages.

**Extract tables — shipped 29 October 2026**, `extract-tables-from-pdf`, closing out the
commercial-intent track. Genuinely no new dependency and no fidelity debate, as scoped:
the column-inference engine already existed (`src/lib/convert/table.ts`), built for
PDF → Excel and reused outright rather than re-derived. The only new code is
`extractTables.ts`, and what makes this a different tool rather than a thin wrapper
around PDF → Excel is the one thing it does differently — PDF → Excel keeps *every* page,
prose included, so nothing from the document is ever silently dropped; this tool keeps
*only* the pages a table was actually found on, because the buyer here wants the data and
nothing else. CSV was added as a first-class output alongside Excel for the same reason:
a compliance or data team's next step is usually a script, not Excel, and CSV just needed
a small RFC 4180 writer (`writeCsv` in `csv.ts`, round-tripped against the RFC 4180 reader
Office → PDF already built for CSV → PDF). Stated limit: a table spanning more than one
PDF page becomes more than one output file, in page order, rather than one merged table —
deciding where a continued table's header ends and data resumes is exactly the kind of
guess this item's tools have avoided making elsewhere. Zero hits against the four build
traps. 423 unit tests, 223 browser tests, 74 pages.

**Commercial-intent track done**: Bates numbering, PDF/A conversion and extract tables all
shipped, 29 October 2026.

---

## Phase 1 — Foundations everything inherits

First because retrofitting any of it across 60 tools and 100+ pages costs several times
what building it now does. No new tools, no new pages; the machinery under both.

- **Installable / offline — done.** Service worker plus manifest, caching the vendored
  pdf.js and OCR assets. Same origin, so the CSP is untouched. This sets the asset and
  caching strategy every later tool has to fit, which is exactly why it came first.
  iLovePDF and Smallpdf *sell* desktop apps for offline use; we get it from a service
  worker because the work already happens locally. `docs/design.md` §4a.
- **SEO and AI-rank generators — done**, with one change from the original plan: `HowTo`
  (from the `howTo` strings each tool already had), `ItemList` for the catalogue, and
  `Product` with real, pricing-flag-aware offers are all shipped (`src/lib/seo.ts`), as
  are `llms.txt` and `llms-full.txt`. The per-tool plain-text mirror was dropped once it
  was clear tool pages are already static HTML a non-JS reader can parse — `llms-full.txt`
  covers the actual gap in one fetch instead. `docs/design.md` §4b.
- **Performance budget, enforced in CI — done.** `tests/e2e/performance.spec.ts`
  (per-chunk ceilings plus per-page weight/LCP/CLS budgets) and
  `.github/workflows/ci.yml`. Found and fixed a real regression while being built: pdf-lib
  was leaking onto the main thread of every tool page at 569KB; see `docs/design.md` §4c
  for what caught it. The workflow itself has not run anywhere yet — this repo has no
  git remote (`docs/TODO.md` §4a).
- **Related-tools and category-hub components — done.** Related-tools turned out to
  already exist on every tool page; the real gap was category hubs, now live at
  `/tools/<category>` (`src/pages/tools/[category].astro`) — one per entry in
  `categories`, each with its own `ItemList`/`BreadcrumbList` schema, linked from the
  home page's category sections (collapsible since 3 November 2026 — the heading is a
  `<details><summary>` toggle, not a link; the hub link moved to its own "See all" line)
  and from every tool page's breadcrumb (now a real middle step, not plain text).
  `tests/e2e/categoryHub.spec.ts`.
- **Tools sidebar and a 15-skin picker — done 2 November 2026, extended 3 November.**
  Not originally planned as a Phase 1 item — a design-exploration session
  (`ToolsSidebar.astro`, `SkinPicker.astro`, `src/styles/skins.css`) that ended with
  real, shipped navigation machinery every tool page, category-hub page, and (since
  3 November, hidden by default there) the home page now carries, added here after the
  fact on owner instruction rather than left undocumented. Default skin changed from the
  original ("Soft Product") to "Playful Rounded"; remembering a choice between visits is
  a Pro/Practice perk. `docs/design.md` §10, §10a. **Extended 7–8 November:** Recent and
  Starred tools (stars synced to the account), handles on the sidebar's inner edge,
  feature-request and feedback dialogs.

**Done when:** the site installs, works with the network off, a new tool page arrives
with complete structured data and internal links for free, and every tool/category page
carries the same navigation chrome. All five.

## Phase 2 — Features

The long pole, and now second rather than fourth: a landing page or guide cannot be
written for a tool that does not exist, and writing them twice is the rework this order
exists to avoid. Licence-clean and device-only throughout, ordered by search volume per
unit of work.

**Reordered 28 October 2026 around search volume rather than category.** The old order
ran privacy-native → cheap wins → Pro depth → hard conversions, which put the single
largest keyword in the category last. Measured monthly volumes: **PDF → Word ~5,000,000**,
merge ~2,240,000, compress ~1,830,000, PDF → JPG and JPG → PDF ~246,000 each. Tool *count*
is explicitly no longer the target — ihatepdf.cv pads to "60+" with GST invoicing and POS
billing, and that is a race worth losing.

**Resequenced by mechanism, 28 October 2026 (cost pass).** Search volume decides which
tools are worth building. It does not decide the cheapest order to build them in, and
inside this phase it decides nothing at all: **the site launches all at once, so no page
is indexed and no keyword is earned until Phase 6 regardless of the order here.** What
the order does change is cost. Item 2 — sanitize, remove metadata, edit metadata, remove
annotations — is `metadata.ts`, `links.ts` and `forms.ts`, three files item 0 just
created. Built now those tools are mostly wiring; built after the conversions they begin
by re-deriving object-layer work that is currently fresh. The same argument bundles most
of item 3 (N-up, booklet, reverse, alternate, blank page) as `assemble.ts` variants.

**So: item 2 next, then the `assemble.ts` group from item 3, then item 1.** PDF → Word is
unaffected either way — a new dependency and a new mechanism, with no siblings to batch it
against — so the concern that moved it up (not leaving the category's largest keyword for
last) is untouched by letting three nearly-free tools go first. The one real cost of this
order is as insurance: if the single-launch plan ever gives way to shipping early, having
the head-term tools done first would have made the partial state worth more. Accepted
deliberately, on the grounds that the plan says otherwise and the hedge for an early
launch is the home and policy pages, not the tool order.

0. **Depth pass on the head-term tools, before any new tool.** We are beatable on a
   checkable axis on our own second-biggest keyword: `merge` does not preserve bookmarks,
   and its FAQ says so. Sejda and Stirling both preserve them. `@cantoo/pdf-lib` has no
   outline API at all — its own source warns that copying "won't copy all information
   over (acroforms, outlines, etc...)" — so this means building the `/Outlines` tree
   through the low-level `PDFContext` API, with unit tests over nested and malformed
   outline trees. Budget it as a real operation, not a patch. The same pass covers
   metadata, link annotations and form-field survival across merge, split and organize.
   **Winning the top five keywords at a depth nobody matches is worth more than tools
   26 through 60.**

   - [x] **Merge bookmarks — shipped 28 October 2026.** `src/lib/pdf/outlines.ts` reads
     a source document's `/Outlines` tree and rebuilds it in the merged document, pages
     remapped to the merged numbering, nesting and order preserved. Supports direct
     `/Dest` arrays and `/GoTo` actions; **not** named destinations or `GoToR`
     (cross-document) actions — a bookmark using either still keeps its title and
     children, just without a working jump target, rather than disappearing. Every
     type-checked lookup is wrapped (`tryLookup`) because `PDFContext.lookupMaybe`
     throws on a type mismatch rather than returning `undefined` — caught by a test for
     a named destination before it shipped. Cycle-safe (`MAX_OUTLINE_DEPTH`), tested
     against a hand-written cyclic `/Next` chain. `tests/unit/outlines.test.ts`,
     `tests/unit/merge.test.ts`; FAQ copy in `src/i18n/en/tools/merge.ts` updated to
     match. 224/224 unit tests, `merge.spec.ts` e2e unaffected.
   - [x] **Metadata, link annotations and form-field survival — shipped 28 October
     2026.** Three separate gaps, each checkable in isolation: `copyPages` never
     copies the `/AcroForm` catalog entry, so a merged/split/organized form had
     working-looking boxes with no field behind them (`src/lib/pdf/forms.ts`, reusing
     the widget annotations `copyPages` already copies rather than re-copying
     anything); `PDFDocument.create()` starts with no title/author/subject/keywords,
     so every output lost them (`src/lib/pdf/metadata.ts`, first non-empty value
     across inputs wins); and — found while building the other two, not in the
     original bug report — `copyPages` deep-copies a Link annotation's destination
     page as an independent orphan object even when that page is *also* being kept in
     the same output, so every internal link was already silently broken, not just
     the ones crossing a split boundary. `src/lib/pdf/links.ts` resolves each link's
     original target against the source (the same technique `outlines.ts` uses for
     bookmarks) and either repoints it at the real output page or drops it, rather
     than ever leaving it pointing at the orphan. Wired into `merge.ts`, `split.ts`
     and `assemble.ts` (the shared core of Remove/Extract/Rotate/Organize). Known
     limits, same "state it, don't hide it" policy as the bookmarks work: same-named
     fields from different merged inputs aren't disambiguated, and a link on a page
     that's explicitly duplicated within one `assemble` call (not the common case) is
     dropped rather than repointed, since that page's extra copy is made in isolation
     from the rest of the output. `tests/unit/{merge,split,assemble}.test.ts`;
     234/234 unit tests, `merge.spec.ts`/`organize.spec.ts` e2e unaffected.
1. **The hard conversions, moved up from last.** PDF → Word and PDF → Excel (Adobe's most
   monetised conversion; text plus basic layout via MIT libraries), then the honest
   Office → PDF subset. Ship with fidelity stated plainly on the page — an honest
   stated-limit tool that ranks beats a perfect one that ships in month nine.

   **Library evaluation, 28 October 2026 — decided, not started.**

   - **Nothing off the shelf is usable.** There is no client-side PDF → DOCX library under
     a licence we can take. Everything that exists is either a commercial SDK (Nutrient,
     Aspose, Native Documents' `docx-wasm`, which converts docx *to* PDF rather than the
     reverse) or a server API (ConvertAPI), which the first non-negotiable forbids
     outright. The structure inference is ours to build either way, which is the right
     outcome: it is the quality axis the tool competes on.
   - **Chosen stack: pdf.js for reading, `docx` for writing.** `docx` v9.15.0 is **MIT**,
     280KB minified / 82KB gzipped, and already depends on `fflate` — the library the
     `zip` op uses — so it brings no second ZIP implementation. pdf.js is already vendored.
   - **Declined: `@llamaindex/liteparse-wasm`.** Apache-2.0, so licence-clean, and its
     pitch ("spatial text extraction") is precisely the hard part — but it is 4.8–5.5MB
     unpacked, would have to be vendored under our own origin for the CSP, and would be a
     second full PDF engine carried for one tool, on top of pdf.js's 3.8MB and Tesseract's
     22MB. It would also own the part we most want to own.
   - **`docx` must be imported dynamically, and the budget already proves it.** The worker
     chunk is 489KB raw after the font work (§4c of `docs/design.md`); a static
     `import … from 'docx'` puts it at ~769KB, over the **750KB worker ceiling** in
     `performance.spec.ts`. So `await import('docx')` inside the op, giving it its own
     chunk fetched only when someone converts. The shape that follows: extract on the main
     thread with pdf.js (as `PdfToTextTool` already does), hand a structured text model to
     a worker op, and let that op build the file — which also makes the inference a pure,
     unit-testable function rather than something tangled with pdf.js.

   **Spike result: bold and italic are available, so v1 can claim them.** The open
   question was that `getTextContent()` returns an opaque font id (`g_d0_f1`) and its
   `styles` map says only `fontFamily: "sans-serif"` — never which font is bold. Answer,
   verified: call **`page.getOperatorList()` first**, which is what makes pdf.js parse the
   page's fonts, and then `page.commonObjs.get(item.fontName)` returns the parsed font
   with explicit `bold` and `italic` booleans, plus a `fallbackName` of `serif`/
   `sans-serif` for choosing a Word font family. Checked against a fixture using
   Helvetica, Helvetica-Bold, Helvetica-Oblique and Times-BoldItalic: all four read back
   correctly. Two things to respect when building it — `commonObjs.get()` **throws**
   ("Requesting object that isn't resolved yet") if called before the operator list is
   built, so the order is load-bearing and needs a comment saying why; and `commonObjs` is
   not part of pdf.js's documented API, so it needs a test guard of its own, the same way
   the standard-font stub does. The fallback if a bump ever removes it is reading
   `/BaseFont` per page via pdf-lib (confirmed to give `Helvetica-Bold`,
   `Times-BoldItalic` outright), at the cost of mapping resource names to pdf.js's ids
   through the content stream.

   **Also found: `hasEOL` is not a paragraph signal.** It came back `true` on
   mid-paragraph lines and `false` on the line that began a new paragraph. Structure has
   to come from geometry — y-gaps (16pt within a paragraph against 34pt between, measured),
   x for indentation, x-clustering for columns, and font size against the modal body size
   for headings. Worth noting `pageText()` in `src/lib/pdfjs.ts` currently relies on
   `hasEOL`, so PDF → Text has a cheap quality win available on the same work.

   **v1 scope, to be stated plainly on the page:** paragraphs, headings by relative size,
   bold and italic, lists, single-column reading order. Explicitly out, and said so:
   tables, images, exact fonts, colours, and multi-column reading order.

   - [x] **PDF → Word — shipped 28 October 2026**, `pdf-to-word`, to that scope. Three
     parts: `src/lib/convert/structure.ts` infers the outline from pdf.js's positioned
     runs, `pageTextRuns` in `src/lib/pdfjs.ts` resolves each run's style, and
     `src/lib/convert/docx.ts` writes the file. The inference is a pure function with 19
     unit tests, which is where the output quality actually lives.

     **Every threshold is relative to the document, not absolute.** Body size is whichever
     size covers the most characters; a heading is text meaningfully larger than that; a
     paragraph break is a baseline gap wider than *this document's own* most common gap.
     So a document set in 10pt and one set in 14pt both come out sensibly, and there is a
     test pinning exactly that. Two refinements the tests forced: the usual line gap has to
     be the **mode** of the gaps, not the median (with two paragraphs there may be one
     normal gap and one paragraph gap, and the median lands on the paragraph gap and then
     finds nothing unusual about it); and words hyphenated across a line break are closed
     up, but only when the next line starts lower-case, so "appendix B - Notes" keeps its
     dash.

     **Columns are detected rather than handled.** A page laid out in columns reads wrong
     top-to-bottom and nothing in a PDF says "these are columns", so `hasGutter` looks for
     a vertical band no text crosses and the result panel names the pages affected. It has
     to test **runs**, not assembled lines: columns printed side by side share a baseline,
     so line grouping merges them into one full-width line and the gutter vanishes before
     it can be measured — the first version did exactly that and detected nothing.

     **It is not a worker operation, and that was forced by the budget.** It started as
     one; `docx` ended up inside the shared job-worker chunk anyway, because Vite bundles
     workers as `iife`, a format that cannot code-split, so the dynamic import was inlined
     and the worker went 489KB → **770KB, past its 750KB ceiling**. Reading already
     happens on the main thread through pdf.js and this step is XML and deflate, so the
     whole conversion runs there and `docx` lazy-loads as its own chunk: **206KB raw /
     60KB gzipped**, under the default 250KB ceiling, fetched only when somebody converts.
     The worker is untouched at 489KB. Also worth knowing: `Packer.toBuffer()` throws
     "nodebuffer is not supported by this platform" in a browser —
     `Packer.toArrayBuffer()` is the portable one, and only the browser test caught it.

     Verified by round trip in `tests/e2e/convert.spec.ts`: a PDF with a 24pt bold title,
     a two-line paragraph, an italic aside and two bullets converts to a .docx whose
     `word/document.xml` carries `Heading1`, real `<w:b>`/`<w:i>` runs, a real `<w:numPr>`
     list, and the two lines joined into one paragraph — with the bullet character absent,
     because it became formatting. That test is also the guard on the undocumented
     `commonObjs` route. 316 unit tests, 202 browser tests, 66 pages.

   - [x] **PDF → Excel — shipped 28 October 2026**, `pdf-to-excel`, on the same
     foundation: `pageTextRuns` is shared outright, and the line-grouping half of
     `structure.ts` (`toLines`, `dominantSize`) was pulled out into `src/lib/convert/lines.ts`
     so table detection (`table.ts`) could reuse it rather than re-deriving "what's on
     this line together" a second time.

     **Writer: `write-excel-file`, not `exceljs`.** `exceljs` claims browser support but
     carries nine dependencies including `archiver`, `unzipper` and `tmp` — Node-filesystem
     packaging baggage that is exactly the kind of thing that bites when bundled for a
     browser. `write-excel-file` is MIT, has **one** dependency (`fflate`, already
     bundled), and ships a dedicated `/browser` entry whose `.toBlob()` returns bytes
     without ever touching `<a download>` — the one thing checked before picking it,
     since the alternative, `.toFile()`, drives a browser save dialog itself and would
     have bypassed this app's own download flow.

     **Column detection is a generalisation of PDF → Word's column-*warning* into
     column-*finding*.** `hasGutter` (in `structure.ts`) looks for one gutter and says a
     page is suspect; `table.ts`'s `columnBoundaries` scans for every such gutter and
     uses each one as a split point — the same technique Adobe's own PDF-to-spreadsheet
     export and `pdftotext -layout` use for a PDF with no tagged table. A real ambiguity
     surfaced while testing it: **a column gutter and a wide word-space look identical**
     to a whitespace scan when both happen to be consistent down the page, so the
     minimum-gutter-width threshold has to clear a normal word gap by a wide margin
     (10pt against a word gap's `size × 0.2`) rather than just excluding letter-spacing
     noise — the first version of a test fixture proved this by accident, putting an
     ordinary word gap at a width that read as a column.

     **Every page gets a sheet, whether or not a table was found.** A page with no
     detected columns still becomes a sheet with one wide column — the spreadsheet
     equivalent of opening a plain-text file — because silently dropping a page a
     visitor expected to see would be worse than a sheet that is just one column. Sheets
     are named by real page number (`Page 1`, `Page 2`) even when earlier empty pages
     are skipped, so a sheet is never mislabelled by its position among the ones kept.
     Not a worker operation, for the identical reason PDF → Word isn't (above) — reading
     is already main-thread, and `write-excel-file` lazy-loads as its own **69KB raw /
     19KB gzipped** chunk, under the default ceiling with no exception needed.

     Verified by round trip: a price list (`Item`/`Qty`/`Price` columns) plus a page of
     ordinary two-line prose converts to an .xlsx with two sheets — the table's columns
     landing in separate cells, the prose staying joined as full sentences in one column —
     checked by unzipping the result and searching its XML for each expected cell. 331
     unit tests, 205 browser tests, 67 pages.
2. **Privacy-native tools** — sanitize / remove metadata, edit metadata, remove
   annotations. (Flatten already ships.) A documented market gap (Smallpdf: no, Sejda:
   partial) and the set our positioning most obviously should already have. Still early
   because it is cheap, licence-clean and entirely ours to claim.

   - [x] **Remove metadata — shipped 28 October 2026**, `remove-metadata`, and it absorbed
     the "sanitize" half of this line: one page serves both intents, metadata always and
     active content (JavaScript, embedded files, open and page actions) behind a checkbox.
     `src/lib/pdf/ops/removeMetadata.ts` strips the Info dictionary, the XMP packet, the
     trailer `/ID` and the per-page editing leftovers (`/PieceInfo`, `/LastModified`,
     page-level XMP). Two things found while building it, both now guarded by tests:
     **unlinking metadata does not remove it** — pdf-lib writes back every object it
     parsed, so an orphaned XMP packet stays readable in the output until
     `pruneUnreachableObjects` drops it, which is the difference between the claim and the
     truth; and **the `/Names` tree cannot be deleted wholesale**, because `/Dests` lives
     there and named destinations are what bookmarks and links point at, so only
     `/JavaScript` and `/EmbeddedFiles` come out. This is also the one operation that
     deliberately does **not** call `markProduced`: stamping our own name into a file
     someone asked to have metadata removed from would both write new metadata and reveal
     which tool they used. The page states that we add nothing, it is checkable in any
     metadata viewer, and a unit test plus a browser test hold it true.
     `tests/unit/removeMetadata.test.ts` (9), `tests/e2e/secure.spec.ts`; 243/243 unit
     tests, 29/29 in `site.spec.ts`.
   - [x] **Edit metadata — shipped 28 October 2026**, `edit-metadata`, in the `edit`
     category rather than `secure`: removing metadata is cleaning, editing it is editing.
     A read op (`readMetadata`) fills the form from the file, `editMetadata` writes it
     back through `applyMetadata` in `metadata.ts`. Two decisions worth keeping: a field
     left empty is **removed** rather than stored as a blank string, since clearing the
     author should leave no author; and the **stale XMP packet is dropped on save**,
     because a PDF can state its author twice — Info dictionary and XMP — with readers
     disagreeing about which wins, so editing one leaves a file that shows the old name in
     some viewers and the new one in others. Competitors leave that contradiction in
     place; the result panel says what we did about it. `tests/unit/editMetadata.test.ts`
     (8), `tests/e2e/edit.spec.ts`.
   - [x] **Remove annotations — shipped 28 October 2026**, `remove-annotations`. As
     predicted, `flatten.ts`'s subtype walk without the painting step. Form fields always
     survive (emptying a form is Flatten's job, and deleting someone's fillable fields
     here would be a surprise) and links survive unless asked for, since a link is
     navigation rather than markup. Pop-ups are removed with the comment they belong to
     rather than counted separately, so the count matches what a person would count.
     Pruning matters more here than anywhere: a marked-up file carries a drawn appearance
     per comment, and those are often the bulk of its size.
     `tests/unit/removeAnnotations.test.ts` (6), `tests/e2e/secure.spec.ts`.

   **Item 2 complete.** 256/256 unit tests, 31/31 in `site.spec.ts`, 60 pages built. The
   mechanism-locality bet from the cost pass paid: all three tools reused
   `metadata.ts`, `links.ts`, `prune.ts` and `flatten.ts`'s annotation walk, and the only
   new PDF-level knowledge needed was where `/Dests` lives.
3. **Cheap wins** — extract embedded images, PDF → Markdown, N-up, booklet, reverse /
   alternate / mix pages, add blank page, page labels. Sejda and Stirling ship most of
   these; none needs a licence we cannot take.

   - [x] **Alternate & mix pages — shipped 28 October 2026**, `mix-pdf-pages`. A real
     tool, because interleaving two documents is something no existing tool here does.
     It needed **no new operation at all**: the page order is one pure function
     (`interleavePages` in `src/lib/organize/pages.ts`, 7 unit tests) and `assemble`
     already builds a document from pages of several inputs. Reversing the second file is
     **on by default**, because the case people actually have is a stack scanned front-side
     then flipped and fed again, which yields the backs last-sheet-first; defaulting it off
     would make the common case the one that needs configuring. Unequal page counts append
     the leftovers rather than dropping them.
   - [x] **Reverse pages and add blank page — shipped 28 October 2026 as landings, not
     tools.** Organize already does both (it has a Reverse order button and blank-page
     insertion), so building separate tools would have been exactly the padding this plan
     says to lose — `reverse-pdf-pages` and `add-blank-page-to-pdf` give each query its own
     page and copy against the tool that already serves it. Reverse carries
     `preset: { apply: 'reverse' }` and `OrganizeTool` honours it on the first file it
     opens, because the intent behind that search is one click, not dragging 200 pages;
     "Undo all changes" still restores document order. Add blank page takes no preset
     deliberately — the button is already one click, and inserting a page nobody asked for
     yet would be presumptuous.
   - [x] **N-up and booklet — shipped 28 October 2026**, `multiple-pages-per-sheet` and
     `booklet-pdf`, on one shared engine: `imposePages` draws source pages onto sheets, and
     the two tools differ only in the pure function that orders the cells (`nUpSheets` and
     `bookletSheets` in `src/lib/organize/imposition.ts`). These did need new drawing code —
     `embedPage`, not `copyPages` — and probing it first turned up two faults that would
     each have shipped as a silent bug:

     **`embedPage` reports the raw MediaBox, ignoring `/Rotate`.** A 200×400 page that every
     viewer shows as 400×200 would have been laid out as a portrait page and come out
     sideways — and scans carry `/Rotate` constantly, so this would have hit the documents
     the tool is most used on. `fitIntoCell` works from the displayed size and mirrors the
     angle, because `/Rotate` is clockwise where `drawPage`'s `rotate` is counter-clockwise;
     it also compensates the anchor, since `drawPage` turns the page about the anchor rather
     than about its centre.

     **`embedPage` throws on a page with no `/Contents`** — a blank back from a scanner —
     and it throws from inside `save()` rather than from `embedPage`, so there was nothing
     useful to catch. Pages with no contents are now detected and left out, their cell
     empty, and the result says how many; the operation only fails when *nothing* can be
     drawn.

     Verified by position rather than by structure: `organize.spec.ts` extracts text
     coordinates with pdf.js and asserts the four pages land in reading-order quadrants,
     and that the booklet's first sheet really does put page 1 on the right-hand half with
     pages 4 and 5 facing each other on the innermost sheet. Asserting sheet counts and
     file sizes would have passed with every page stacked in one corner.

     Stated plainly on both pages: **imposition drops links, comments and form fields**,
     because `embedPage` copies drawn content into a form XObject. That is inherent — several
     pages now share a sheet, so a link's rectangle no longer means what it did — rather
     than a shortcut.
   - [x] **Page labels** (`add-page-labels`), **extract embedded images**
     (`extract-images-from-pdf`) and **PDF → Markdown** (`pdf-to-markdown`) — shipped
     29 October 2026. Notes in `docs/shipped.md`; this is where the ship log moved, so
     the plan stops growing by thirty lines a tool.

   **Item 3 cheap wins complete.** The HEIC decoder shipped 29 October 2026 too
   (`docs/shipped.md`); what is left of `docs/TODO.md` §6a is the confirmatory legal read
   on HEVC exposure before the public sees it, which is not engineering.

   **Process note.** `pnpm og` must be run after adding any tool or landing: share images
   are pre-rendered PNGs in `public/og/`, and `seo.spec.ts` fails with a 404 on the new
   slug until they exist. The generator reads the registry, so it needs no editing — it is
   purely a step that is easy to forget, and the SEO spec is what catches it.
4. **Pro-tier depth** — Bates numbering (aimed at firms), PDF/A conversion for
   compliance buyers (**not** via Ghostscript, which is AGPL), extract tables.
5. **Device-local recent work — shipped 30 October 2026.** Note in `docs/shipped.md`. The
   reason it sat in Phase 2 rather than later was the dependency rule this plan is built
   on, not its size.

   Every tool used to start from an empty file picker. Someone who compressed a deck,
   closed the tab and came back had nothing to come back to — a genuine gap against every
   competitor, all of whom keep recent files, and the most common reason a person reaches
   for a server-side tool despite preferring not to. The fix needed no server: **a
   recent-work shelf in IndexedDB**, holding the files a person chose to keep, with an
   expiry **they** pick — **5 minutes, 1 hour or 24 hours**, and a custom length on Pro —
   and a sweep that enforces it on read. Off by default; nothing is retained unless asked
   for, and the choice is not remembered between runs.

   **Two things changed from this item as first written, both decided while building it.**
   The durations were 24 hours / 7 days / 30 days and are now minutes-to-a-day, which the
   owner set: short retention is both the safer promise and the better fit for "let me come
   back to my work". And the store is **IndexedDB rather than OPFS** — OPFS's write path
   differs by engine (`createWritable` against a worker-only `createSyncAccessHandle`), and
   Safari and iOS are exactly the engines this project cannot test locally, so the API with
   one write path everywhere removes a risk only a user could have found. A finished job's
   bytes are already in memory, so OPFS's streaming advantage bought nothing here.

   This reverses half of a line in `docs/design.md` §13 ("the dashboard shows tools, not
   files"), and that entry now records the reversal and its scope. The half it does *not*
   touch is the one that matters: the bytes never leave the machine, so `connect-src 'self'`
   still proves the claim, and the privacy pitch gets **stronger** rather than weaker —
   "your files are still here tomorrow, and they still never left your device" is a sentence
   no server-side competitor can write.

   **Why Phase 2 and not Phase 4**, where the dashboard work otherwise lives: this ships UI
   strings that Phase 3 describes and Phase 5 translates. Landing after either one means
   writing the dashboard's copy twice and paying the locale multiplier on the second
   version — exactly the rework boundary "Why this order" below exists to avoid. Two
   working days here; a rewrite of dashboard copy across two locales later is not two days.

   **The eviction question the probe was for is now a stated ceiling.** Browsers evict
   this storage under pressure without asking us, so Pro's custom length is capped at
   **seven days** — a platform limit, not a pricing one, and the UI says so where someone
   asks for longer. That cap is exactly what item 6 below exists to lift.

   One more precedent it had to reverse, beyond `design.md` §13:
   `src/lib/recentActivity.ts` stores only a tool id and a timestamp, and says why — a list
   of document names on a shared computer is a new place for someone else to read what the
   user has been working on. Keeping the files themselves reopens that, so it is bounded
   three ways: opt-in per result, never on by default, and measured in minutes and hours
   rather than weeks. The short durations the owner chose are what make this defensible;
   the original 30-day option would not have been.
6. **Server-backed retention for Pro — added 30 October 2026, replacing Phase 4's
   zero-knowledge share links (id 4.8, now retired).** Item 5 ships the device half; this
   is the other half, and the owner placed it here so there is **one** item for server
   retention rather than two descriptions of the same mechanism in different phases.

   What it adds: a kept file that outlives the device's seven-day ceiling, survives a
   cleared browser, and can reach another machine. **Mechanism unchanged from the retired
   4.8** — the browser encrypts with AES-GCM via WebCrypto before anything is sent, the key
   lives in the **URL fragment**, which browsers never include in a request, and we store
   ciphertext with an expiry and no key. We cannot produce plaintext on any request, court
   order included. Opt-in per file, Pro only.

   **What it costs, and all three were true of 4.8 as well:**

   - **"Marginal cost per job ~0" stops being universally true.** It stays true for every
     tool and is false for this one feature, which is why it is Pro-only and quota'd — the
     comparison table's cost row needs the carve-out written beside it, not dropped.
   - **`connect-src 'self'` stops being proof on its own.** It always permitted a
     same-origin upload; with nothing to upload to, the directive was equivalent to the
     claim. **This is a Phase 3 dependency**: items 3.4 and 3.5 must be written already
     knowing this is coming, because the honest wording — *nothing leaves your device
     unless you ask it to, and it is encrypted before it does* — is on the page written to
     be quoted verbatim.
   - **A second legal pass**, after the launch review rather than inside it: retention
     schedule, abuse policy, and a DPA that now says we hold ciphertext we cannot read
     rather than that we hold nothing. Tracked in `docs/legal-checklist.md` §3.

   Needs an **R2 binding**, which does not exist today (`wrangler.toml` has D1 only), so it
   brings its own `docs/TODO.md` entry when it starts and not before — that file's contract
   is that the code is written and only the real value is missing. **After launch, and after
   demand:** item 5 covers the commoner need at a fraction of the cost, and building a
   storage product nobody asked for is the one irreversible mistake available here. Four to
   five working days when it is earned.

   **Plain readable server storage stays declined** — `docs/design.md` §13 holds the
   reasoning, so a later session does not reopen it as the "simpler" version of this.

**A second, parallel track — added 28 October 2026 after the `/compete` revenue review.**
The ordering above is by search *volume*, which drives traffic. It is nearly inverted
from the ordering by commercial *intent*, which drives revenue: Bates numbering,
PDF/A and extract tables are narrow, low-volume, licence-clean, cheap to build, and are
the terms a buyer — a law firm, a compliance team, a medical practice — searches with
money already decided to spend. Item 4 above schedules them last because they are small;
run them **alongside** item 1 instead, not after it. They need no fidelity debate and no
new dependency, so there is no reason the volume track should go first just because it
is bigger.

Also in Phase 2, and tracked in `docs/TODO.md` §6a: **HEIC → PDF via libheif-wasm**,
lazy-loaded and unbundled.

Every tool arrives the way `CLAUDE.md` describes: registry entry, strings, operation,
unit tests, and a browser test with `assertClean()`.

**Done when:** the ten highest-volume PDF queries are each served by a tool that is best
in class on a checkable axis, and every tool on Smallpdf's 40 and Sejda's 40+ is shipped,
deliberately declined, or impossible — written down either way. Coverage of demand is the
target; the tool count is a consequence, not a goal.

## Which category to win, in what order — decided 30 October 2026

The second competitive review split the market into categories that behave differently.
Three are winnable by one person because nothing in them costs time per customer; one is
not winnable and should not be fought; two wait. This section sets the **order**, and the
ordering principle is edge per working day, not phase number.

| # | Category | Winnable solo? | Our move |
| --- | --- | --- | --- |
| 1 | Free consumer utility | No — a decade of domain age is uncatchable | Don't fight it. It is the acquisition layer and the only thing that accrues domain age. Win on *provability*, not breadth |
| 2 | Prosumer online subscription | **Yes** — zero support burden | Reprice just beneath iLovePDF. This is where today's Pro belongs |
| 3 | Professional desktop editor | No on depth | Flank: no install, nothing uploaded, works offline. Never claim editing parity with Adobe or Foxit |
| 4 | **Vertical legal/compliance** | **Yes — best revenue per hour available** | The target. All six professional tools already serve it, and since item 4.9 they are the Practice tier; what is still missing is trust and packaging, not product |
| 5 | Self-hosted / air-gapped | **Yes** — a licence key and a document | Business edition. Beats Stirling-PDF on "nothing to deploy" only if the deployment is written down |
| 6 | Developer API | Marginal — creates uptime expectations | Keep as item 4.7: Business-only, on the customer's server. Never hosted by us |
| 7 | Bespoke enterprise | Not yet | Phase 7, with five entry conditions |

**The sequence, and the point of it.** Categories 2, 4 and 5 are all reachable with roughly
eight working days of work. Phase 3's 40+ landings and ~43 guides are **19.5 days serving
category 1**, the one category that cannot be won. So the order is:

1. **Items 3.4 and 3.5** — 1.5 days. The verifiability page and the claims page. Cheapest
   differentiation on the plan, and 3.5's content *is* the security answer pack category 4
   needs, so it is paid for twice. **Both done 30 October 2026.** Next in Phase 3 is the
   programmatic landings and guides work above, which is where the 19 remaining days sit.
2. **The price decision** (`docs/TODO.md` §0a) — must land before `terms.md` §5's
   early-access promise is public, because afterwards a rise costs goodwill.
3. **The DPA and Business licence terms** — into the 6.3 lawyer engagement, where the
   marginal cost is near zero. A separate engagement later means a fresh minimum fee.
4. **The Practice tier** — category 4 packaging. **Done 30 October 2026** (item 4.9), and so
   is the trust page it is sold on (item 3.5, `/claims`). The click-through DPA is the one
   piece still open, in the 6.3 lawyer engagement.
5. **Self-host deployment guide, SSO, audit logging** — category 5. ~7 days total.
   The guide is **done 1 November 2026** (item 4.10, `docs/self-hosting.md`); SSO and audit
   logging remain.
6. **The API** (4.7), then **Phase 7** when its conditions hold.
7. **Phase 3's landings and guides last** — they still get built, because domain age and
   coverage compound, but they stop blocking the categories that pay.

This is a resequencing, not a cut. Nothing is removed from Phase 3; it moves behind about
eight days of work that opens three revenue categories instead of one unwinnable one.

## Phase 3 — Page surface and content

After Phase 2, so each page is written once against a tool that exists, and inherits
Phase 1's generators — and assembled from the facts each tool shipped with rather than
researched a second time (`CLAUDE.md`, and the cost pass above).

Every page here is tagged **as it is written** for whether it belongs to the translatable
surface or stays English-only; Phase 5 settles which is which. Tagging at authoring time
is free, and working it out afterwards means re-reading a hundred pages.

- **Programmatic landings.** 40+ is the target (`pnpm counts` has today's number; 12 on 9 November 2026, including compress-to-200-KB and -1-MB). Extend the `landings` array: every image
  format in and out, every "A to B" pair we can genuinely do, every phrasing people
  search for. Distinct copy, not thin duplicates.
- **Comparison pages. Done 1 November 2026** (item 3.2) — all seven, the last five
  written that day. 2 before (iLovePDF, Smallpdf) → add Adobe, Sejda, PDF24,
  pdfFiller. These rank for "X alternative" — high intent, low competition — and ours
  write themselves on the ads, CSP and offline arguments.
- **Guides.** 6 today → one per tool minimum, each answering its query in the first two
  sentences so it is quotable by an assistant.
- **The verifiability page.** "Turn off your Wi-Fi and keep working" as a live demo,
  extending `how-to-check-if-a-pdf-site-uploads-your-files.md`. **Done 30 October 2026**
  (item 3.4), at `/verify` — and it turned out not to need the DevTools network panel at
  all: the page reads the browser's own Resource Timing record and reports a blocked
  cross-origin request from the `securitypolicyviolation` event, so the proof is on the page
  rather than in instructions. The guide still owns the thorough method, for any site.
- **A citable claims page** — what we store, what we send, what the CSP forbids, written
  to be quoted verbatim. **Done 30 October 2026** (item 3.5), at `/claims`.

  **Promoted 30 October 2026: 3.4 and 3.5 are no longer "additive after launch".** The
  second competitive review found two rivals using our exact words — "nothing leaves your
  browser" — with claims their own pricing pages contradict. The words are now commodity;
  only the demonstration is ours. These two pages are **1.5 working days** and are the
  cheapest differentiation left on the plan, so they should be built before the landings and
  guides above them, which compete for volume terms that four free rivals also serve. They
  remain non-blocking for launch; the change is ordering within Phase 3, not the gate.

  **Both pages above must be written knowing server-backed retention is planned** — Phase 2
  item 6, tracker id 2.12 (added 29 October 2026 as 4.8, renumbered 30 October). The
  wording that survives that feature shipping is *nothing leaves your device unless you ask
  it to* — not *nothing can leave your device*, which is true today, becomes false the day
  2.12 ships, and sits on the one page written to be quoted verbatim by assistants and
  competitors. Item 5's device shelf, **shipped 30 October 2026**, needs stating here too
  for the opposite reason: it keeps files **and** keeps the claim, which is the distinction
  this page exists to make legible.
- **Browser extension.** Packages the existing tools as a Chrome/Edge popup — the same
  `runPdfJob` calls, no new tool code, no server cost. A discovery surface entirely
  outside Google's organic results, which matters given 2026's AI-Overview traffic
  declines; iLovePDF and Smallpdf both have one. Waits for the catalogue in Phase 2 to
  settle, so the extension's own tool list isn't rebuilt on every addition.

**Done when:** 100+ indexable URLs, each earning its place, all internally linked, plus
a working extension listing.

## Phase 4 — Monetisation and accounts

Deliberately after the tool set is settled: which tools are Pro is a pricing decision
that needs the full catalogue in front of it.

- **Re-tier the whole catalogue in one pass — started 30 October 2026, and the finding was
  not about tiers.** The Pro set is now six, not the three this line used to name: batch,
  redact and compare, plus the commercial-intent trio (extract tables, Bates numbering,
  PDF/A) shipped on 29 October. Adobe gates full OCR and we give it away — that stays, it
  is a conversion argument, and `tests/unit/proCopy.test.ts` now pins it.

  **What the pass actually found: the pricing page named 2 of the 6 tools it charges for.**
  Batch, extract tables, Bates numbering and PDF/A were all gated and all unmentioned, so
  the page understated what Pro buys — the mirror of the free-tier drift fixed the day
  before, and the more expensive direction, because a buyer cannot choose a plan on
  features it does not list. `comingToPro` was worse still: it promised batch processing
  (a shipped Pro tool) and an installable offline app (shipped in Phase 1, **free to
  everyone**) as future Pro perks. Both fixed, today's Pro custom retention length added,
  and `proCopy.test.ts` checks the copy against the registry rather than a second
  hand-written list — so a new Pro tool fails the suite until its copy exists, and
  advertising a free tool as Pro fails too.

  **Decided 30 October 2026: the Pro set stays at six. No tool changed tier.** The decision
  was to stop expanding, not to expand — the 28 October revenue review settled that usage
  limits convert at 5–15% against 1–4% for feature limits, and the six share a line worth
  putting in copy: commercial-intent tools (law firms, compliance teams, analysts,
  professional volume), not high-volume consumer ones.

  **Sign PDF was the one candidate**, and is deliberately free. It is the only tool a
  competitor gates (iLovePDF's Premium) that our own copy had not already promised free, so
  it was a genuine option. It stays free because signing a contract that never leaves the
  machine is the clearest single demonstration of this product, and gating the best demo
  costs more than it earns. Compress levels and OCR were never open: both are promised free
  in print in `src/content/compare/en/`.

  Recorded in `docs/design.md` §13 and pinned by `tests/unit/proCopy.test.ts`, so a later
  re-tier is a deliberate edit to that list rather than a silent drift. **This item closed
  with no tier changes**, which took it off the blocking path: four blockers remain and the
  blocking engineering is down to one day — 6.4's accessibility audit.

  **The price, however, is reopened — 30 October 2026, by the second competitive review.**
  The tiering above stands; the *number* does not. $59/year is the cheapest professional PDF
  product the review could find anywhere: Nitro $180, Adobe $180–300, Foxit $130–160,
  pdfFiller $96–180, Xodo $108, PDFelement $80–90, LightPDF $60, UPDF $50 — and SealedPDF at
  **$468/year** for 13 client-side tools sold to the same solo-attorney buyer our Pro six
  were chosen for. Eight vendors price above us; nothing prices below except free.

  **Settled by the owner 30 October 2026.** Four paid tiers, priced per category against
  the cheapest credible rival in each (`docs/design.md` §13 holds the table and reasoning):

  | Tier | Price | Category | Undercuts |
  | --- | --- | --- | --- |
  | Pro | **$24/yr** or **$4/mo** | 2 — prosumer online | iLovePDF ~$35–48 |
  | Pro, 10 years | **$120 once** | 2 | $1/month equivalent |
  | Practice | **$249/yr** | 4 — legal and compliance | SealedPDF $468 |
  | Business | **$499/yr**, target $750 | 5 — self-hosted | Stirling-PDF $1,188 team |

  Three consequences worth stating, because each changes something already built:

  1. **Pro drops from $59 to $24** — price leadership is affordable in category 2 precisely
     because marginal cost is zero, and that category converts free traffic rather than
     generating revenue.
  2. **The six professional tools move from Pro to Practice.** Which tools are gated is
     unchanged from the 4.1 decision above; they are gated one tier higher. At $24 a Pro
     containing redaction and Bates would leave Practice with nothing to sell, and those
     six are the only tools with externally demonstrated willingness to pay.
  3. **This needed a third tier in the code. Shipped 30 October 2026 as item 4.9**, and it
     reached four places the estimate above did not name: the `plan` column's CHECK
     constraint (`migrations/0004_practice_plan.sql`, a table rebuild — SQLite cannot alter
     a CHECK in place), `src/lib/planCache.ts`'s plan union and its `isPaidPlan` allow-list,
     the dashboard card that offered batch to every paying plan when batch had just become
     a Practice tool, and `CheckoutButton`'s own copy of the plan-key union, which had
     already drifted. `docs/design.md` §12 holds what the tier change means in the code.

  `terms.md` §5's early-access promise governs how any of this is announced, which is why
  the decision belongs before launch rather than after.
- **End early access, and actually sell the plans — item 4.12, added 31 October 2026.**
  This had no item at all until someone asked why the pricing page says "Coming soon", which
  is the answer: `paidPlansAvailable = false` in `src/lib/pricing.ts`. It belongs in Phase 4
  because it is the monetisation switch rather than a feature, and it is a **blocker** rather
  than additive for one reason — launching with every paid tier reading "Coming soon" is
  launching with no revenue, so it gates the launch the way the policy pages do.

  It is not a one-line flip, which is why it carries a day rather than an hour:

  - The flag also drives `proToolsGated`, so the same change **stops the six Practice tools
    being free**. That coupling is deliberate (`src/lib/pricing.ts` explains why locking a
    tool with no way to buy it would strand its users), but it makes the switch a pricing
    event rather than a deployment detail.
  - It makes about **eight early-access strings wrong at once**: `pricing.ts`'s `earlyAccess`,
    the two tier notes in `common.ts`, the Redact and Compare FAQs, `terms.md` §5,
    `about.md`, `help.md` and both comparison tables. None of them interpolate the flag, and
    that is the `statedClaims` failure mode again — so this item should also leave behind a
    guard that fails if the flag is on while any page still promises free access.
  - It needs the **four** real Dodo product ids from 6.1, including
    `DODO_PRODUCT_PRACTICE_YEARLY`, and `DODO_MODE` switched to live.
  - `terms.md` §5 promises the announcement comes **before** the change, so the order is
    announce, wait, then flip.
- Teams and seats (iLovePDF sells 1–25; Smallpdf has team accounts).
- **Business edition pitch, rewritten 28 October 2026.** "The procurement-friendly
  answer to AGPL-licensed alternatives" doesn't land: Stirling-PDF, the actual
  competitor here, is open-core and MIT-rooted, not AGPL, with ~95k GitHub stars, 50+
  tools and its own Enterprise tier, self-hosted on a $4–7/month VPS. The licence
  argument isn't the gap. Re-pitch Business on **nothing to deploy and nothing to
  breach** — browser-side processing even on a self-hosted instance, zero
  infrastructure to run, a real answer for air-gapped networks via
  `PUBLIC_USAGE_LIMITS=off`.

  A $750/year buyer runs a security questionnaire covering four things: a DPA, SSO,
  PO/net-30 invoicing, and a SOC 2 / ISO 27001 certificate. **Decided 28 October 2026:
  build whichever of these has no real external constraint, now, rather than treat the
  whole list as one blocker.**

  - **DPA** — a legal document, reviewed once. Unusually easy for us specifically:
    we hold no file content and almost no personal data (an email, a hashed IP, a
    session secret), so the agreement is short by construction. Scope as a Phase 4
    legal deliverable in `docs/legal-checklist.md`, not an engineering one.
  - **SSO (SAML/OIDC)** — an engineering feature on infrastructure that already exists.
    We have three auth methods (magic link, password, Google); adding SAML/OIDC for
    Business accounts is incremental on `src/lib/server/session.ts` and the auth
    functions, not new architecture. A Phase 4 build item.
  - **PO / net-30 invoicing** — both Dodo and Paddle support invoicing; this is
    configuration and an invoice-generation flow against the dual-provider billing work
    above, not a blocker on either provider.
  - **SOC 2 Type II / ISO 27001 — the one genuine constraint**, and it is a *time and
    cost* constraint, not a technical one: typically 6–12 months of evidence collection
    plus an accredited auditor's fee (commonly $10k–50k+ for a first SOC 2, recurring
    annually). No amount of engineering shortens an external audit. **Worth stating as
    a selling point once pursued, not just a cost**: because we hold almost no data,
    our audit scope is small compared to a typical SaaS storing files and signatures —
    this should make certification cheaper and faster for us than the industry norm.
    Deferred to Phase 6 on its own timeline (see below), not a precondition for
    selling Business.

  **Price, decided 28 October 2026**, anchored against each competitor's own pricing
  page rather than guessed: Stirling-PDF's self-hosted tier is **free for unlimited
  users** (the thing we cannot underprice), its hosted Team tier is $99/mo = $1,188/yr
  for 100 seats with SSO, and its Enterprise tier is custom; pdfFiller's Enterprise
  plans run $8–15/user/month with 10–20 seat minimums, i.e. **$1,800–1,920/yr minimum**.
  $750/yr flat and unlimited-seat already undercuts both paid comparisons — the
  competitive problem was never the number, it was charging full price ahead of the
  procurement features above. So: **$499/year flat during early access** — raised from
  $299 on 30 October 2026, because the new Practice tier at $249 left only $50 between an
  individual professional and a self-hosted organisation, which does not reflect what
  Business delivers — stepping up to **$750/year** once SSO, the DPA and invoicing all ship.
  Both live in `src/lib/pricing.ts` as `businessYearly` and `businessYearlyTarget`, and
  **the code holds $499 since item 4.9 shipped on 30 October 2026** —
  announced on the site first, same as the Pro early-access promise in terms.md §5.
  `business.md` states both figures and the condition for the change. Positioning
  stays on **zero infrastructure**, since that is the one edge Stirling's free tier's
  price tag cannot show: self-hosting it is still a Docker container someone has to
  deploy, patch and keep alive.
- **Merchant of record — decided 28 October 2026: dual-provider, routed by region.**
  Dodo for India, Paddle for everywhere else (US, UK, EU and the rest of the world).
  Checked against each provider's own documentation, not marketing claims: Paddle
  confirms iDEAL and Pix (Pix one-time only, no subscriptions) and charges a flat
  5% + 50¢ with no stacking; Dodo confirms UPI at a cheaper India-domestic rate
  (4% + 15¢) but does not confirm Pix or iDEAL support, and its 4% + 40¢ base rate stacks
  a +1.5% international and +0.5% subscription surcharge — for a globally-distributed
  subscription product like ours, that converges toward or past Paddle's flat rate. Ten
  years of Paddle's operating history against Dodo's 2023–24 founding also weighed in,
  for a relationship this central to revenue.

  The owner weighed the alternative — Paddle only, for one webhook and one legal
  relationship — against India's better domestic economics, and chose the split
  deliberately, accepting the cost that comes with it: **two webhook integrations
  instead of one**, **both providers named in `privacy.md` and `terms.md`** (doubling
  that review surface in `docs/legal-checklist.md` §2), and **checkout needs
  region-routing logic that does not exist today** — `functions/api/billing/checkout.ts`
  and `webhook.ts` are currently shaped around Dodo alone and need a second
  implementation plus a router, not a swapped env var. Scope this as its own Phase 4
  engineering item rather than folding it into the general billing work. Regional/PPP
  price points themselves (what to actually charge in INR vs USD) are a separate,
  still-open decision — this entry settles *which provider*, not *what to charge*.
- **Free-tier cap, repositioned rather than removed — confirmed by the owner.** Published
  freemium benchmarks say usage limits convert better than feature limits (5–15% for
  narrowly-gated product-led tiers against 1–4% for broad freemium), so dropping the cap
  to match ihatepdf.cv's "no limits" claim would have cost real revenue, not earned
  goodwill. `ANONYMOUS_DAILY_JOBS` raised **5 → 20** and `FREE_ACCOUNT_DAILY_JOBS` raised
  **30 → 60** in `src/lib/server/usage.ts`, so the cap stops gating the casual visitor who
  was never going to pay, while an account still buys roughly 3x the headroom. See
  `docs/TODO.md` §5.
- Saved workflows on top of `batch` (the `ux-lab.html` panel we deliberately left
  unbuilt rather than faking).
- A simple API, Business edition only. It runs on the customer's own server, so this is
  not an exception to "nothing server-side per job" — it is their server. The
  differentiation to lead with is the one in the rewritten Business line above —
  nothing to deploy — not licence cleanliness, since Stirling-PDF already ships a
  Swagger-documented API of its own and is not AGPL.
- ~~**Zero-knowledge share links**~~ — **moved 30 October 2026 to Phase 2 item 6 (tracker
  id 2.12); id 4.8 is retired and not reused.** The owner put server retention next to the
  device retention it extends, so the two halves of one mechanism are one item instead of
  two descriptions in different phases. Nothing about the scope, the cost or the
  after-launch ordering changed — it all moved with it. Recorded rather than deleted
  because an item that silently vanishes reads as one that was forgotten.

## Phase 5 — Locales

Last of the build phases because every locale multiplies whatever copy exists: translating
before Phase 3 settles means paying for the same sentence twice. The infrastructure is
already there — `astro.config.mjs` i18n, per-locale message folders, hreflang emitted.

Competitors run 24–30 languages against our 1.

**Revised 6 November 2026 (owner): 20 languages, machine-translated, auto-detected.** This
reverses the "two locales, real translation" scoping below. The reasoning that survives:
locale count is purely additive, and a locale that ranks costs nothing to serve. The
reasoning that does not: a person can QA two languages and cannot QA twenty, so the safeguard
moves from *who translates* to *what gets reviewed and how the page says so*.

**Narrowed 7 November 2026 (owner): top ten only, "for now".** The first ten in
`src/i18n/locales.mjs` are published (en, hi, bn, pt-BR, id, ru, de, es, fr, tr); vi, it, ja,
pl, ko, ar, th, nl, fil and zh-CN stay routed as English under `noindex` (item 5.6). The
per-page "translated automatically" note was dropped; the statement now lives once in the
Claims page, "Honest limits". The banner's sentences are fetched from `/lang-offers.json`
rather than embedded in every page, which would otherwise grow the HTML with each language.

- **Languages:** en, hi, bn, pt-BR, id, ru, de (backed by Semrush country data for iLovePDF
  and Smallpdf, September 2026) plus es, fr, tr, vi, it, ja, pl, ko, ar, th, nl, fil, zh-CN
  (inferred from online population; **not measured**). Bengali's data point looks suspect:
  24–35% of visits at 99.7% desktop. Replace the inferred half with our own Cloudflare
  country analytics after launch (`src/i18n/locales.mjs` holds the list and each status).
- **Per-locale pages, not runtime translation.** A translating widget or API would break
  `connect-src 'self'` and the `/verify` claim, and a page translated after load is not what a
  search engine indexed. Each locale is a static page at `/<code>/…`.
- **Auto-detect without redirecting.** A first-visit banner offers the visitor's browser
  language, in that language; it never forces a redirect (confusing for search engines and
  for people who prefer English).
- **A locale is indexed only once translated.** Until then its URLs serve English and are
  `noindex`, absent from hreflang and the sitemap, so the empty locales cannot publish
  thousands of thin duplicate pages (1,615 when all 19 were empty).
- **Machine-translated pages say so** (`status: 'machine'` shows a note), until a person has
  reviewed the trust claims, pricing and error strings (5.7).
- **Unchanged:** legal pages stay English and govern; guides stay English-only; the service
  worker precaches English only (20 copies would make a first visit download 1,700 pages).
- **Not decided:** OCR language data per locale (multi-megabyte each; a size-budget call),
  and the Chrome on-device Translator fallback for pages left in English.

**Scoped 28 October 2026 (cost pass)**, ahead of Phase 3 rather than after it, because
this phase is the multiplier that decides what the whole plan costs. Three decisions:

- **What gets translated: the UI and the tool and landing pages — not the guide library.**
  Everything a visitor touches, and every page that ranks for a head term (`unir pdf`,
  `pdf zusammenfügen`), is translated. The long-form guides stay English-only at launch,
  because search value per page is nowhere near uniform across locales: the head terms are
  large in every language, while the long-tail queries behind them are a fraction of their
  English equivalents — and a guide is the most expensive page we produce. Per-locale
  guides get added afterwards, one at a time, where the data earns them. **This is what
  unblocks Phase 3**: its page count can grow freely, because the multiplier now applies
  to a bounded subset instead of to everything written.
- **Legal pages stay in English, with the English version governing**, as is standard.
  Translating `privacy.md` and `terms.md` would create a second text needing its own legal
  review in each language — `docs/legal-checklist.md` tracks the review surface, and this
  keeps it from multiplying.
- **Two locales at launch, not eight: `es` and `de`.** Spanish for reach; German because
  it is the market that pays for privacy tooling and reads an enforced CSP as a feature
  rather than a detail. "Real translation, not machine output" is unchanged and is
  precisely why the count is small — eight languages of genuine translation is both a real
  bill and a review burden the owner cannot personally QA, and machine-translated prose
  undermines a product whose entire pitch is that its claims can be checked. Locale count
  is also the one item on this plan that is **purely additive after launch** — no
  retrofit, unlike schema, tool architecture or page copy — which makes it the safest
  place to be conservative first and generous later. Remaining order, as evidence
  justifies each: pt-BR, fr, id, hi, ja, it.

Because every job runs on the visitor's own machine, a locale that ranks costs us nothing
to serve — which is the argument for going deep on a few locales rather than shallow on
many.

## Phase 6 — Launch

Everything that only matters when strangers arrive, which is why it waits until they are
about to. All of `docs/TODO.md` lands here.

- Google OAuth credentials; real Dodo products, webhook and live mode; ~~Resend key and
  `EMAIL_FROM`~~ — done 4 Nov; production secrets.
- ~~`wrangler d1 create`, paste the id, apply migrations remotely.~~ — done 3 Nov
  (`docs/TODO.md` §4).
- ~~Confirm `FREE_ACCOUNT_DAILY_JOBS` / `ANONYMOUS_DAILY_JOBS`~~ — done, Phase 4 above.
- **SOC 2 Type II or ISO 27001 pursuit**, moved here from Phase 4 on 28 October 2026
  because it is the one Business-edition procurement item that is a genuine time/cost
  constraint rather than something we can simply build. Budget 6–12 months plus an
  accredited auditor's fee; our small data footprint (no files, almost no personal
  data) should keep the audit scope — and so the cost — below the industry norm, which
  is worth stating in Business edition copy once pursued.
- Legal review of `src/content/pages/en/`; clear `awaitingLegalReview`.
- **Accessibility audit — done 30 October 2026** (`docs/shipped.md`): shipped as
  `tests/e2e/accessibility.spec.ts`, 20 checks, WCAG A/AA clean across the ten page kinds
  the generators produce. It found one real failure — 1.4.10 Reflow, tables pushing the
  page sideways at 320px — now fixed. **With this closed the blocking engineering is zero;
  every remaining launch blocker waits on a person.** Two parts of this line are *not*
  done and are not blockers: the soak test of OCR and batch on a mid-range phone, and the
  screen-reader pass that axe cannot stand in for. The Phase 1 performance budget still
  passes.
- Once live: a thin native wrapper (Capacitor or Tauri) around the existing PWA, for
  iOS/Android app-store listings — not a rewrite, since `ScanTool.tsx`'s camera capture
  already makes the product feel native. App stores want a real support contact and a
  reviewed privacy policy before they'll list anything, which is exactly what this
  phase produces — a genuine dependency, not an arbitrary delay.

**Done when:** a stranger can arrive from a search result, use a tool offline, sign up,
pay, and never send us a file.

## Phase 7 — Bespoke enterprise, after traction

Added 30 October 2026. The second competitive review concluded that negotiated enterprise
deals cannot be served by one person — each is weeks of procurement admin, custom
agreements and per-prospect security review. `docs/design.md` §13 records the decision that
every paid tier stays zero-touch.

**This phase is deferred, not declined**, and the owner's instruction is to plan it now and
enter it after launch once traffic builds. So the entry conditions are written down rather
than left to judgement. **Take the first bespoke deal when all five hold:**

1. **Insurance in place** — cyber liability and errors & omissions. Signing indemnities
   without it is the single most dangerous move available to a one-person entity, and it is
   the item nobody had scoped before today.
2. **A pre-drafted MSA**, written once with the lawyer and reused, so the common deal needs
   no redlines. Redlining per deal is what makes enterprise unservable solo.
3. **SOC 2 or ISO 27001 underway or complete** (item 6.5). Large buyers will not proceed
   without it, so it gates the category regardless of everything else.
4. **Deal size above roughly $10,000/year**, so two weeks of procurement admin is
   economically rational rather than a loss.
5. **Either a second pair of hands, or revenue sufficient to buy lawyer-per-deal.**

Until then, large inbound interest gets the honest answer `business.md` already gives: a
list of what the Business edition does not include, and an invitation to say what they
need. That page's candour is an asset here, not a gap.

**The forfeit, stated so it stays visible:** the six-figure contracts in this market belong
to Adobe, Nitro and Foxit, and we are choosing not to chase them yet. That is real revenue
declined, recorded the same way the impossibility of ads is recorded below.

---

## The cost advantage, which is structural

iLovePDF processes 16M+ documents a day on servers it pays for. Every job we run costs us
nothing: the visitor's own CPU does the work and Cloudflare Pages serves static files.
Our hosting bill is flat while theirs scales with success.

Two rules protect that, and every phase above is bound by them: **nothing server-side
per job**, and **no third-party runtime dependency** (which is also why we can never run
ads — and why their Premium tier sells "ad-free" while we have nothing to remove).

## Why this order

The dependency chain runs **infrastructure → tools → copy → translation → launch**, and
each arrow is a rework boundary: schema retrofitted across 100 pages, a landing page for
a tool that changed, a paragraph translated into every language before it was final.
Phase 1 is first because it is inherited; Phase 5 is late because it is multiplied;
Phase 6 is last because it is the only phase with an audience.

The **cost** chain runs the other way: translation multiplies copy, and copy describes
tools. That is why the cost pass above pulls two things forward against the dependency
order — the locale *scope* decision, which sets how much Phase 3's page count actually
costs, and each tool's checkable facts, which are nearly free in the commit that builds
the tool and expensive in any later one. Everything else stays where the dependency chain
puts it. Work the dependency order forwards and the cost order backwards, and the two
meet at Phase 3.
