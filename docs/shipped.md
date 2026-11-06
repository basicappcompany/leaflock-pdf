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

## 7 November 2026 — Top-10 languages published, machine-translated (item 5.8)

Hindi, Bengali, Brazilian Portuguese, Indonesian, Russian, French and Turkish, 1,922 strings
each, translated in-session by seven parallel translators and loaded with `--import`. Zero
validation failures; the unit suite (558) passes and the build still makes 2,067 files.
"Top 10" is the first ten in the registry, English included; the other ten stay routed as
English under `noindex`, deferred by the owner "for now".

- **Terms for a native reader to check first.** *redact*: hi रिडैक्ट, bn রিড্যাক্ট (transliterated),
  pt-BR tarjar, fr caviarder, ru "Удаление данных (redaction)", tr karartma, id "Redaksi" (also
  means editorial office). *flatten*: hi/bn transliterated, fr aplatir, ru сведение, id ratakan.
  Also: the Russian count phrasings ("Файлов: {count}") avoid plural forms by design; Hindi uses
  the dual "सकता/सकती"; Turkish file-name suffixes are ASCII; "White-out" is a coinage in bn.
- **One test changed.** `statedPrices` now allows 0, because pt-BR writes the Free plan as
  "US$0" (English writes a bare "$0", which no pattern matched).
- **The vitest glob-cache caveat bit again** with seven new folders; touching `i18n/index.ts` fixed it.
- **Stated limit:** indexed pages 237 → 790 (79 × 10). Files unchanged at 2,067 of 20,000 because
  every locale already built as English copies.

---

## 6 November 2026 — Spanish and German published, machine-translated (items 5.1, 5.2)

1,922 strings per locale, translated in-session by four parallel translators and loaded with
`node scripts/translate.mjs --locale <code> --import <file>`, which applies the same checks as
the API path: every `{placeholder}`, number, URL and tag must survive. Zero failures in either.

- **A translator will translate things that are not prose.** File-name suffixes (`-smaller`,
  `no-comments`) and example file names came back localized. That is fine here — they live in the
  i18n strings on purpose and the Spanish ones are ASCII — but it is the first thing to read
  in a new locale, and `{percent} %` vs `{percent}%` spacing was normalized by hand.
- **Unreviewed by a person.** Neither says so on the page: the per-page note was removed on 7 Nov 2026 (owner decision), and the statement now lives once in the Claims page, "Honest limits". Glossary choices
  to check: *redact* (redactar / schwärzen), *flatten* (aplanar / verflachen), "Letter" paper
  size, and "Redaction" as a plan-feature noun (Redactar reads as a verb in es).
- **The direct API path of the script has never succeeded.** The key in the environment was
  rejected with 401 on every batch; nothing was written or billed. Only `--import` is proven.
- **CI caught two things local unit tests could not.** (1) Building the locale table at import time
  stopped the bundler dropping it from the ~70 client components that import `format`/`plural`
  from `i18n`: JS + CSS hit 724 KB against a 380 KB budget with two locales. It is now built in a
  `/*#__PURE__*/` function; client chunks are back at baseline with no catalogue text in them.
  (2) `aria-label` on the switcher's `<summary>` failed axe (serious) on every page; it is now
  visually hidden text. Both are guarded by the existing performance and accessibility specs.
- **Stated limit:** pages 85 → 237 indexed (79 × 3). The other 17 locales still serve English
  under `noindex`. Browser-checked: the suggestion banner shows for es/de visitors only, never
  on a page already in their language, never for a language with no translation.

---

## 6 November 2026 — Locale infrastructure for 20 languages (item 5.3)

Routing, registry, switcher, first-visit suggestion, noindex rules and right-to-left support.
No translations yet; English is the only locale with content.

- **Astro's `fallback` + `fallbackType: 'rewrite'` builds every page per locale with no
  duplicated page files.** Each page gets its own `lang`, `dir` and `/<code>/` canonical, and
  `getMessages()` deep-merges a locale over English, so a half-translated locale never breaks.
  `fallback` keys must be URL **paths** (`pt-br`), not codes (`pt-BR`), or `astro check` fails.
- **An empty locale must not be indexed.** The fallback serves English under `/th/…` with a
  self-canonical; left alone that is 1,615 thin duplicates. `isTranslated()` drives `noindex`,
  hreflang and the sitemap from one place.
- **The service worker would have precached 1,699 URLs, up from 84.** It now skips locale
  prefixes; navigations are cached on first visit, so a visitor's language still works offline.
- **Stated limit:** pages 85 → 1,700 and files 451 → 2,066, against Cloudflare Pages' 20,000.
  Build time 25s → 100s. The language list is half inferred, not measured (roadmap Phase 5).

---

## 6 November 2026 — Security review fixes, and the phone sidebar button

A read of the auth, session, Google, billing and account code (no credentials exposed; none
in the repo or its history, `pnpm audit --prod` clean). Three things fixed:

- **A paid upgrade could be lost for good.** `webhook.ts` recorded the delivery id *before*
  applying it, so a transient D1 failure made Dodo's retry look like a duplicate and the
  plan was never granted. Handling is now wrapped: on failure the id is un-recorded and the
  route answers 500, so the retry runs.
- **An unrecognised product granted Pro.** `planForProduct(...) ?? 'pro'` meant an unset or
  mistyped product id gave a Practice buyer Pro (`DODO_PRODUCT_PRACTICE_YEARLY` has had no
  real value, TODO §3). It now fails the delivery instead, and the retry succeeds once the
  configuration is fixed.
- **Password login leaked which emails have accounts by timing.** With no stored hash the
  check returned instantly, against ~210k PBKDF2 rounds otherwise. It now derives against a
  decoy, and a test asserts the amount of hashing is equal either way.

**The phone sidebar button** failed intermittently because the "tap outside closes" handler
exempted the reopen button with `event.target === button`; a tap on the arrow icon targets
the `<svg>` inside it, so the tap that opened the drawer shut it again. Now `contains()` on
`pointerdown`. Also: the open state is no longer saved on a phone (it reopened over every
next page), and the buttons are 44px/40px instead of 36px/26px.

**Stated limit:** known and *not* fixed — `set-password` needs no current password and keeps
other sessions alive; per-email rate limits can be used to lock a victim out for 15
minutes; magic links are consumed on GET so mail scanners can burn them; `rate_limits` is
never pruned and `/api/errors` is unthrottled. HSTS and the `pages.dev` host are dashboard
settings, in TODO §8.

---

## 3 November 2026 — A full-site proofread, and three more stale cookie/theme claims

Asked to check every page for grammar and vocabulary errors. Three parallel passes
(tool copy, content/legal pages, guides/comparisons) found the prose itself genuinely
clean — one real grammar error (a toggle's own label used as a sentence's subject with
no article, in `pdfToText.ts`'s FAQ) and one real spelling inconsistency: British
"colour"/"centred"/"organisation"/"licence" mixed with American spelling across eight
files, including one sentence in `terms.md` that said "licence" and "licenses" within
the same breath. Standardized on American, since it already had more UI strings.

**The more important find wasn't grammar at all.** `security.md`, `privacy.md` and
`cookies.md` each had a *second* place describing the site's cookies or theme default
that the earlier stale-claims sweep (same day) hadn't touched — one bullet fixed,
another one just like it two sections later, still claiming "exactly one cookie" or
"follows your system setting" in its own words. A targeted grep for one exact phrase
finds every copy of that phrase; it doesn't find a second place that says the same
wrong thing differently. Worth re-reading a page end to end after a factual fix, not
just re-grepping for the sentence already found.

---

## 3 November 2026 — Default theme is Light, not the system setting

Owner instruction: a first-time visitor should see Playful Rounded and Light,
regardless of OS preference — the skin was already right (no `data-skin` is already
Playful Rounded); the theme wasn't, since "nothing stored" fell through to
`color-scheme: light dark` and followed the OS.

**The finding worth keeping:** once "nothing stored" stops meaning "follow the OS",
"follow the OS" needs a different signal to mean anything at all — `ThemeToggle`'s
System option used an absent `localStorage` key specifically *because* that was already
the fallback behaviour. Redefining the fallback to Light without also giving System its
own stored value (`theme: 'system'`) would have silently broken the System option
instead of just changing the default — the same key can't mean two different things.

**Caught by a real syntax bug, not just logic:** the first attempt's inline comment
used backticks around `` `color-scheme: light dark` `` inside the JS source string that
the whole pre-paint script is itself built from (a template literal in `Base.astro`'s
frontmatter) — closing that outer string early and turning one real error into 13
unrelated-looking ones. `astro check` caught it before it shipped.

---

## 3 November 2026 — A condensing header, reported from a real phone

Owner reported the header eating too much of a phone's viewport, permanently, on every
page — found while checking the live `leaflockpdf.com` deployment on an actual device
rather than a desktop emulation. Shrinks to just the brand mark once scrolled past a
small threshold (`.site-chrome--condensed`), nav/skin-picker/theme-toggle collapsing
away; the privacy strip stays, on explicit instruction — "nothing is uploaded" is the
one line worth keeping visible the whole time someone's using a tool, not just at the
top of the page.

**The finding worth keeping:** the sidebar's `top` offset reads `--tools-chrome-h`,
set once before first paint for the *uncondensed* height. Condensing the header without
also re-measuring that variable would leave the sidebar holding open a gap sized for
chrome that's no longer there — same bug class as the scroll-gap fix from 2 November,
different trigger. The same scroll listener that toggles the condensed class now
re-measures and updates the variable in the same tick.

**A second, worse finding, caught by CI rather than review:** a single shared scroll
threshold made a real download-link click permanently fail with "element is not
stable" — `secure.spec.ts`'s protect/unlock round trip, bisected down to this exact
commit. `.site-chrome` is sticky but still occupies flow space, so condensing it
shifts everything below upward; Playwright's own scroll-into-view during `.click()`
landed exactly on the threshold, and each toggle's shift re-crossed it, flipping state
forever. Fixed with two thresholds far apart (condense at 64px, expand at 16px) instead
of one — a dead zone wide enough that one toggle's own layout shift can never cross
back over the other side. `pnpm exec wrangler pages deployment list` showing Cloudflare
built the broken version successfully was a reminder that a clean build proves nothing
about runtime behaviour a build step can't exercise.

---

## 3 November 2026 — The same stale claim was duplicated across six pages, not one

Asked to check for stale or placeholder values across the UI after the previous pass only
fixed `cookies.md` and `privacy.md`/`terms.md`. It wasn't enough: "signed out, the site
sets no cookies at all" and "taken by Dodo Payments" (singular) were copy-pasted into
`claims.md`, `security.md`, `help.md`, and three comparison pages
(`leaflock-vs-pdf24.md`, `leaflock-vs-pdffiller.md`, `leaflock-vs-sejda.md`) — none of
which were touched by the earlier fix because a targeted search for `[TO CONFIRM: …]`
brackets doesn't find a claim that's just plain wrong with no bracket marking it. All
eight now describe the real three-cookie, two-provider state consistently.

**The finding worth keeping:** a placeholder audit and a staleness audit are different
searches. The first finds unfilled blanks; the second finds confidently-stated claims
that used to be true. `claims.md` in particular exists specifically to be quoted
verbatim into security questionnaires — exactly the page where a stale claim does the
most damage, and exactly the one a bracket-search would never have caught.

**Left alone, deliberately:** `pricing.ts`'s checkout note still says "Dodo Payments"
only — unlike the policy pages, it describes what the code actually does right now
(Paddle isn't wired in yet), so leaving it unchanged was the accurate choice, not a
miss. It becomes stale, and needs fixing, only once Paddle integration lands.

---

## 3 November 2026 — A real open-source notices page, and a wrong cookie policy fixed

Asked to list every `[TO CONFIRM: …]` placeholder before launch, then to resolve what
didn't need the owner or a lawyer. Shipped `/licenses` (`src/content/pages/en/licenses.md`),
generated from the actual installed runtime dependencies rather than a remembered list —
13 MIT/BSD/Apache packages plus `libheif-js` (LGPL-3.0, already shipped as a separate,
replaceable file for exactly this reason — see design.md §10a's neighbour). Named
Cloudflare, Resend, and the already-decided Dodo+Paddle split directly in `privacy.md`
and `terms.md`: these were facts the code already assumed, not open decisions, so filling
them in wasn't a judgement call.

**The finding worth keeping:** `cookies.md` claimed "exactly one cookie" and was wrong,
not just incomplete — the skin picker's `leaflock_skin` cookie (shipped 2 November) and
the sign-in hint cookie `leaflock_signed_in` were never added to it, despite the page's
own promise to update before any cookie ships. A placeholder audit that only looks for
`[TO CONFIRM: …]` brackets misses this kind of drift entirely; it only surfaced from
actually reading the policy against `src/lib/server/session.ts` and `SkinPicker.astro`
side by side. Fixed, all three cookies now described accurately.

**Stated limit:** `terms.md` and `privacy.md` now promise Paddle handles non-India
purchases, but Paddle isn't wired into the code yet — only Dodo exists in `functions/`.
Not a problem today (paid plans aren't live), but it has to land before they are.

---

## 3 November 2026 — A scroll-reveal fade for content sections, after a live-site UX pass

Owner asked for a UX check against the live site and whether a fixed header and some
scroll motion would help it feel less static. The header was already `position: sticky`
site-wide (shipped 2 November fixing the scroll-gap bug) — confirmed still correct, kept
as-is. Added: a light fade-and-rise as `.tool-info` columns, FAQ items, and `.tool-grid`
cards enter view (`.tool-grid` covers the home page, every tool page's "Related tools",
and the category hubs — one selector, no per-page markup).

**The finding worth keeping:** a naive version of this (opacity: 0 by default, JS reveals
on intersect) risks exactly the two things CI already enforces — a flash of hidden
content before JS runs, and a possible LCP hit if the largest element starts invisible.
Fixed by only ever hiding elements the script can see are *already below the fold* at
the moment it runs (`getBoundingClientRect().top > innerHeight`) — anything on screen at
load is left at its default opacity from first paint, never touched. Caught a second,
subtler bug the same way shipped.md keeps catching them: the `transition` declaration
itself has to live inside `@media (prefers-reduced-motion: no-preference)`, not just the
class that triggers it — the reduced-motion e2e probe fails on any element with a live
transform transition whether or not it's ever actually used.

---

## 3 November 2026 — Trust badges on every tool page, and the sidebar on home

The four one-line claims (no upload, works offline, free to start, no file-size limit)
from the style-lab demos are now real, on the home page and every tool page, in one
line — initially wrapped mid-claim on the home page specifically because it sat inside
`.hero__text`, a ~50%-width column shared with `PrivacyDiagram`; moved to a full-width
sibling after `.hero` closes. Tool pages had no such column and needed no change beyond
the row itself.

The tools sidebar is now on the home page too, but `defaultHidden` there (it starts
open everywhere else): a 43-tool rail competing with the hero and the category grid on
a first visit was the wrong trade for a page whose job is to convert, not browse.

---

## 3 November 2026 — Why CI was red: a CSP gap, a contrast fail, and a label collision

Six independent bugs, all from the sidebar/skin-picker work, found by actually reading
`gh run view --log-failed` instead of re-pushing and hoping.

**The big one:** `Astro.csp`'s automatic script hashing never sees an `is:inline`
script — that directive's whole point is to skip Astro's pipeline, which is also how it
discovers scripts to hash. Two pre-paint scripts in Base.astro were silently unlisted,
blocking themselves (and, worse, a bad first fix scoped the manual hash to
`script-src-elem`, which doesn't inherit `'self'` from `script-src` and broke every React
island on every page). Fixed with `Astro.csp.insertScriptHash()`, hashing the exact
string rendered via `set:html` so the two can never drift again.

**Real regressions, not flakes:** the new coral accent failed WCAG AA as text at ~4.4:1
on its own soft-tint background — darkened `--color-accent` until it cleared 4.5:1
against every surface it's actually used on, not just the one axe happened to flag
first. The sidebar's "Dock to the left edge" button and the crop tool's "Left edge"
handle — unrelated controls on the same page — collided under Playwright's substring
name match; renamed to "Dock sidebar to the left". A `grid-column: span 2` bento tile
doesn't clamp to one column when the grid only has one — it adds an implicit column
instead, overflowing the page at 320px; gated behind `min-width: 36rem`. The HTML
performance budget (unchanged since before the sidebar existed) is now genuinely
too tight for a sidebar that renders all 43 tools into every page; raised with a comment
explaining why, not silently.

---

## 2 November 2026 — Sidebar/skin follow-ups: gating, a live favicon, two layout bugs (design.md §10, §10a)

Four owner-reported fixes on the same feature. Skin memory is now a Pro/Practice perk
(checked against `/api/auth/me` only at the moment of picking, never from opening the
panel) — free/signed-out gets a session cookie instead of the year-long one. The browser
tab favicon and mobile `theme-color` now recolour with the active skin.

**The finding worth keeping:** `getPropertyValue('--color-accent')` returns the literal
`light-dark(...)` text, not a resolved colour — custom properties are untyped, so the
function inside one is never evaluated. Shipped broken once already from assuming it
would be; fixed by reading `.color` off a throwaway element the property was applied to
instead, which *is* typed.

**Two real layout bugs, not just polish:** the sidebar's `top` offset matched the
header's height, but the header wasn't sticky, so scrolling past it opened a gap above
the sidebar the same height as the header. And the footer's seven column-groups shared
one `auto-fill` grid, so the three site-link groups wrapped raggedly under just the first
two tool categories. Both fixed — see design.md §10a for the mechanism.

---

## 2 November 2026 — Tools sidebar and a 15-skin picker (design.md §10, §10a)

Not a roadmap item — a design-exploration session (`docs/style-lab.html` and five other
`docs/*.html` demos) that ended with two real features: a persistent, categorised,
collapsible tools sidebar on every tool page and category hub, and a 15-skin picker
(dropdown in the header, not a page — the first version was a full `/appearance` route,
replaced after shipping on the owner's instruction that a dropdown was the right size for
the decision). Default skin changed from "Soft Product" to "Playful Rounded".

**The finding worth keeping:** a header dropdown's z-index has to beat the sidebar's (30)
or a right-docked sidebar paints over it — found because the skin picker looked broken on
every page except the sidebar-free home page, not because anyone reasoned about stacking
order in advance. Fixed by raising both header dropdowns to 40; anything added to the
header later needs the same headroom.

**Stated limit:** the skin cookie is per-browser, not per-account — it does not follow a
signed-in visitor to a second device.

---

## 1 November 2026 — Comparison pages, all seven (roadmap 3.2)

Added PDF24, Sejda, pdfFiller, Stirling-PDF and Adobe to the existing two. Each claim is
quoted from the rival's own pages, linked per section, with a `checkedOn` date.

**The finding worth keeping: what you cannot source is itself the deliverable.** Two of the
five were written around gaps rather than guesses. Sejda's free-tier figures are not on any
page an automated read reaches, and one price that page did return was mangled badly enough
to be obvious ("$750 per user per month"), so both that page and pdfFiller's describe the
shape and link out. Adobe's help pages answer 403 and its trust pages 404, so that page
makes **no claim at all** about where Adobe processes files or how long it keeps them, says
so in its opening, and teaches the reader to check with the network panel instead. A page
that admits what it could not verify is worth more than one that quietly asserts it.

**The guard that came out of it.** Quoting a rival's price trips `statedPrices`, which is
correct. The fix was not to allow-list their figures — a bare 99 in ALLOWED would then
permit a stale 99 of ours anywhere. Comparison pages are skipped instead, because the
collection schema already dates and sources them, and a new inverted test bans **our own**
prices from those pages, since a competitor page is the worst place for our figure to rot.
Writing it immediately caught a false positive of its own: `$24` inside Adobe's `$24.99`
matched our Pro yearly price, so the pattern now refuses to match a prefix of a decimal.

**Stated limit:** every page says plainly what the competitor is better at. Adobe's section
on features we do not have is there because a comparison that only lists the other side's
weaknesses is an advertisement, not a comparison.

---

## 1 November 2026 — Self-host deployment guide (roadmap 4.10)

`docs/self-hosting.md`: what a Business licensee actually deploys (the static build and
nothing else), both build-time flags and why each one matters, the five `_headers` rules a
non-Cloudflare server has to reproduce, and a five-step verification that ends by pulling
the network cable.

**The finding worth keeping:** the two flags are not tidiness. `PUBLIC_USAGE_LIMITS=off`
exists because on a network with no internet a metering call does not fail fast — every
job would wait out a connection timeout first. Same for `PUBLIC_ERROR_REPORTING=off`. And
nothing else needs removing: `useSession` already catches its failed request and treats
everyone as signed out, so a static-only deploy degrades correctly on its own.

**Stated limit:** no install has been run on a real air-gapped network, because there is
no licensee yet. The document says so at the top and lists what the first deployment
should correct, rather than reading as tested.

---

## 31 October 2026 — On GitHub, CI green (roadmap 6.2)

`basicappcompany/leaflock-pdf`, private. Two commits, 512 files. First Actions run green
in 8m11s: type check, `pnpm tracker`, 490 unit tests, then 275 browser tests in 4.3m.

**The findings worth keeping, because each cost a round trip:**

- **A token needs the `workflow` scope** before GitHub will accept a push containing
  `.github/workflows/*`. The push is refused whole, not partially, so there is no
  half-pushed state to clean up — but it does mean two browser round trips with `gh`.
- **An empty repo already existed** under a different spelling (`LeafLockPDF`, made the
  day before). Renaming it was free and GitHub redirects the old name; creating a second
  one would have left two private repos for one project.
- **The local flakes were load, not the suite.** `/rotate-pdf` overflow and one
  accessibility case both failed under four local workers and both passed on the runner
  with none of CI's two retries used. Worth remembering before chasing a flake that only
  appears at `workers: 4`.

**Stated limit:** CI is the gate, not a deploy. Cloudflare Pages deploys from its own git
integration, and when this was written that project did not exist yet, so nothing shipped
to a URL. *Update, 5 November 2026:* the chain since completed — Pages project, custom
domain, apex record — and `https://leaflockpdf.com` serves the build (`docs/TODO.md` §0).

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
