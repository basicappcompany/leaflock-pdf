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
## 22 November 2026 — A guide for every tool (3.3)

- **37 guides added** under `src/content/guides/en/` (Excel and CSV share one), about 540 to 740 words each. Each lists its tool in `tools:` so the tool page links it, and each was written from that tool's FAQ in `src/i18n/en/tools/<id>.ts`, so a stated limit (what survives a conversion, what is dropped) matches the tool.
- **Claims were checked against code, not memory.** The booklet guide first said sheet sizes the tool does not offer; the tool has A4, Letter and A3 landscape (`BookletTool.tsx`). Re-read the tool before writing a number.
- **Not done:** the roadmap's "answer in the first two sentences" rule, and translations.

## 21 November 2026 — Phone menu: "All tools" opens inside a scrolling header

- **Scroll anchoring has to be switched off on `body`, not only `html`.** With `html { overflow-anchor: none }` the computed value read `none` and the page still jumped from 300 to 987 when the sticky chrome grew; `body` stopped it. Found by bisecting in a probe after CI failed. Test: `mobile.spec.ts` ("All tools" inside the Menu).
- **A local `test:e2e` run can time out before any test runs:** the production build now takes over ten minutes on this laptop and the web server limit is 180 s. Start `astro dev` on a spare port and set `LEAFLOCK_PORT` for a layout test.

---
## 20 November 2026 (later) — A smooth, one-row phone header; zoomed-out layout; a closable banner

- **Scrolling no longer changes the header.** It used to shrink at 64px of scroll, which moved all the content under the finger and needed a scroll listener to chase the sidebar offset. The listener and `.site-chrome--condensed` are gone; the only script left measures `--tools-chrome-h` and `--banner-h` when the box resizes. The promo banner scrolls away by ordinary scrolling (the chrome's sticky offset is `-var(--banner-h)`). Phones get an opaque bar, no `backdrop-filter`. Tests: header height and content position are identical at every scroll stop, both ways (`mobile.spec.ts`, `recentTools.spec.ts`).
- **Phone header is one row** (brand; language, theme, an icon-only Menu button). The skin picker lives in the menu; a tap anywhere outside the open menu closes it. The language list now hangs from the screen's right edge (it was anchored to the flag button, which no longer sits at the edge). Design weighed in `docs/design.md`.
- **Zoomed out** (a 2560px viewport at 50%): the header's contents stay in the 84rem frame the page uses, and the home hero's minimum height is capped at 46rem; a screen-high hero stretched the bento cards into empty slabs. Left alone on purpose: the sidebar stays docked to the window edge (it docks to four edges, with handles); on a very wide window it sits far from the centred content.
- **The launch-offer banner has a close button,** remembered per offer in localStorage (`leaflock_banner_closed` = the launch date; a different offer shows again) and applied before first paint by Base's member script, so it never flashes back. It reuses the translated "Close" string. The banner's markup is now a bar (`.top-banner`) holding a link and a button.
- **Local test lessons:** a click at the corner of a rounded panel lands on whatever is behind the curve; and a base `display: none` placed below the media rule that shows an element beats it on source order (both found by the e2e run, neither visible to unit tests).

## 20 November 2026 — A phone Menu, an HTML sign-in email, no login-form flash

- **Phone header:** under 48rem, with scripting on, All tools, Guides, Security, Pricing, Business and Log in sit behind one Menu button (`NavToggle.astro`); All tools opens in place inside it. Row one (brand, language, skin, theme) is unchanged because `mobile.spec.ts` pins it. **A base `display: none` placed below the media rule that shows the button beat it on source order** and hid the button everywhere; the e2e run caught it, the unit tests could not. Scripting off keeps the links visible.
- **Sign-in email:** `src/lib/email/signInEmail.ts` returns text and HTML (table layout, inline styles, a full-width button, the link repeated under it). It loads nothing: no images, no pixel, no fonts, so nothing about opening it is reported anywhere. **Resend click and open tracking must stay off** for the sending domain, or the one-time token would be rewritten through their domain. The lifetime in it comes from `MAGIC_LINK_TTL_MS`.
- **`/login/`** showed the form for a second or two before redirecting someone already signed in (a client-only island, then a fetch). `Base`'s `signedInHint` marks `<html data-signed-in>` before paint from the hint cookie, whatever the plan; CSS shows "Signing you in…" instead of the form, and `LoginForm` clears the mark if `/api/auth/me` finds no session. The cookie only holds the form back; the redirect still waits for the server.
- `/redact-pdf` measured 1608 ms LCP against the 1500 budget in one local run on a loaded machine (3-4 s under load, passing in isolation for `/organize-pdf`); CI on a clean runner is the check that counts.

## 19 November 2026 — Password save fixed; the sign-in button page restyled

- **Setting a password never worked in production.** Workers' WebCrypto throws `NotSupportedError` above 100,000 PBKDF2 iterations and `password.ts` asked for 210,000, so set-password and password login both returned 500. Found by tailing the live deployment (`wrangler pages deployment tail <id> --project-name leaflock-pdf --environment production --format json`; the `pages.dev` host 308s `/api`, so test on the apex). Unit tests passed because Node has no cap, and the e2e tests stub the API: only a live request or a Workers-runtime test sees it. `tests/unit/server/password.test.ts` now pins the ceiling.
- **The first diagnosis was wrong.** The 500 looked like Cloudflare's 10 ms free-plan CPU limit and the file's own comment said so. The log said 8 ms CPU and an exception; after the fix a set-password request cost 2 ms CPU, because PBKDF2 runs natively and is not billed as script time. No paid plan is needed. The stale comment in `password.ts` and the iteration figure in `docs/design.md` are corrected.
- **The emailed link's button page was unstyled** (a bare form under `default-src 'none'`), which read as a second, unrelated sign-in. It is now a branded one-button page ("You're almost in" / "Finish signing in"). The two-step is kept on purpose: mail scanners open every link, and a GET that signed in would have its token spent. The CSS is one inline `<style>` allowed by `sha256` in that response's CSP, with a unit test that the hash matches the style. Skipping the button entirely when the link is opened in the browser that asked for it needs a pending-link cookie, which means updating `cookies.md`, `privacy.md`, `claims.md` and `security.md`; not done.
- **astro 7.4.1 to 7.4.7** (Dependabot's PR failed `astro check`; superseded). Its lockfile resolved `@astrojs/check`'s optional `@emnapi/runtime` peer to `2.0.0-beta.2`, which throws on import, and astro reported the package as missing. A `pnpm-workspace.yaml` override pins it to 1.11.3 (removal condition in `docs/TODO.md` §6).
- **Search Console, 19 Nov:** 790 pages "Discovered, currently not indexed", nothing blocking on our side; Google's sitemap copy predates the English-only change. Detail in `docs/TODO.md`.

## 17 November 2026 — Redesign: the Leaf theme, a full-width home page, a calmer tool page (1.7)

- Brief: premium, minimal, friendly and serious; the complaints were flat colour, no personality, loud type, too many colours. One green, nothing heavier than 700, hairline borders, soft shadows. Default skin "Leaf"; Playful Rounded stays as one of sixteen and the other fourteen are pinned to their old look (`html[data-skin]` in skins.css restores the three tokens they inherited). Accent text is `#15803d`, not the demo's `#16a34a` (about 3.1:1 as text).
- Home, top to bottom: a green banner above the header (Base's `banner` slot, inside `.site-chrome` so `--tools-chrome-h` includes it); a hero that fills the first screen: the headline and chips on the left, the "Popular right now" bento of eight major tools on the right (a 10-column grid: the big Merge tile, four medium tiles, then a row of five small ones; small drawn previews are CSS only); then every tool in one list with no script: tabs are a radio group (All, then a category each), the checked input hides the other categories' tools (home.css), all 43 stay in the HTML, and every tab starts with a filled "See all tools" (under All it jumps to the footer directory, under a category it opens All) with the outlined "See all <category> tools" hub links; the privacy diagram sits beside the definition at the foot. A 84rem column framed by hairlines. The new strings (`homePopular`, `homeSeeAll`) are in `pricing.ts`, not `common`, so they cost no tool page.
- **A fixed-height hero overlapped at 175% browser zoom** (the window is then about 823 x 514 CSS px). Nothing on the home page has a fixed height now, and `tests/e2e/zoomLayout.spec.ts` measures overlap, sideways scroll, clipping and a header that eats the window on six pages from 100% to 400%. An audit over all 86 English pages found one real defect (a long `docker run` in inline code).
- The logo is the demo's mark, a rounded square with a leaf, in the header, the favicon and the app icons (`pnpm icons`). The OG share images were not regenerated.
- Found on the way: **leftover `dist-*` test builds made `astro dev` never start** (Vite scans every HTML file in the project); a stale `astro preview` blocked later previews; `light-dark()` takes two arguments, so a multi-layer shadow cannot go in it. Home HTML budget raised to 112,000 and tool pages to 108,500 (each with a comment in performance.spec.ts). Not done: pricing and dashboard only re-coloured.
- Tool pages, header, sidebar, footer: `src/styles/tool-page.css` (tool pages only) makes "How it works" and "Private by design" two tiles (numbered steps, the second inverted), the breadcrumb a mono label and each question a bordered row; global.css gives the header a translucent bar and a bordered Log in / Dashboard button, the sidebar a bordered search box and an outlined current row, the footer a mono bottom line. On a phone the sidebar drawer is 18rem at most and the slim edge tab is green (a larger button was tried and dropped: the existing phone rules keep the tab thin so it covers no text); the four promises under a tool's heading wrap.

## 15 November 2026 — The server is the only authority for a run (4.14)

- A free user could run unlimited jobs: `claimJob` skipped the server when the cached plan was paid, passed when the
  request failed, and seven tools never called it at all (Compare and Extract tables among the Practice six). Now every
  task waits for `POST /api/usage/claim` and does not start without a 2xx; a tool above the plan is a 402.
- Decisions, final: Ed25519 offline token (48 h, public key in the bundle), self-hosted ungated and written down as an
  honor system, no worker split. Recorded in `proAccess.ts` and `docs/self-hosting.md`: a determined person can still call the
  bundled operations, claim a free tool's id, or go offline to avoid being counted.
- **Allowances moved**: a task now counts once however many operations it runs (tools that used several used to count
  several), and the main-thread tools are counted for the first time. The stated 20 and 60 are unchanged.
- Billing hygiene in the same pass: a tied or out-of-order webhook, and any authenticated event type we do not know,
  re-read Dodo; `/api/billing/refresh` checks Origin and has a site-wide cap; a failed sweep emails the owner.
- A guard found a real thing on its first run: `CheckoutButton` imports from `lib/server` (type only, erased at build). The
  guard allows `import type` and forbids a value import.

## 15 November 2026 — Dodo is the source of truth for plans (4.13)

- The webhook was the only writer of a plan and nothing re-read Dodo: a lost delivery (Dodo gives up after eight
  attempts) left a payer on free for good, an out-of-order one could undo a newer state, refunds and disputes were
  ignored, and `paused` kept access. Design in `docs/design.md` §8. The status mapping is one pure module shared by the
  webhook and the re-check, so they cannot disagree.
- Found by probing test mode first: list and retrieve carry `metadata.user_id`, and payments carry `refund_status` and
  `dispute_status`, which is why a refund is checked by asking Dodo rather than trusting the event payload (whose
  shape the docs do not give). **Not probed:** a ten-year payment; none existed in test mode.
- Migration 0008 adds three columns. The code tolerates a database without it, so a deploy that lands first cannot break
  billing. That tolerance has its own test, because the failure it prevents (a paying customer left on free) is silent.
- Setup was done the same day (`docs/TODO.md` §3): 0008 applied to production and preview, `RECONCILE_TOKEN` set on the site
  and on a `leaflock-billing-reconcile` Worker that runs the sweep on a cron. A GitHub Action was tried first and
  failed: Bot Fight Mode challenges GitHub's servers (403) and the free plan cannot skip it, while a Worker's call is not
  challenged. The three event types needed no change: the test webhook endpoint has no event filter.

## 15 November 2026 — Remove metadata also drops embedded page thumbnails

- `/Thumb` joins the per-page leftovers `removeMetadata.ts` strips (`pageLeftovers`). A thumbnail is a
  small picture of the page as it looked when last saved, so it can show text or an edit that was
  since removed from the page itself.
- Same finding as the original build: unlinking is not deleting. The new unit test plants a thumbnail
  stream with a marker string and asserts the marker is absent from the output bytes, not that the key is gone.
- Stated on the tool's FAQ (`src/i18n/en/tools/removeMetadata.ts`).

## 12 November 2026 — Launch offer, member pricing page, Pro to Practice upgrade (PRs #49-#51)

Early access now ends 31 December 2026 and the plans start 1 January 2027; until then yearly plans are 50% off and the
ten-year plan (repriced $120 to $240) 25% off. **A Dodo "paid trial" is how a charge-now, renew-later plan is sold:** the trial
amount is the discounted price, and `subscription_data.trial_period_days` is set per purchase so renewal lands on 1 January 2028.
The ten-year plan is a pre-applied percentage code instead. A missing launch product or code answers 503 and never falls back
to the standard price. **A Dodo subscription whose period equals its billing interval expires after one charge**; every product
here was created that way and is now 20 years (240 months for monthly). The first real upgrade (test mode, an Indian card) showed
that a plan-change charge goes to the saved card with no checkout page and can sit in `processing` for about two days, so the page
now shows the exact charge to confirm and reports "pending" from Dodo itself. The pricing page flashed the new-visitor view for
a second or two; the plan now rides in the `leaflock_signed_in` cookie and a 0.3 KB pre-paint script (home and pricing only)
picks the member view before first paint. Two CI lessons: every tool page serialises the whole `common` catalogue into its island
props, and `global.css` is inlined everywhere, so new strings and styles went to `pricing` and their own file.

## 10 November 2026 — IndexNow pings by itself after each deploy

`.github/workflows/indexnow.yml` runs on every push to `main`: it waits for the "Cloudflare Pages" check
Cloudflare posts on that commit (the deploy is Cloudflare's own git integration, so CI cannot otherwise know
when the pages are live), then runs `scripts/indexnow.mjs`, which still refuses to send unless the key file
and the sitemap are served. A push that only touches `docs/`, `tests/`, `.github/`, `CLAUDE.md` or a README is
skipped. Stated limit: it sends the whole sitemap, not just the changed pages, and a manual run from the
Actions tab ("Run workflow") or `pnpm indexnow` pings regardless. Google does not use IndexNow.
Found: the first run from GitHub's runner got a 403 on `/sitemap.xml` (the same request worked from a PC and the
key file loaded); once the script sent a named `User-Agent` the same workflow passed, and a refused fetch now
prints the response headers and first lines so the cause is visible. The edge rule itself was not identified.

---

## 9 November 2026 — The status page: scorecard, every URL, a calmer skin, who acts

`docs/status.html` gains a **Scorecard** (six tiles read from `pnpm counts`) and **Every tool and its
URL**, a filterable table that `pnpm counts` now writes from `src/tools/registry.ts` as a `TOOLS`
block (55 rows: 43 tools and 12 landings), so a page cannot be listed that does not exist. The
monochrome monospace skin was replaced because the owner found it hard to read: Inter, rounded cards,
soft shadows, one leaf-green accent, state in tinted colour *and* words, done as an override block
("Skin v2") so markup and script are unchanged. Every open item now says who acts: **Me**, **You** or
**Both** (derived from `owner`, with `who: "both"` on seven items), with a filter, and "I can do,
without you" lists only the Me items. `pnpm tracker` validates `who`. Phone: item rows restack so the
pill is not clipped. The file is internal and is not deployed to leaflockpdf.com.

---

## 9 November 2026 — The status page opens on what to do next

`docs/status.html` gains a **Next up** section at the top: what needs the owner (eight cards with a
time box and numbered steps, quick wins first), what can move without them (read from the item rows,
so it cannot go stale), and the four latest timeline entries. The phase list gets a search box and
state filters with counts. Taken from a sister project's status page: lead with actions, not
statistics, and make the list findable. Also fixed: "Last verified" was a typed date eight days
old (now read from the newest timeline entry), the owner checklist still listed Resend and D1 as
open, a sentence promised "2 locales", the timeline stopped at 1 November, and the pricing table
widened the whole page on a phone (its scroll wrapper had no style). The older skin shares the
script and skips the new section; `pnpm tracker` checks both.

---

## 9 November 2026 — hello@leaflockpdf.com receives mail

Cloudflare Email Routing forwards `hello@leaflockpdf.com` to the owner's Gmail (destination verified,
MX and SPF live, catch-all off). This closes the long-open §0 item and gives the feedback form's
"could not send" fallback somewhere real to land. The privacy page now names it accurately:
Cloudflare forwards, Google holds the mailbox, Resend only sends the service's own emails. Not
done: replying from `hello@`, and an end-to-end test from another account.

---

## 9 November 2026 — Two size landings: 200 KB and 1 MB

**Compress PDF to 200 KB** and **Compress PDF to 1 MB** are pages of their own now that the tool can
really do it (the earlier "deliberately not built" note is resolved). Each opens Compress already in
size mode with the number and unit filled in. The text promises only what the tool does: photo and
scan PDFs usually get there, text-only or attachment-heavy ones may not, and when a file cannot, the
person is told and given the smallest result. Both share one set of 12 strings per language (the size
is the only difference), translated by hand into all nine languages; the button name in each is read
from that language's own catalogue. Two share images added. Other sizes (100 KB, 500 KB, 2 MB) are
left until these two show search traffic. Spec: `tests/e2e/secure.spec.ts`.

---

## 9 November 2026 — Compress to a size

Compress PDF now has **By level / To a size**. In size mode the person enters a number (KB or MB, with
common sizes one tap away) and the tool tries image settings from gentlest to harshest until the file
fits, using a binary search over a six-step ladder so it needs at most three passes. The first three
steps are the three levels; the other three go further than any level does and exist only for targets.
**Stated limits, all shown to the person:** a target below what the images can give is *missed*, said
plainly ("the smallest we could make it is X"), and the smallest file is still offered; a file already
under the target is left alone; the ladder stops at 500-pixel images because below that a photo is no
longer a photo. Sizes are decimal (1 KB = 1,000 bytes), like every other size on the site. This is
what the "Reduce PDF size" page and its nine translations had to be corrected for: they said there
was no target-size option. Found on the way: a hand-built fix for a phone problem the sidebar handles
introduced (the lone hide/show handle covered the first letters of every heading) first padded the
page, which broke the 320px reflow; it first became a round button in the bottom corner, which covered text scrolled under it, and is now a slim tab on the screen edge exactly as wide as the page gutter, with an invisible 44px tappable reach, so it covers nothing. Spec: `tests/e2e/secure.spec.ts` (reached, missed, already under, validation, common sizes)
and `tests/unit/compress.test.ts`.

---

## 8 November 2026 — Search answers: a definition on the front page, five more search names

The front page has a plain "What is LeafLock PDF?" block (moved below the tools on 9 November, on the owner's instruction: the tools come first) (the tool count is computed, never
typed) so a person, a search engine or an assistant that quotes the first clear statement gets a true
one, and every one of its own category sections starts open. Five search names for tools that already
exist became pages of their own: **Combine PDF** (Merge), **Delete pages from a PDF** (Remove pages),
**PDF password remover** (Unlock), **Rearrange PDF pages** (Organize) and **Reduce PDF size**
(Compress). Each answer restates a fact the tool's own page already states. **Deliberately not
built at the time (built the next day, see 9 November):** "compress to 200 KB" and its siblings. The compress tool has three levels and no target
size, so such a page would promise what it cannot do; the **Reduce PDF size** page says so
plainly. That is a feature to build first (try levels until a size is reached, say honestly when it
cannot be), not a page to write. Translated into all nine languages by hand, in-session, because the
`ANTHROPIC_API_KEY` in this environment is rejected (HTTP 401): the tool and button names in each
answer are pulled from that language's own catalogue so they match the app, and 22 strings reused
existing translations. Also changed outside the repo: Cloudflare's *AI Crawler and Agent access
policies* (done by the owner) so `robots.txt` no longer blocks ChatGPT-User, Claude-User,
Perplexity-User or the training crawlers.

---

## 8 November 2026 — Search Console, and IndexNow for the other search engines

The sitemap (790 URLs) was submitted in Search Console and read successfully; seven key pages were
requested for indexing (home, merge, compress, PDF to Word, PDF to Excel, JPG to PDF, security).
Found: the sitemap first showed "Couldn't fetch" and cleared on its own within the hour, which is the
normal first-submission state, so it is worth waiting before treating it as a fault. `pnpm indexnow`
tells Bing, Yandex, Seznam and Naver (and through Bing, DuckDuckGo and Ecosia) about every sitemap
URL; the proof that the site is ours is a key file at `/<key>.txt` (`public/`), and the script
refuses to send until that file is live. Google does not use IndexNow. Stated limit: Search Console's
"request indexing" allows only about ten pages a day, so the sitemap does the bulk of the work.

---

## 8 November 2026 — Feature requests and feedback

Two buttons at the bottom of the sidebar, "Request a feature" and "Send feedback", replace the About,
Business, Help and Contact links (all in the footer already). One dialog, a message and an optional
email, sent to `/api/feedback` and stored in a new `feedback` table (migration 0007); read with
`pnpm feedback`. Stored: the message, the kind, the email if given, the page path. Not stored: any IP
(hashed only to rate-limit), any account id, anything about a file. Found on the way: a button's
own `display` beat the `hidden` attribute, so Cancel stayed visible after sending. Stated limits:
until migration 0007 is applied the form says it could not send and shows the contact address, and
that address has no mailbox yet (`docs/TODO.md` §0). Spec: `tests/e2e/feedback.spec.ts`,
`tests/unit/server/feedback.test.ts`.

---

## 8 November 2026 — Starred tools, in the browser and in the account

A star on every tool page and every sidebar row; a "Starred tools" group below "Recent tools", both
with a heading icon and count like the categories. The list is in localStorage (so it is remembered on
this browser, signed out too) and, signed in, in the account via `/api/starred` and migration 0006,
so it follows the person. Tool ids only. **The sync is op-based, not "last write wins":** a change is
pending until the server confirms it and is applied on top of the server's list, so an unstar is not
undone by a stale copy and another device's star is kept; a different account on the same browser
replaces the list instead of merging into it. Stated limits: a signed-out person's stars live only in
that browser; stars made while signed out on a browser last synced as another account are replaced on
sign-in; the cap is 100. Found on the way: the endpoint must answer 503 (not crash) when the table is
missing, and account deletion must still work then. Spec: `tests/e2e/starred.spec.ts`,
`tests/unit/starred.test.ts`, `tests/unit/server/starred.test.ts`.

---

## 8 November 2026 — Sidebar handles: move, hide/show and reset hang off its inner edge

The header buttons, the separate reopen button and the title are gone. Three handles hang off
the sidebar's inner edge and travel with it (open: flush against it; hidden: width 0, so they sit
on the window edge on the same side). **Move or Reset pressed while hidden opens the sidebar and
acts, in one press.** The move label names the opposite side; Reset is disabled at the default.
Found on the way: an earlier mock-up drew "docked left" on the right because the page came first
in the markup, and every attribute still read right, so the test measures positions. Also: a
phone-width override lost to a two-attribute desktop selector and cost 28px at 320px, so it
needed the same specificity; and the chevron's transition had to sit in the no-preference
motion query. Stated limit: on a phone only the hide/show handle stays on the screen edge while
the drawer is hidden. Spec: `tests/e2e/sidebarHandles.spec.ts`; strings `sidebar.position`,
`moveLeft`, `moveRight` are in all nine catalogues.

---

## 7 November 2026 — Recent tools in the sidebar; icon-only theme button; scrolled header

The recently-used-tools list (`recentActivity.ts`: tool id and time, never a file name) now
heads the tools sidebar as a collapsible "Recent tools" group (open by default; the choice is
remembered on the device), for everyone and not only signed-in visitors. The dashboard's recent
card is hidden outright while the list is empty. The sidebar group is built in the script, not
the page: a static version added 1.3 KB to every page and broke the HTML budget on three pages.
The sidebar title "All tools" is gone and its four control buttons are one even row at the end.
The theme button lost its "Light"/"Dark" word. Once the page scrolls, the language and theme
buttons stay in the right-most corner (owner changed this from "left" the same day). Stated limit:
the `sidebar.recent` heading is translated in all nine catalogues, reusing each language's existing
"Recent tools" wording from the dashboard (machine status, like the rest); `dashboard.recentEmpty` is unused but stays, since catalogues must match key for key.
Spec: `tests/e2e/recentTools.spec.ts`.

---

## 7 November 2026 — Flag-only language button, and the phone header stops wrapping

The language button shows only a flag (the globe for a regional language), and the opened list
shows the same mark beside each language's full name. **Rule, owner 7 November 2026:** a
language that is a country's own gets that flag; a regional or multi-country one gets the globe.
`localeFlags` in `src/i18n/locales.mjs` decides, and `tests/unit/locales.test.ts` fails if a
registry language has no decision, names a flag the package lacks, or the globe set drifts from
Bengali and Arabic. English is the US flag because the site is in American spelling.

**Why SVG, not emoji:** Windows Chrome and Edge do not draw flag emoji, only two letters ("IN",
"DE"), and Windows is most of this audience. `flag-icons` (MIT, devDependency) is copied by
`integrations/vendor-assets.mjs` into `public/vendor/flags/`, only the codes in `localeFlags`
(18 files, 124 KB on disk, about 1 KB each on the wire, list images `loading="lazy"` so a closed
list fetches none), with its LICENSE beside them and an entry on `/licenses`. The flag list is
in the vendor stamp so adding a language re-copies. Same-origin, so the CSP is untouched.

The phone header had wrapped the theme button onto its own row: wordmark, language button and two
round buttons needed about 355px of a 342px row at 390px wide. Smaller gaps and side padding on
phones fix it, and `tests/e2e/mobile.spec.ts` now fails at 360, 390 and 412px if any of the four
leaves the first row. Stated limit: the button's accessible name still says the language ("Language:
Deutsch") because a flag alone is a weak label.

---

## 7 November 2026 — Sign-in history

Before this, only `users.last_login_at` existed: each sign-in overwrote the one before, and a
session row vanished on expiry or logout, so who signed in when, and how, could not be
recovered. Migration `0005_login_events.sql` adds `login_events` (user, time, method
`link`/`password`/`google`, browser family) and `recordLogin()` in `src/lib/server/db.ts`
writes it from all three sign-in endpoints. **No IP address, raw or hashed, and nothing about
files.** Included in the account export and deleted with the account.

The history row is best effort: a failed insert is logged and swallowed so it can never stop a
sign-in, while the `last_login_at` update still throws as before. **Migration order matters:**
the migration must be applied to production and preview D1 *before* the code deploys, or the
insert fails (harmlessly, by the rule above, but silently losing history). `privacy.md` had no
section on account data at all; it now has one, with a retention blank in
`docs/legal-checklist.md` §3. Stated limit: history starts the day this ships.

---

## 7 November 2026 — Preview builds get their own database; the API answers only on the apex; HSTS

Found from the code side: `wrangler.toml` had one top-level `[[d1_databases]]` block, which Pages
applies to Production **and** Preview, so every preview deployment read and wrote the real D1.
`[[env.preview.d1_databases]]` now binds `leaflock-pdf-preview` (migrations 0001–0004 applied).
env blocks do not inherit bindings, so the binding name `DB` is repeated. Preview has no
secrets either (`SESSION_IP_SALT` and the rest): a preview's API will fail until they are set
with `wrangler pages secret put <NAME> --env preview`, which is the safe default.

`functions/api/_middleware.ts` 308-redirects `/api/*` on any host but the apex (and localhost)
to the apex, via `src/lib/server/canonicalHost.ts`. **Scoped to `/api/`, not the root, on
purpose:** a root middleware makes every static asset request a metered Functions invocation.
The static site on `pages.dev` still serves; it holds nothing private. 308 keeps a POST's method.
`Strict-Transport-Security: max-age=31536000` is in `public/_headers`, without
`includeSubDomains` or `preload` (a subdomain such as `send.` is mail-only and nothing has
checked the rest).

---

## 7 November 2026 — One theme button; the default stays Light

The three-way System/Light/Dark control is now a single button showing the mode you are in (a
sun and "Light", or a moon and "Dark"; icon only on a phone), with the tooltip and accessible
name naming what a click leads to. **Default is always Light**: the owner first asked for System
as the default, then withdrew it the same day, so the pre-paint script in `Base.astro` sets
`data-theme` to light unless `dark` is saved, and an old stored `'system'` reads as Light. Which
icon shows is decided in CSS from `html[data-theme]`, so it is right at first paint. Found on the
way: an HTML comment in an `.astro` template is emitted into every page, so the explanatory
comment is a JSX one. Stated limit: System is no longer offered, and the `system` string stays
in `common.ts` (unused) because the generated locale catalogues would need regenerating to drop
it. `cookies.md`, `privacy.md`, `security.md`, `CLAUDE.md` and `design.md` §10 were updated to say
the same, and the e2e theme test now covers a dark device still getting Light.

---

## 7 November 2026 — Tool pages show a skeleton while loading; sidebar reopen button follows the dock

Tool pages used `client:only`, so the box was empty until React had started, then said "Loading
tool…". It now shows a skeleton in the file picker's shape from the first byte: the island's
`fallback` slot in `pages/[tool].astro` and `ui/ToolSkeleton.tsx` (the Suspense fallback) draw the
same dashed box with two pulsing bars (CSS pseudo-elements, no motion under reduced-motion), so
nothing jumps when the tool takes over. About 0.3 KB per tool page. The reopen button for a hidden
sidebar now sits on the side the sidebar is docked to, with its arrow flipped on the right dock
(it was always on the left), on desktop and on phones.

Measured, not assumed (headless Edge, emulated slow 4G + 4x CPU, local build, single machine):
page text appears at ~3.0–3.5 s and the tool is usable ~1.0–1.5 s after that. Tried and **dropped**:
- *Starting the tool's chunk download early* (a page script calling the same dynamic import):
  five alternating runs each way gave the same time to usable (merge 4.33 s vs 4.35 s, ocr 4.34 s
  vs 4.25 s). Request order is not what costs. (Later measurement: nor are the bytes; see below.)
- *Hover prefetch* (Astro `prefetch`): it only fetches the HTML, so little to gain, and with it on
  3 of 5 local accessibility runs had a `page.goto` aborted; with it off, 3 of 3 passed. Not worth it.
Bytes are not the lever either. A tool page transfers ~250 KB brotli over 19–25 requests, 170 KB of
it `pdf.worker` (the PDF engine, 543 KB raw), which `ToolApp` warms when the browser is idle. Blocking
that one file changed nothing: median time to usable 4,453 vs 4,408 ms on merge, 3,596 vs 3,770 ms on
compress (3 alternating runs each), because it arrives after the tool is already usable. What is
left on the critical path is the HTML, 8 KB of CSS, the React client (55 KB brotli, 208 KB raw) and a
2–3 KB tool chunk: ~70 KB, a third of a second of transfer even at 1.6 Mbps. On this machine
without throttling the tool is usable ~0.4–0.5 s after the page text; the 1.0–1.5 s figure needs
the 4x CPU slowdown, so it is mostly a slow phone running JavaScript. Nothing cheap is left; the
skeleton is the fix. Re-open only with a real-device measurement.
Local Playwright (4 workers, Edge) also flakes on its own now and
then (a browser context timing out, an aborted goto) and passes alone; CI runs 2 workers with 2 retries.

---

## 7 November 2026 — Footer aligned with the page, language switcher closes on outside click

The tool columns (Organize, Convert, …) and the Product / Company / Legal row were two grids
with different widths, and both were wider than `main`'s content, so the footer neither lined up
with itself nor with the page above it. Both rows are now the same four equal columns (two on
tablet, one on a phone), and the footer's inner width and side padding match `main`. Checked in
a browser at 360, 390, 768, 1024 and 1440 px: no horizontal scroll, edges match the content.
On pages with the tools sidebar the footer now reserves the same 16rem beside it (left or right
dock, none when the sidebar is hidden or overlays on a phone), so its edges match the content
there too (352–1344 px at 1440 wide, both). The language switcher also closes on a click
anywhere outside it or on Escape, like the tools menu.

---

## 7 November 2026 — Top-10 languages published, machine-translated (item 5.8)

Hindi, Bengali, Brazilian Portuguese, Indonesian, Russian, French and Turkish, 1,922 strings
each, translated in-session by seven parallel translators and loaded with `--import`. Zero
validation failures; the unit suite passes (`pnpm counts` for the figure) and the build still
makes 2,067 files.
"Top 10" is the first ten in the registry, English included; the other ten stay routed as
English under `noindex`, deferred by the owner "for now".

- **Terms for a native reader to check first.** *redact*: hi रिडैक्ट, bn রিড্যাক্ট (transliterated),
  pt-BR tarjar, fr caviarder, ru "Удаление данных (redaction)", tr karartma, id "Redaksi" (also
  means editorial office). *flatten*: hi/bn transliterated, fr aplatir, ru сведение, id ratakan.
  Also: the Russian count phrasings ("Файлов: {count}") avoid plural forms by design; Hindi uses
  the dual "सकता/सकती"; Turkish file-name suffixes are ASCII; "White-out" is a coinage in bn.
- **The per-page note was then removed** (owner, same day): the "translated automatically"
  strip, its string in all ten catalogues, its CSS and the layout code. The statement is one
  bullet in `claims.md`, "Honest limits", with the page's date bumped. Trade-off recorded: a
  reader of a translated price or privacy claim no longer sees the warning on the page.
- **CI caught the banner's weight.** Embedding nine offers in every page pushed the home page
  105,027 B past its 105,000 budget and tool pages past 100,000. The sentences now come from
  `/lang-offers.json`, fetched same-origin only when a visitor's language matches an offer;
  pages carry a ~70-byte code list. Tool-page HTML budget raised 100,000 → 102,000 because the
  switcher's ten links cost ~1.2 KB (~0.12 KB per language); revisit past ~20. Browser-checked
  for hi, pt-BR, en, ja, a dismissed state, and English on a Hindi page. Also: a type error in
  that rewrite failed `pnpm check` in CI; run it before pushing.
- **Production verified** after the merge (Cloudflare Pages dashboard plus the live URLs): the
  Claims bullet is live, the Hindi page has no note, `security.txt` and `/lang-offers.json`
  serve, an untranslated locale is `noindex`. The deploy lands about a minute after CI passes,
  so a check made in the first seconds shows the previous build.
- **One test changed.** `statedPrices` now allows 0, because pt-BR writes the Free plan as
  "US$0" (English writes a bare "$0", which no pattern matched).
- **The vitest glob-cache caveat bit again** with seven new folders; touching `i18n/index.ts` fixed it.
- **Stated limit:** indexed pages 237 → 790 (79 × 10). Files unchanged at 2,067 of 20,000 because
  every locale already built as English copies.

---

## 7 November 2026 — security.txt

`public/.well-known/security.txt` (RFC 9116): contact `basicappcompany@gmail.com`, expires
1 Nov 2027, canonical URL on `leaflockpdf.com`. Prompted by Cloudflare Security Insights, which
listed six findings; the other five are dashboard settings (HSTS, minimum TLS, Bot Fight
Mode, AI Labyrinth) tracked in `docs/TODO.md` §8. The owner first gave `basicappco@gmail.com`;
the Git account's address was used instead after the mismatch was raised.

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
