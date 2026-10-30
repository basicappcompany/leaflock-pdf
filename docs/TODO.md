# TODO: credentials, config and deferred setup

Everything that is stubbed, empty or waiting on an external account. The code for each
item is written and working; only the real values are missing. Started 23 October 2026.

Legal and policy items are **not** here — they live in `docs/legal-checklist.md`.

Keep this file current: when you stub a value to get moving, add a line here in the same
commit; when you fill it in, tick the box and say what the value now is (not the secret
itself, just where it came from).

## 0. `leaflockpdf.com` — bought 30 October 2026

Found available that same morning while checking rename options: the domain the whole
product assumes was never registered. It is wired through canonicals, the sitemap,
`hello@leaflockpdf.com` and both Google OAuth redirect URIs — run
`grep -rIl leaflockpdf src docs public functions scripts integrations tests` for the current
spread — so it gated everything below it rather than being a branding task.

- [x] **Register `leaflockpdf.com`** — done 30 October 2026, owner. This unblocks §1 and §2:
      Google's redirect URIs can now be registered against a real domain, and the email
      provider can verify the sending domain so `EMAIL_FROM` works.
- [ ] **Turn on auto-renew** and keep a non-expiring card on the registrar account. This is
      the actual failure mode, not theft: `ogpdf.com` was found sitting in redemption
      period on 30 October because someone let it lapse. Registrar add-ons sold as "domain
      protection" are mostly the transfer lock every registrar already sets by default plus
      account 2FA, which is free — enable 2FA on the account instead, and use the registry
      lock if the registrar offers one.
- [ ] `leaflockpdf.in` — open, and deliberately not bought: owner is holding at `.com` only
      for now (30 October 2026). Our jurisdiction is India and it is a few dollars, so this
      stays a revisit, not a decision waiting on anyone.
- [ ] **Site DNS is not set up, and was documented nowhere** — found 30 October 2026 while
      checking what the purchase actually left to do. `astro.config.mjs` sets
      `site: 'https://leaflockpdf.com'`, the **apex**, and every canonical, hreflang, sitemap
      entry and OG URL is derived from it, so the apex is the hostname that has to serve the
      site. The order was forced, and the first step is done: the repo exists and `main` is
      pushed (item 6.2, 31 October). **What is next is the Cloudflare Pages project** — Pages
      builds from the repo, and the project (`leaflock-pdf`, i.e. `leaflock-pdf.pages.dev`)
      has to exist and be connected to `basicappcompany/leaflock-pdf` before a custom domain
      can attach to it. Adding `leaflockpdf.com` as a custom domain on that project is what
      creates the apex record, once the zone is on Cloudflare.
- [ ] **Decide `www` now, and the answer is a redirect rather than a second site.** Nothing in
      the codebase mentions `www.leaflockpdf.com` — zero occurrences — so if `www` ever
      serves the build, it serves every page under a hostname whose own canonical points at
      the apex. The sharper failure is sign-in: `redirectUri()` derives the Google callback
      from the **request origin**, and only the apex and `localhost:8788` are registered
      (`docs/design.md` §12), so Google rejects the callback for anyone who arrives on
      `www`. A 301 from `www` to the apex at the edge is the whole fix.
- [ ] **A mailbox for `hello@leaflockpdf.com` is still missing, and Resend is not it.**
      Resend only *sends* (magic links, receipts); it provides nothing to receive at. A free
      forwarder to an existing mailbox is enough to start and is the simplest thing to
      disclose, which matters because `docs/legal-checklist.md` §2 requires the email
      provider to be **named in `privacy.md`** — so this choice goes into the 6.3 brief.
      When DNS is set: SPF/DKIM TXT records are Resend's, MX is the mailbox's, and neither
      collides with the apex record above — MX, TXT and A/CNAME are different record types
      on the same name, so mail and the site coexist on the bare domain. DMARC gets set once,
      after both exist, rather than twice.
- [ ] Note what is *not* needed: `leaflock.com` is a live gutter-guard product and is not
      obtainable. That is why the wordmark keeps "PDF" (`docs/design.md` §13).

## 0a. Pro price — reopened 30 October 2026, owner decision

The second competitive review found **$59/year is the cheapest professional PDF product
anywhere**: Nitro $180, Adobe $180–300, Foxit $130–160, pdfFiller $96–180, Xodo $108,
PDFelement $80–90, LightPDF $60, UPDF $50 — and SealedPDF at **$468/year** for 13
client-side tools sold to the solo attorneys our Pro six were chosen for. Eight vendors
price above us and nothing prices below except free.

The *tiering* is settled (`docs/design.md` §13, six tools, confirmed 30 October). Only the
number is open.

**Settled by the owner 30 October 2026 — numbers decided, implementation open.**

- [x] **Pro $24/yr or $4/mo** (down from $59). Monthly is $4 rather than $2.50 because a
      flat 50¢ per transaction would otherwise take a quarter of it.
- [x] **Pro, 10 years: $120 once** — a defined term rather than a "lifetime" plan.
- [x] **Practice $249/yr** — the six professional tools, the click-through DPA, the trust page.
- [x] **Business $499/yr**, target $750.
- [x] Priced **per category**, not globally.

The code was item 4.9, **shipped 30 October 2026**:

- [x] **A third tier in the code.** `tier` in `src/tools/registry.ts` is now
      `'free' | 'pro' | 'practice'` and the six carry `practice`. Beyond the files listed
      when this was scoped, it also reached the `plan` column's CHECK constraint
      (`migrations/0004_practice_plan.sql` — a table rebuild, since SQLite cannot alter a
      CHECK in place), `src/lib/planCache.ts`'s union and `isPaidPlan` allow-list, the
      dashboard card that offered batch to any paying plan just as batch became a Practice
      tool, and `CheckoutButton`'s own copy of the plan-key union, which had already
      drifted and now imports the type instead.
- [x] **`tests/unit/proCopy.test.ts` failed by design, and was rewritten** to check each
      paid tier against the registry both ways round — including that no Practice tool is
      ever advertised as a Pro feature, which is the drift that would charge someone $24
      for $249 of tools.
- [x] **The 10-year plan is Pro**, at $120 ($1/month equivalent); $120 for ten years of
      Practice would be far below cost. It is sold as a defined ten-year term rather than
      a "lifetime" plan. The stored plan value is still `lifetime`: renaming it would mean
      a second table rebuild and a data update for no change in behaviour.
- [x] **The trust page Practice is sold on** shipped the same day as item 3.5: `/claims`,
      which carries the security-questionnaire answers a category 4 buyer asks for.
- [ ] **Not code, and still open:** the click-through DPA Practice is sold on goes into the
      6.3 lawyer engagement. Until it exists, the pricing copy promises a DPA that does not
      yet exist — which costs nothing while `paidPlansAvailable` is false, and must not
      still be true when it flips.
- [ ] **`terms.md` and `legal-checklist.md` §4 need the ten-year term written**, replacing
      the open "what does lifetime cover" question — a fixed term is easier to honour and
      easier to draft.
- [ ] **A CA question, not a lawyer one:** $120 taken for ten years of service is deferred
      revenue recognised over that term. Worth asking once the entity exists.
- [ ] If it changes, it touches `src/lib/pricing.ts` (the numbers),
      `src/i18n/en/pricing.ts` (the plan copy), and `tests/unit/proCopy.test.ts` (which
      pins the Pro set and would need the new tier's copy named).
- [ ] **How it is announced is already constrained:** `terms.md` §5 promises Pro tools are
      free during early access, and `docs/legal-checklist.md` §7 has that wording under
      review. A price change before launch is cheap; after the promise is public it is not.
- [ ] The Business tier's **$499 → $750** step-up has the same constraint and was always
      meant to be announced in advance (`docs/roadmap.md` Phase 4). Decide both together,
      once. `src/lib/pricing.ts` holds $499 as `businessYearly` and $750 as
      `businessYearlyTarget` since item 4.9; what is still undecided is *when* to announce.

## 1. Google sign-in — blocked, placeholders in `.dev.vars`

`GOOGLE_CLIENT_ID` is `dummy-…id.apps.googleusercontent.com` and `GOOGLE_CLIENT_SECRET`
is `dummy-secret`. Both are shaped correctly, so `googleConfigured()` returns true and the
button renders, then Google rejects the request with **401 invalid_client**.

- [ ] Create a Web application OAuth client: Google Cloud Console → APIs & Services →
      Credentials → Create credentials → OAuth client ID.
- [ ] Register both redirect URIs exactly (`redirectUri()` in `src/lib/server/google.ts`
      builds these from the request origin, so the port must match):
      - `http://localhost:8788/api/auth/google/callback`
      - `https://leaflockpdf.com/api/auth/google/callback`
- [ ] Replace the two dummy values in `.dev.vars`, then restart wrangler — it reads that
      file only at startup.
- [ ] Set them in production: `wrangler pages secret put GOOGLE_CLIENT_ID` and
      `… GOOGLE_CLIENT_SECRET`.

Only `openid email` is requested, so the consent screen needs no sensitive-scope review.

## 2. Env vars referenced in code but absent from `.dev.vars`

Each of these is read by a Pages Function but has no local value, so the feature behind it
fails as soon as it is exercised locally.

- [ ] `RESEND_API_KEY` — sending the magic-link and verification emails.
- [ ] `EMAIL_FROM` — the From address (hello@leaflockpdf.com once the domain is verified
      with the email provider; the provider itself is still an open legal-checklist item).
- [ ] `DODO_API_KEY` — creating checkout sessions.

## 3. Dodo Payments — values present but unverified

`DODO_MODE=test`, `DODO_WEBHOOK_SECRET=whsec_…` and three of the four product ids
(`DODO_PRODUCT_PRO_MONTHLY`, `…_PRO_YEARLY`, `…_LIFETIME`) read as made-up stand-ins
rather than ids copied from a real dashboard.

**`DODO_PRODUCT_PRACTICE_YEARLY` had no value at all**, local or otherwise — added by item
4.9 on 30 October 2026 with the Practice tier and missed in that pass: it is declared in
`functions/env.d.ts` and read twice in `src/lib/server/billing.ts`, so `productIdFor()`
returned undefined for Practice and its checkout would have found no product. A stand-in
now sits in `.dev.vars` beside the other three, and needs a real id like them.

- [ ] Confirm each product id against the Dodo test dashboard, or create the products.
- [ ] Confirm the webhook secret belongs to a real endpoint pointed at
      `/api/billing/webhook`.
- [ ] Decide Paddle vs Dodo for good — the choice is still open in the legal checklist,
      and the merchant of record has to be named in the policy pages.
- [ ] Switch `DODO_MODE` to live and set the production secrets before launch.

## 4. Cloudflare D1 — not created

`wrangler.toml` still has `database_id = ""`, so there is no remote database; only the
local Miniflare one under `.wrangler/state` exists.

- [ ] `wrangler d1 create leaflock-pdf`, then paste the id into `wrangler.toml`.
- [ ] Apply the three migrations remotely:
      `wrangler d1 migrations apply leaflock-pdf --remote`.
- [ ] Set `SESSION_IP_SALT` as a production secret — the local value is the literal
      `dev-only…` string and must not be reused.

## 4a. CI runs on GitHub — done 31 October 2026 (item 6.2)

`.github/workflows/ci.yml` (type check, `pnpm tracker`, unit tests, the full Playwright
suite including the performance budget) now runs where it was always meant to.

- [x] **First commit, repo, push, `origin`.** `basicappcompany/leaflock-pdf`, **private** —
      the product is closed source (`docs/design.md` §13), so this is not a default to
      drift from. Two commits, 512 files. The empty `LeafLockPDF` repo created on 30 October
      was renamed rather than duplicated, so there is one repo for the project.
- [x] **First Actions run green**, 41110988456, 8m11s, no retries used. The step with no
      local equivalent — `playwright install --with-deps chromium` on a fresh
      `ubuntu-latest` runner — is now tested rather than assumed, and the two flakes seen
      locally did not recur, which says they were parallel load rather than the suite.
- [ ] **Branch protection:** require this workflow to pass before merging to `main`. Worth
      doing now there is a `main` to protect, and it is the only part of 6.2 left.
- [ ] **Three actions target the deprecated Node 20** and are being force-run on Node 24:
      `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`. A
      warning, not a failure. Bump each to v5 when the workflow is next touched.
- [ ] **`ubuntu-latest` migrated to Ubuntu 26 on 19 October 2026**, so the runner can change
      under us. Pin `runs-on: ubuntu-24.04` to make that a decision instead of a surprise.

Two things worth knowing before anyone repeats this on another machine:

- **`gh` needed the `workflow` scope.** The first push was rejected outright — GitHub will
  not let an OAuth token create `.github/workflows/*` without it. `gh auth refresh -h
  github.com -s workflow` fixes it, and nothing partial lands: the whole ref is refused.
- **`winget` is disabled by Group Policy** on the owner's machine, so `gh` is a portable
  install in `~/tools/gh/bin` beside the portable Node. It will not self-update.

## 5. Daily allowances — confirmed 28 October 2026

~~`FREE_ACCOUNT_DAILY_JOBS = 30` and `ANONYMOUS_DAILY_JOBS = 5` in
`src/lib/server/usage.ts` are both marked `[TO CONFIRM: owner]`.~~ Owner confirmed new
values after the `/compete` revenue review (`docs/roadmap.md` Phase 4): published
freemium benchmarks show usage-limited free tiers converting at 5–15% against 1–4% for
feature-limited ones, so the fix was to raise the anonymous allowance rather than drop
it — the old `5`/day was stopping the casual, never-going-to-pay visitor rather than the
professional running real volume.

- [x] `ANONYMOUS_DAILY_JOBS` raised **5 → 20**.
- [x] `FREE_ACCOUNT_DAILY_JOBS` raised **30 → 60**, keeping roughly 3x the anonymous
      allowance so an account still buys something real.
- [x] Both changed in `src/lib/server/usage.ts`. `pnpm test` still passed (215/215).
- [x] **"No other file needed a change" was wrong — corrected 29 October 2026.** That
      claim held for the metered surfaces (the dashboard meter, the claim endpoint and the
      `dailyLimitAnonymous` / `dailyLimitFree` messages in `src/i18n/en/common.ts` all
      interpolate `{used}`/`{limit}` and name no number), and missed every place the site
      spells the allowance out in prose: `src/i18n/en/pricing.ts` (the free plan's feature
      list), `src/i18n/en/auth.ts` (the sign-up note and the account panel's
      `allowanceFree`), `src/content/pages/en/help.md`, and both files in
      `src/content/compare/en/`. For a day the product advertised **5/30** while granting
      **20/60** — understating its own free tier by 3x on the pricing page and in the two
      comparison tables where a more generous free tier is the argument. All six are fixed,
      and `tests/unit/statedLimits.test.ts` now fails with a file and line if any stated
      allowance disagrees with the constants, so this cannot recur silently
      (`docs/process.md` §8).

## 6a. HEIC to PDF — decided 27 October 2026: build it, unbundled

Owner decision: ship a real decoder (libheif-wasm), not just the Safari-only fallback.
Reasoning — the person who searches "HEIC to PDF" is on Windows or Android; a Mac/iOS
user rarely needs this tool at all, since the OS already opens HEIC everywhere. The
existing Safari-only fallback (still live, see below) mostly serves the group that
doesn't have the problem.

- [x] **Ship libheif-wasm unbundled — done 29 October 2026.** `libheif-js@1.23.5`
      (LGPL-3.0); `integrations/vendor-assets.mjs` copies `libheif.js`, the separate
      `libheif.wasm` and its LICENSE into `public/vendor/libheif/`, so the codec stays a
      replaceable component and never enters a bundle. Decoding runs on the main thread
      (`src/lib/convert/heic.ts`) — the job worker is `iife` and would have inlined 1.5MB
      into the chunk every tool fetches. Native decode is tried first, so Safari/iOS never
      fetch it. Verified in Chromium, which cannot decode HEIC itself:
      `tests/e2e/heic.spec.ts`. Worker chunk unchanged at 555,523 bytes.
- [ ] **Get a cheap confirmatory legal read on HEVC patent exposure** before launch — now
      the only part of this item left, and the build no longer blocks on it because the
      build is done. One fact worth giving the lawyer: libheif-js ships **no encoder**, so
      this is decode-only. Pools have historically targeted encoders and
      large-scale commercial distribution (streaming, device makers), not small
      decode-only client-side utilities — a materially different risk profile — but
      that is not a substitute for an actual opinion before this ships to the public.
- [ ] Confirm the wasm payload stays lazy-loaded and does not touch
      `tests/e2e/performance.spec.ts`'s critical-path budget — same discipline as the
      pdf.js renderer chunk.

Already shipped and staying as-is: `.heic` reaches `imagesToPdf.ts`'s existing
`createImageBitmap()` decode with no new dependency — this keeps working as the
fallback for Safari/iOS and for any format the wasm decoder doesn't cover.

## 6. Small code gaps noticed along the way

- [ ] `googleConfigured()` (`src/lib/server/google.ts`) only checks that the two vars are
      non-empty, so a placeholder still renders a button that cannot work — which is the
      opposite of what `LoginForm.tsx` intends ("a button that can't work is worse than no
      button"). Consider rejecting obvious stubs. Owner has not decided yet.
- [ ] The home dashboard's browser tests (`tests/e2e/dashboard.spec.ts`) stub
      `/api/auth/me` and `/api/usage/today`, because Playwright serves the static build
      through `astro preview`, where Pages Functions do not exist. A harness that can
      issue a real session (wrangler plus a seeded local D1) would cover sign-in,
      the meter and the plan panels end to end instead.
- [ ] The header's signed-in link now goes to `/dashboard` instead of `/account`, so
      account settings are one click further away (reached from the dashboard's own
      link). Worth revisiting if people go looking for it.

## Running the auth and billing routes at all

`pnpm dev` serves only the Astro site; Pages Functions do not run, so every `/api/*` route
404s and the Google button stays hidden. Use the build-and-wrangler route instead:

```bash
source ~/tools/leaflock-env.sh && pnpm build \
  && pnpm exec wrangler d1 migrations apply leaflock-pdf --local \
  && pnpm exec wrangler pages dev dist
```
