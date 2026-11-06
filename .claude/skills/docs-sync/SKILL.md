---
name: docs-sync
description: After a feature, decision or scope change in LeafLock PDF, sweep every doc that depends on it — shipped log, status tracker, roadmap, design decisions, TODO, CLAUDE.md, and the stated claims in content pages. Use at the end of any change, before committing, or when the owner asks "are the docs updated?".
---

The docs drift because a change touches one file and quietly invalidates five. This skill is
the sweep `CLAUDE.md` already asks for, as a checklist. It reports and edits docs; it does not
change product code.

## 1. Find what actually changed

`git diff --stat main...HEAD` and `git log --oneline main..HEAD`. Write down, in a line each:
what was **added**, what was **removed**, any **number or limit that moved** (budgets, counts,
locales, prices), any **decision reversed**, anything **deferred** to the owner.

## 2. Run the two scripts

- `pnpm counts` — rewrites the `COUNTS` block in `docs/status.html` and mirrors `status2.html`.
- `pnpm tracker` — must print "item data consistent". It prints the item totals and dates; any
  prose quoting them is now stale.

## 3. Grep for what the change made false

For each removed or changed thing from step 1, grep `docs/`, `CLAUDE.md` and
`src/content/pages/en/` for the old word or value (e.g. the old count, the removed feature's
name, "label", "visible", a budget figure). Fix every hit. Never leave a sentence that was true
yesterday.

## 4. The file-by-file checklist

| Changed… | Update… |
|---|---|
| Anything shipped | `docs/shipped.md` entry (newest first; ten lines for a tool) |
| Anything on the tracker | the item in `docs/status.html` **and** `status2.html` (new item = next id in its phase, never reused), then `pnpm tracker` |
| Plan or scope | `docs/roadmap.md` (one line; it stays a plan, not a history) |
| A settled decision, or one reversed | `docs/design.md` §13, saying what changed and what did not |
| Credentials, dashboard settings, owner steps | `docs/TODO.md` (note the stub; don't block on it) |
| Legal or provider terms | `docs/legal-checklist.md` |
| A habit or a pitfall that cost a CI run | `CLAUDE.md` (one bullet) |
| A claim a visitor reads (privacy, limits, prices, languages) | the content page in `src/content/pages/en/` and its `updated:` date |

## 5. Verify, then report

`pnpm check`, `pnpm test`, and `pnpm tracker`. Report as a short list: files changed and why,
anything you deliberately left alone, and anything only the owner can settle. If a doc names a
number a script can print, replace the number with the command rather than copying it.
