---
name: status
description: Generate a phase-and-item-wise project status report for LeafLock PDF — done/in-progress/pending per roadmap phase and item, engineering time estimates for what's left, what's pending on the owner's side (credentials, accounts, legal), and an honest launch estimate. Use when asked "what's the status", "where are we", "what's left", "when can we launch", or any similar project-status question.
---

Produce a status report, not a restatement of the roadmap's prose. The test for every
line: **does this tell the owner something they'd act on, or is it just rephrasing a
file they could read themselves?** Counts and dates earn their place; roadmap narrative
doesn't — link to it instead of quoting it.

## Counts come from one command

**`pnpm counts`** prints tools, tiers, worker operations, unit tests, browser tests,
guides and landings. `pnpm build` prints the page count, and is the only one needing a
build. No document stores these figures (`docs/process.md` §8 explains why: ~21 hand-kept
copies, three of them drifted), so never quote a number out of a doc — run the command.

Two bits of state the command doesn't cover, both cheap and both load-bearing for the
launch estimate:

- `git log --oneline | wc -l` and `git remote -v` — whether a repo and CI exist yet.
- `grep awaitingLegalReview src/content/pages/en/*.md` — `true` means still a draft.

## What to read, and what to skip

- **`docs/status.html`** — the item-by-item state, with fixed `phase.item` ids. Fastest
  single source for "where are we"; read it first.
- **`docs/roadmap.md`** — the forward plan. What's *left* lives in the phase sections;
  read those. Pre-29-October ship narratives are still embedded in Phase 2's items and
  are history — skip them, they answer nothing about what remains.
- **`docs/shipped.md`** — the ship log. Only read it if asked what was *done* and why.
- **`docs/TODO.md`** — credentials and deferred config. Everything here is "code written,
  value missing": owner actions, not engineering work.
- **`docs/legal-checklist.md`** — the owner's and their lawyer's items, not engineering.
- **`docs/design.md` §13** — decisions already settled. Check before reporting something
  as an open question.

## Report structure

**1. Phase-and-item table, one phase at a time**, in roadmap order. For each phase:
status (✅ done / 🟡 partial / 🔴 not started), then every numbered or bulleted item
inside it with its own status — not just a phase-level rollup, since "Phase 2: partial"
hides that item 0 is done and item 3 has three tools left. For a partial or pending item,
give an engineering-time estimate **for the remaining work only**, calibrated against
this project's own observed pace (a reused-mechanism tool with full tests has run
~1–2 hours in past sessions; a tool needing a new engine or a new hand-built format, like
`srgbIcc.ts`, has run closer to half a day; Phase 3 content is explicitly the outlier —
the roadmap itself calls it "the expensive phase" at 6,000+ lines of unverifiable prose).
Flag anything that depends on an external party (a lawyer, a translator, an auditor, a
patent opinion) as **not an engineering estimate** rather than guessing a duration for it.

**2. What's pending from the owner, grouped by kind**, pulled from `docs/TODO.md` and
`docs/legal-checklist.md`, not re-derived from scratch each time:
   - Accounts and credentials (Google OAuth, Resend, Dodo, Paddle, Cloudflare D1, GitHub)
   - Legal (entity/jurisdiction, provider disclosures, retention periods, paid-plan terms,
     trademark clearance, DPA)
   - Decisions only the owner can make (staged vs. all-at-once launch, who translates,
     SOC 2 timing/budget)

Check current git state before claiming "no commits yet" or "no remote" — that was true
on 29 October 2026 and may not stay true.

**3. A launch estimate with an explicit lever.** State the range for the literal
"everything in the roadmap" reading honestly (Phase 3 and Phase 5 dominate it), and
separately name the faster path the roadmap itself already permits: ship the home and
policy pages early (domain/page age can't be bought back later), treat Phase 3–5 as
post-launch growth. Give a rough range for *that* path too, conditioned on the owner
supplying credentials/legal answers promptly. Never state a specific calendar date —
state a range and what it's conditioned on.

## Tone

Match the terse, evidence-first voice the rest of this project's docs use: a claim earns
its place by being checkable (a count, a file, a test result), not by sounding confident.
If something can't be verified quickly (e.g. exact browser-test count without a full run),
say so and give the best available estimate rather than inventing precision.

## Output

Answer in the terminal as structured markdown (tables read better here than prose for
this). Don't create a new file or artifact unless the owner asks for one this time.
