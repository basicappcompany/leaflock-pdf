# How a feature gets built here

Written 28 October 2026, after shipping ten tools in one sitting. Every rule below exists
because *not* having it cost a rebuild, a rewrite, or a debugging cycle that day. Read this
before adding a tool; it is short on purpose.

## 1. Where does a new dependency go?

| The library… | Runs | Imported |
| --- | --- | --- |
| **writes** a PDF (needs pdf-lib) | worker op, `src/lib/pdf/ops/` | statically — pdf-lib is already in that chunk |
| **reads** a PDF (needs pdf.js) | main thread, via `src/lib/pdfjs.ts` | as it already is |
| reads or writes **anything else** (docx, xlsx, …) | main thread, `src/lib/convert/` | **`await import()`**, always |

Three facts make that table non-negotiable, each learned by breaking something:

1. The job worker is a **separate Vite build with its own plugin list**. A plugin added to
   `vite.plugins` never sees it.
2. That build is **`iife`, which cannot code-split** — a dynamic import *inside* the worker
   gets inlined, so a 280KB library lands in the chunk every tool fetches. This is why
   `docx` and `write-excel-file` live on the main thread, not in an op.
3. `vite.worker.plugins` **replaces** that pipeline rather than extending it. Setting it
   cost the worker its dependency-interop plugins and broke every job with
   `invalid zlib data`. Reach the worker with `resolve.alias`, which worker builds inherit.

A new chunk over 250KB raw needs a named exception in `performance.spec.ts`, matched by a
**string unique to the library** (`convertToHtml`, `GlobalWorkerOptions`), never a chunk
filename — Vite rehashes those on unrelated bumps.

## 2. Probe the platform before designing against it

Every expensive rewrite this session came from assuming a library's behaviour instead of
checking it. A probe is a ~30-line throwaway script; a wrong assumption is a day.

**Probe the success path, not just the failure path.** The single worst rewrite — all of
`links.ts` — happened because the probe asked "does a link dangle when its target is
dropped?" and never asked "does a link still resolve when its target is *kept*?" The
answer to the second was no, which invalidated the whole design.

Probing is also what *prevented* the session's worst bugs: `embedPage` ignoring `/Rotate`,
`embedPage` throwing on a page with no `/Contents`, `copyPages` never copying `/AcroForm`,
`hasEOL` not marking paragraphs. Keep doing it. Just ask both questions.

**Measuring a chunk takes a real build.** A throwaway page under `src/pages/`, not
`_underscore-prefixed` (Astro ignores those), with a *side-effecting* import (a bare
`void lib` is tree-shaken away), then `pnpm build` and read `dist/_astro`.

## 3. Verification order: cheapest decisive signal first

Unit tests run in Node and will happily pass on code that cannot run in a browser.
`Packer.toBuffer()` passed every unit test and threw `nodebuffer is not supported` in
Chromium; the font-stub change passed 288 unit tests, produced a smaller chunk, and broke
15 browser tests.

So, for anything touching **build config, a platform API, or a new dependency**: get one
browser test green *before* writing the other eight unit tests. For pure logic
(inference, layout maths, parsing), unit tests first — they are the fastest signal there.

Run the tool's own spec while building. Run `site.spec.ts` / `seo.spec.ts` /
`performance.spec.ts` once per batch, not once per tool — they are ~3 minutes each.

**A big browser batch flakes, and that is not a regression.** Every batch of ~40+ browser
tests on a loaded laptop produced exactly one failure in a spec the change never touched:
`convert.spec.ts`'s raster tests (`JPG to PDF`, `PDF to JPG`, `PDF to text` — canvas work,
60s timeouts), `merge.spec.ts`'s budget, and `/guides/*`'s LCP ceiling (1536ms against
1500ms). All passed in isolation, four times out of four in one session. So: re-run that
spec alone **once**; if it passes, it was load, and it is reported as flake, not
investigated as a finding. Don't re-run the whole batch, and don't debug a tool the change
never touched. Batches under ~40 tests mostly avoid it.

## 4. Test the invariant, not the arithmetic

Hand-computed expected values were wrong about as often as the code was: a square scaling
up to fill its cell, a whitespace-only span, a word gap wide enough to read as a column.
Where geometry is involved, assert the *property* — "all four rotations land in the same
place", "every page is used exactly once" — and let the numbers fall out.

## 5. Batch by mechanism; the second tool is nearly free

The strongest cost signal in the data: the first tool of a kind is expensive, the next ones
are not.

| First (expensive) | Then (cheap) |
| --- | --- |
| N-up — new `embedPage` pipeline, rotation and blank-page bugs | Booklet — same engine, different page order |
| PDF → Word — new dep, architecture question, font spike | PDF → Excel — reused `pageTextRuns`, `lines.ts`, same chunk pattern |
| Remove metadata — new object-layer work | Edit metadata, Remove annotations — first-time pass, no rework |

Group work by the machinery it shares, not by the category it appears under in the
roadmap. Ordering Phase 2 by search volume would have split every one of those pairs.

## 6. Don't write code for a future caller

Deleted again the same day it was written: an `align` parameter with one caller, unused
`rgb`/`PDFPage` imports "for the next feature", indentation tracking nothing read, and a
dependency (`read-excel-file`) installed for a leg of the work that hadn't started.
Install the dependency when the code that imports it exists.

## 7. Ship notes go in `docs/shipped.md`, ten lines each

This rule was written as "ten lines" and then broken immediately: the roadmap went
394 → 764 → **926** lines, and one PDF/A entry alone ran 55. An aspiration in the same file
that is growing does not hold, so the shape is now structural — ship notes have their own
file, and `docs/roadmap.md` marks an item done in **one line** that points at it.

A note carries exactly two things worth a future session's attention:

- the **non-obvious finding** it would otherwise re-derive;
- the **stated limit** that went on the tool page.

Mechanism goes in `docs/design.md`, next to the code. Entries written before 29 October
2026 stay in the roadmap where they are: rewriting them would be exactly the rework this
rule exists to prevent.

**The same pass updates `docs/status.html`** — flip the item's `state` to `"done"` and add
`when: "<date>"`. That one line is the whole update: item counts, the done/blocking/
additive split, per-phase totals and every projected date are computed from the item data
at render time, so they follow automatically. A tracker updated three ships late is worse
than none, and this is the cheapest point at which it cannot fall behind.

So shipping something is four small writes, in this order: the code and its tests, ten
lines in `docs/shipped.md`, one line in `docs/roadmap.md`, one field in
`docs/status.html`.

## 8. Never store a number a command can print

`pnpm counts` prints tools, tiers, worker operations, unit tests, browser tests, guides and
landings; `pnpm build` prints the page count. Nothing else should hold those figures.

They used to live in ~21 places — a comparison table, a prose summary, and a trailing
"N unit tests, M browser tests" on every ship note. Writing the script found **three** that
had drifted, two of them typed the same day: worker ops recorded as 28 against a real 29,
landings as 5 in one place and 6 in another, browser tests as 228 against a real 240
(because several specs generate cases in a loop, so counting `test(` declarations
undercounts by half). Every one of those corrections was rework that produced nothing.

The single exception: the competitor comparison table in `docs/roadmap.md`, where our own
count only means something sitting next to someone else's.

**That exception cost something, and is now narrowed — 29 October 2026.** The table's
"Free-tier cap" row still read `5/day anon, 30/day account` a day after the constants were
raised to **20** and **60**, and the same stale numbers turned out to be live on the
**pricing page, the help page, the sign-up note, the account panel and both comparison
pages** — six user-facing strings advertising a third of the allowance the server actually
grants, on the one axis where a more generous free tier is the competitive argument.
`docs/TODO.md` §5 had recorded that "no other file needed a change" because the meter
interpolates `{used}`/`{limit}`; that was true of the meter and false of the site, and
nothing could see the difference, because prose is invisible to a type checker.

Two things follow, and both are now in place:

- The exception covers the **competitor** columns, which no command of ours can print. Our
  own figures in that table are ours to keep true like any other.
- **Anything the product states about itself in prose gets a test.**
  `tests/unit/statedLimits.test.ts` reads every file under `src/content` and `src/i18n`,
  finds each phrase that states a daily allowance, and fails with file and line if the
  number disagrees with `src/lib/server/usage.ts`. Interpolation alone would not have
  caught this: two of the six were Markdown, which has no placeholders to interpolate.
- **It happened again with prices, which is why the pattern is worth copying rather than
  admiring.** Item 4.9 reset every price on 30 October 2026, and the numbers were spelled
  out in the help page's price list, the Business page's price section *and* its frontmatter
  description. `tests/unit/statedPrices.test.ts` is the same shape against
  `src/lib/pricing.ts`, and it caught the frontmatter copy immediately — the one a human
  pass had already missed, because it sits above the section that was being corrected. Two
  instances make the rule concrete: when a constant is a claim, the claim gets the test.
- **Then it happened to a claim with no constant behind it at all**, which is the worst of
  the three. Item 3.5 found `security.md` promising "No cookies" and "No account" months
  after auth shipped, and saying files were stored neither on the device nor on our servers
  after the recent-work shelf began storing them on the device. A stale *number* at least
  has something that recomputes it; a stale *claim* has nothing, and it sits on the pages a
  buyer reads hardest. `tests/unit/statedClaims.test.ts` bans the phrasings that expire —
  including ones that are true today and would be falsified by 2.12 — and couples the
  cookie name to `SESSION_COOKIE_NAME`. **When a feature ships, grep the trust pages for
  what it just made untrue.**

The figures in `docs/status.html` that the page cannot derive from its own item data were
the other hand-kept numbers, and are not any more. `pnpm counts` owns one **`COUNTS`
block** in that page and rewrites it whole; everything on the page — the tiles, the
Phase 3 item names, the free-tier line — reads from that block. Adding a metric is a field
in the script's `figures` object plus a reference in the page. **Never type a figure into
that page**: by definition it is a copy, and the free-tier line is what a typed copy looks
like three days later.

Two standing instructions from the owner, 29 October 2026 — *"revise whenever we revise in
code"* and *"status should be added whenever something requires a change or added metric is
required"*:

- **A code change that moves a number finishes in the same pass as the surfaces that state
  it.** Not "later": the allowance change took one line in `usage.ts` and left six strings
  wrong, and the only reason it cost nothing is that the site was never deployed. Changing
  a constant means asking what quotes it — run `pnpm counts`, `pnpm tracker` and `pnpm
  test`, and grep the shipped prose for the old value.
- **A metric worth asking about belongs on the tracker, derived.** If a question comes up
  twice — how many pages are left, what the cap is, how many tools ship — it becomes a
  figure on `docs/status.html` computed from item data or written into `COUNTS`, never a
  sentence someone has to re-verify. A figure that cannot be derived does not go on that
  page at all; it goes where it can be checked.

What the derivation keeps catching, so it is not theoretical: the free-tier line advertised
a third of the real cap; Phase 4 showed "Pending" with a done item in it; the "items from
market-leading" sentence said 21 while the tile said 20; and Phase 3's page count was typed
as ~74 against 40 tools, so "one guide per tool" was three short the day the catalogue
reached 43.

**A date is one of those numbers — 30 October 2026.** `PLAN.today` in `docs/status.html`
was stored as `"2026-10-29"`, four lines under a comment promising that "nothing can go
stale on its own", and by the 30th every projected date on the page was a day optimistic.
It now reads the clock, and `scripts/tracker-check.mjs` computes the same local-midnight
date so the two models still agree. Two things this one teaches that a tool count does not:

- **Two skins of the status page, one source of data.** `docs/status2.html` is the design
  before the 1 November reskin, kept to compare against. Both are deliberately single files
  that open with no tooling, so the data cannot be factored into a shared module without
  giving that up — instead `pnpm counts` mirrors the canonical page's whole `<script>` block
  into the other, and `pnpm tracker` fails if they have drifted. This is not belt and
  braces: they drifted within minutes of the copy being taken, one `pnpm counts` run leaving
  status.html saying 7 commits and status2.html saying 6. A second tracker that quietly
  disagrees with the first is worse than having only one. **Edit the data in
  `docs/status.html` only**, then run `pnpm counts`.
- **"Today" is the only figure that goes stale with no edit at all**, so it is the last
  thing that should ever be typed. The pin survived three sessions of pressing the rule on
  every other number on that page.
- **A derived date that recedes is not a broken projection.** While every blocker was pure
  lead time — true from 31 October, when 6.2 closed, until 4.12 was added hours later — an
  unstarted blocker really did cost a day per day. It is worth knowing which of the two
  situations the board is in before reading a receding date as either fine or alarming. The fixed counterpart is the 29 October baseline table in
  `docs/roadmap.md`, deliberately frozen; the growing gap between the two *is* the
  measurement, and it only works if exactly one of them moves.

## 9. Adding or removing a tracked item

Standing instruction from the owner, 29 October 2026: *"if I ever say to remove or add item,
act accordingly — there shouldn't be any confusion."* An item is the unit the owner points
at (`start 4.3`), so the cost of a half-done add is not a wrong estimate; it is an
ambiguous address. The full set, in order:

1. **`docs/roadmap.md`** — the item in its phase, carrying *why it sits in that phase*.
   Placement here is the dependency argument, not a category guess: anything that ships UI
   strings has to precede Phase 3's copy and Phase 5's translation, or the copy gets written
   twice and the second one is multiplied by every locale.
2. **`docs/status.html`** — a row in `PHASES`. The id is `<phase>.<n>`, **allocated next in
   that phase and never reused**, because ids are written into the data precisely so an
   insert cannot renumber the rows below it. A removed item's id stays retired.
3. **One disposition per open item**: `blocker: true`, or `after: "<why it waits>"`, or
   `afterLaunch: true`. This is what keeps the launch date honest — scope added after the
   baseline shows up as scope, not as slippage.
4. **`pnpm tracker`** — validates the ids, dispositions, phase states and per-item
   estimates, then prints every computed figure. It found a phase marked "pending" with a
   done item on its first run.
5. **Any prose that quotes one of those figures** — the roadmap's baseline section is the
   usual one. Copy the numbers from step 4's output; do not work them out by hand.
6. **`docs/design.md` §13 if it reverses a recorded decision**, dated, with the reasoning —
   and say what the reversal does *not* cover, since that is the part a later session gets
   wrong.
7. **`docs/legal-checklist.md` if it has a legal surface**, marked as its own pass if it
   lands after the launch review, so it does not inflate the blocker.
8. **`docs/TODO.md` only once the code is written** and just the real value is missing —
   that file's own preamble is the contract, and an entry for unbuilt work breaks it.

Steps 1–4 are the whole job for an ordinary add. A removal is the same list, plus one line
in the roadmap saying **why it was dropped**: an item that silently disappears reads as an
item that was forgotten.
