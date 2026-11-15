# TODO: credentials, config and deferred setup

## At a glance — 12 November 2026

A dated snapshot; the sections below are the detail and the source of truth.

**Pending on you** (accounts, dashboards, people):
- Valid `ANTHROPIC_API_KEY` (§9); a person to review translated trust claims (§9).
- Send one test email each to `hello@` and `feedback@` from another account (§0, §4); decide on replying
  from `hello@`. (The feedback form was verified end to end on 12 November: stored, and the notification arrived.)
- Auto-renew and registrar 2FA (§0); TLS 1.2 and Bot Fight Mode decisions (§8); whether an edge rule blocks
  GitHub's runners from `/sitemap.xml` (§8).
- Google OAuth client, Paddle (§1, §3); legal review (`legal-checklist.md`), including refund wording for the
  launch offer, which takes money before the term starts.
- **Dodo:** test mode is live on the site (12 November). Left: when the first real Pro to Practice upgrade settles,
  check the plan flipped and the 50% code did not also discount the first renewal; go-live mode (§3); a deploy on
  1 January 2027.
- Bing Webmaster Tools; look at Search Console in a few days; post the launch drafts when signed in.

**Pending on me** (engineering, no input needed to start):
- More size landings (100 KB, 500 KB, 2 MB) only if the 200 KB and 1 MB pages show traffic.
- An about page naming a person, dates on guides, `sameAs` links; more search-name landings.
- Guides (6 of one-per-tool), the remaining 10 locales, server-backed retention (2.12) — see the tracker.

Counts and dates are not kept here: run `pnpm counts` and `pnpm tracker`.

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
- [x] **Site DNS** — done (verified live 5 November 2026: `https://leaflockpdf.com` returns 200, served via Cloudflare). Was found undocumented on 30 October 2026 while
      checking what the purchase actually left to do. `astro.config.mjs` sets
      `site: 'https://leaflockpdf.com'`, the **apex**, so the apex is the hostname that has to
      serve the site. All three steps are done: repo and `main` pushed (item 6.2, 31
      October), the Cloudflare Pages project connected to it, and the apex attached. Checked
      5 November 2026: the zone is on Cloudflare (nameservers `bob`/`deb.ns.cloudflare.com`),
      `/` returns 200, and `/api/auth/me` returns JSON, so the Functions bundle is
      publishing as well as the static build.
- [x] **`www` redirect** — done (verified 5 November 2026: `www.leaflockpdf.com` returns a 301 to the apex). Nothing in
      the codebase mentions `www.leaflockpdf.com` — zero occurrences — so if `www` ever
      serves the build, it serves every page under a hostname whose own canonical points at
      the apex. The sharper failure is sign-in: `redirectUri()` derives the Google callback
      from the **request origin**, and only the apex and `localhost:8788` are registered
      (`docs/design.md` §12), so Google rejects the callback for anyone who arrives on
      `www`. A 301 from `www` to the apex at the edge is the whole fix. It is in place.
- [x] **A mailbox for `hello@leaflockpdf.com` — done, 9 November 2026.** Cloudflare Email Routing
      forwards `hello@` to `basicappcompany@gmail.com` (destination verified; MX records route1–3
      `.mx.cloudflare.net` and apex SPF `include:_spf.mx.cloudflare.net` live; the catch-all is off, so
      only `hello@` is received). Resend still only *sends*. Named in `privacy.md` (Cloudflare for
      forwarding, Google for the mailbox). **Not done:** replying *from* `hello@` (Gmail "send as"
      would need an SMTP login; until then replies come from the Gmail address) and an end-to-end
      test email from another account.
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
- [x] **Pro, 10 years: $120 once** — a defined term rather than a "lifetime" plan. **Repriced to $240 on 12 November 2026** (25% off in the launch offer).
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
- [x] **The 10-year plan is Pro**, at $120 ($1/month equivalent; $240 from 12 November); $120 for ten years of
      Practice would be far below cost. It is sold as a defined ten-year term rather than
      a "lifetime" plan. The stored plan value is still `lifetime`: renaming it would mean
      a second table rebuild and a data update for no change in behaviour.
- [x] **The trust page Practice is sold on** shipped the same day as item 3.5: `/claims`,
      which carries the security-questionnaire answers a category 4 buyer asks for.
- [ ] **Not code, and still open:** the click-through DPA Practice is sold on goes into the
      6.3 lawyer engagement. Until it exists, the pricing copy promises a DPA that does not
      yet exist — which costs nothing while the Practice tools are free (until 1 January
      2027), and must not still be true when the plans start.
- [ ] **`terms.md` and `legal-checklist.md` §4 need the ten-year term written**, replacing
      the open "what does lifetime cover" question — a fixed term is easier to honour and
      easier to draft.
- [ ] **A CA question, not a lawyer one:** $240 (or $180 in the launch offer) taken for ten years of service is deferred
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

- [x] `RESEND_API_KEY` — done 4 November 2026. `leaflockpdf.com` was already verified in
      Resend; created a Sending-access key scoped to that domain (`leaflock-pdf` in the
      Resend dashboard) and set it in `.dev.vars`.
- [x] `EMAIL_FROM` — `hello@leaflockpdf.com`, set in `.dev.vars` alongside the key above,
      matching the verified domain.
- [ ] `DODO_API_KEY` — creating checkout sessions.

## 3. Dodo Payments — test mode live on the site; live mode not yet set up

**Merchant account submitted for review — 3 November 2026.** Dodo's Product Information
onboarding form is filled in and submitted (integration method: API/SDK, their
Checkout Sessions API; fulfilment: instant access + ongoing subscription, no email/manual
step; acquisition channel: Website & SEO). Outcome not yet known — once approved, the
real product ids and a live `DODO_API_KEY` become available, which unblocks everything
below. The `dodopayments@dodopayments` Claude Code plugin (official MCP + skills) is
installed and available for the verification work once that happens.

`DODO_MODE=test`, `DODO_WEBHOOK_SECRET=whsec_…` and three of the four product ids
(`DODO_PRODUCT_PRO_MONTHLY`, `…_PRO_YEARLY`, `…_LIFETIME`) read as made-up stand-ins
rather than ids copied from a real dashboard.

**`DODO_PRODUCT_PRACTICE_YEARLY` had no value at all**, local or otherwise — added by item
4.9 on 30 October 2026 with the Practice tier and missed in that pass: it is declared in
`functions/env.d.ts` and read twice in `src/lib/server/billing.ts`, so `productIdFor()`
returned undefined for Practice and its checkout would have found no product. A stand-in
now sits in `.dev.vars` beside the other three, and needs a real id like them.

**Update, 12 November 2026 — test mode is real, not stand-ins, and on sale on the live site.** The four
standard products exist and their ids match `.dev.vars`. A **launch offer** (50% off yearly plans, 25% off
the ten-year plan, charged at checkout, term from 1 January 2027; `src/lib/pricing.ts`, `docs/design.md` §8) was
set up and shipped the same day (PRs #49-#51):

- [x] Confirm each product id against the Dodo test dashboard — all four match.
- [x] **Ten-year product repriced $120 → $240** in the test dashboard (decided 12 November).
- [x] **Two launch products created in test mode**: Pro Yearly (launch offer) `pdt_0NrjfwsSE7wuuqhajcW1C`
      (trial amount $12) and Practice Yearly (launch offer) `pdt_0NrjgFBbqXaRKmQcoZMTE` (trial amount $124.50).
      Each is a paid trial: the trial amount is charged at checkout and the full price renews at the end of
      the trial, which `checkoutFor()` sets per purchase so renewal lands on 1 January 2028.
- [x] **Discount codes**, both created in test mode: `LAUNCH10Y25` (25%, ten-year product only, pre-applied by
      `checkoutFor()`) and `UPGRADEPRACTICE50` (50%, standard Practice product only, **limited to one billing
      cycle**, applied by `upgradeFor()` when a Pro subscriber upgrades during the offer).
- [x] **Subscription periods fixed** (12 November, read back from Dodo's API): the Dodo default of one billing
      interval makes a subscription expire after its first charge, and the standard products had it. Pro
      Monthly is now 240 months, Pro Yearly and Practice Yearly 20 years, and both launch products 20 years.
- [x] Verified against Dodo's checkout preview: Pro yearly $12.00 today then $24 on 2028-01-01; Practice
      $124.50 then $249; ten-year $180.
- [x] **Webhook endpoint created** in the test dashboard for `https://leaflockpdf.com/api/billing/webhook`,
      all events (`ep_3LyNCdV1elQXn30ezexqyIIkfzU`); its signing secret is set in `.dev.vars` and in production.
- [x] **Production secrets set** (owner, 12 November): `DODO_API_KEY`, `DODO_WEBHOOK_SECRET`, `DODO_MODE=test`, the
      four `DODO_PRODUCT_*` ids, `DODO_PRODUCT_PRO_YEARLY_LAUNCH`, `DODO_PRODUCT_PRACTICE_YEARLY_LAUNCH`,
      `DODO_DISCOUNT_TEN_YEAR`, `DODO_DISCOUNT_PRACTICE_UPGRADE`. Without any of the launch ones, checkout or
      upgrade answers 503 on purpose (it never falls back to the standard price).
- [x] **End to end on the live site, test mode** (12 November): a Pro launch purchase delivered
      `subscription.active`, `.renewed`, `payment.succeeded` and `.updated`, all answered 204, and the account
      became Pro. Lesson: the webhook secret must be uploaded from a file, not via a prompt, in this harness (a prompt
      reads empty input and still prints "Success").
- [ ] **The first real Pro to Practice upgrade is waiting on the bank** (12 November, an Indian card: Dodo shows the
      change-plan charge as `processing`, up to about two days; the plan only changes when it settles, and the page
      says so). When it settles: confirm the account became Practice and the `subscription.plan_changed` webhook was
      accepted, and check whether the 50% one-cycle code also discounted the **first renewal** (Dodo's preview
      suggested it might; if so, the code needs adjusting before the offer is promoted).
- [x] **Dodo as source of truth (item 4.13) — setup done 15 November 2026.** Migration `0008_billing_sync.sql` applied to
      production and preview (columns confirmed in production); `RECONCILE_TOKEN` set as a Pages production secret and as a
      secret of the `leaflock-billing-reconcile` Worker (a random 64-character value, never written down; to rotate it, set
      both again, and the site only picks up its copy on the next deploy); the test-mode
      webhook endpoint `ep_3LyNCdV1elQXn30ezexqyIIkfzU` has `filter_types: null`, which Dodo treats as every event, so
      `subscription.updated`, `refund.succeeded` and `dispute.lost` already reach it.
- [x] **The sweep is a Cloudflare Worker, not a GitHub Action** (15 November 2026): the Action was challenged by Bot Fight
      Mode (403, "Just a moment"), which a free-plan custom rule cannot skip. The Worker is deployed by hand, not by CI:
      `pnpm exec wrangler deploy --config workers/billing-reconcile/wrangler.toml`. A failed run shows in the Workers
      dashboard (Workers & Pages, leaflock-billing-reconcile, Logs); there is no email alert yet.
- [ ] **Still open for 4.13:** at go-live, create the live-mode webhook endpoint with no event filter (or with those three
      events included). The sweep reads whichever mode `DODO_MODE` selects, so it needs no other change. Unverified until a ten-year purchase exists in test mode: that its payment carries `metadata.user_id` and a
      `product_cart`.
- [ ] **Go live** (Dodo live mode): create the same products (with the 20-year subscription periods), both
      discount codes and a webhook endpoint in live mode; the ids and the signing secret differ. Then switch
      `DODO_MODE` and the production secrets. Live and test are separate hosts and separate keys.
- [ ] **A deploy on or after 1 January 2027 is what ends early access on the site**: `paidPlansAvailable` is
      computed from the date at build time. Plan that deploy, and have the copy sweep for roadmap 4.12 ready
      first — `earlyAccessCopy.test.ts` starts failing on the first build after that date, by design. The launch
      offer closes at the end of 31 December in the checkout function at run time, but the pricing page and home
      banner are static until the next deploy; deploy early on 1 January so a stale "50% off" is not left up.
- [ ] **Terms and refunds**: the launch offer takes money up to about seven weeks before the term starts, and an
      upgrade charges the difference for what was paid. `terms.md` §5 says so; the refund wording (`[TO CONFIRM]`
      there, and in `legal-checklist.md` §4) must cover a purchase made before the start date and a plan change.
- [x] **Docs quoting $120 for the ten-year plan** swept 12 November (`design.md`, `roadmap.md`, `status.html`,
      `legal-checklist.md`; the history entries keep $120 on purpose and say where it changed).
- [x] ~~Decide Paddle vs Dodo for good~~ — already decided 28 October 2026 (both, split by
      region; see legal-checklist.md §2) and now named in `privacy.md` and `terms.md`
      (3 November 2026). What's still open is wiring Paddle into the code — only Dodo
      exists in `functions/` and `.dev.vars` today.
- [ ] Switch `DODO_MODE` to live and set the production secrets before launch (see "Go live" above).
- [ ] **Paddle has no code yet.** The billing routes (`functions/api/billing/*`,
      `src/lib/server/billing.ts`) only know Dodo. Policy pages now promise Paddle
      handles non-India customers — that promise isn't true until Paddle is integrated.
      Checked 3 November 2026: `src/i18n/en/pricing.ts`'s `checkout.note` ("Payments are
      handled by Dodo Payments...") was deliberately **left unchanged**, since that's
      still an accurate description of what the code actually does today — it becomes
      stale, and needs rewording (likely to vary by the buyer's region), only once
      Paddle is actually wired in.

## 4. Cloudflare D1 — created 3 November 2026

- [x] `wrangler d1 create leaflock-pdf` — database id `75b792bb-eef2-4a99-8090-56b77cb55e4d`
      (APAC region), now in `wrangler.toml`.
- [x] All four migrations applied remotely (`0001_auth` through `0004_practice_plan`).
- [x] **Migration `0007_feedback` applied to production**, 8 November 2026, by the owner (a first try
      timed out reaching Cloudflare's API before anything ran; the second succeeded):
      `cd /c/Claude/leaflock-pdf && pnpm exec wrangler d1 migrations apply leaflock-pdf --remote`.
      The feature-request and feedback forms now store messages; read them with `pnpm feedback`.
- [x] **`0007` applied to the preview database**, 9 November 2026, by the owner (the coding
      session's Cloudflare login is refused by that database, code 7403, so it is run from the
      owner's shell): `pnpm exec wrangler d1 migrations apply leaflock-pdf-preview --remote --env
      preview`. Branch previews now store feedback too.
- [x] **Set `FEEDBACK_NOTIFY_EMAIL` to `feedback@leaflockpdf.com`** (decided and set 9 November 2026, redeployed twice; Cloudflare
      Email Routing already forwards `feedback@` to the owner's Gmail, so mail to `hello@` and to
      `feedback@` arrives in one inbox, told apart by the To address and by the subject, which starts
      "Feature request:" or "Feedback:"; a Gmail filter on `to:feedback@leaflockpdf.com` can label them).
      The secret is the owner's to set (the value is piped in, since the command is not interactive):
      `printf 'feedback@leaflockpdf.com' | pnpm exec wrangler pages secret put FEEDBACK_NOTIFY_EMAIL
      --project-name leaflock-pdf`, then a new deploy. `wrangler pages secret list` shows production has
      `EMAIL_FROM`, `FEEDBACK_NOTIFY_EMAIL`, `RESEND_API_KEY` and `SESSION_IP_SALT` (checked 10 November).
      Messages are also stored and read with `pnpm feedback`; sending uses Resend. **Verified 12 November
      2026:** a test POST to the live `/api/feedback` returned 204 and the owner received the notification
      email, so storage and the Resend notification both work in production.
- [x] **The feedback form’s fallback address now has a mailbox** (9 November 2026, §0): a visitor who
      hits the "could not send" message can write to `hello@leaflockpdf.com` and it arrives.
- [x] **Migration `0006_starred_tools` applied to production**, 8 November 2026, by the owner
      (the coding session's auto-mode classifier refuses production database changes, which is
      the right default): `cd /c/Claude/leaflock-pdf && pnpm exec wrangler d1 migrations apply
      leaflock-pdf --remote`. `migrations list --remote` then reports nothing left to apply.
      Starred tools now sync to the account. Before it existed nothing broke: `/api/starred`
      answered 503 and the browser kept every star locally.
- [x] **`0006` applied to the preview database too**, 8 November 2026, by the owner:
      `pnpm exec wrangler d1 migrations apply leaflock-pdf-preview --remote --env preview`.
      The `--env preview` matters: that database is declared only inside
      `[[env.preview.d1_databases]]` in `wrangler.toml`, so without it Wrangler says it cannot
      find it. `list` then reports nothing left to apply.
- [x] `SESSION_IP_SALT` set as a production Pages secret (a fresh random value, not the
      `dev-only…` placeholder `.dev.vars` still uses locally).
- [x] Cloudflare Pages build and Functions bundle — verified 5 November 2026: the site is
      live and `https://leaflockpdf.com/api/auth/me` and `/api/usage/today` return JSON
      200, so the Functions bundle now publishes. The first deploy had failed on the empty
      `database_id` (`Error 8000022: Invalid database UUID`). Not verified from outside:
      that D1 reads and writes work, which needs a signed-in session (§1).

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
- [x] **Branch protection — declined, because GitHub will not sell it here.** Asking for it
      returns `Upgrade to GitHub Pro or make this repository public to enable this feature`
      (403). Public is not an option: the product is closed source (`docs/design.md` §13).
      So the choice is GitHub Pro or nothing, and for a solo repo where CI already runs on
      every push it buys little — the rule would only stop a mistake nobody else can make.
      Revisit when someone else commits here, which is also when Pro starts paying for
      itself. Recorded as decided rather than left as a box nobody can tick.
- [x] **Three actions target the deprecated Node 20** — already bumped (checked 5 November 2026: `ci.yml` uses checkout@v7, setup-node@v7, pnpm/action-setup@v6, upload-artifact@v7). Was: force-run on Node 24:
      `actions/checkout@v4`, `actions/setup-node@v4`, `pnpm/action-setup@v4`. A
      warning, not a failure. Bump each to v5 when the workflow is next touched.
- [x] **`ubuntu-latest` migrated to Ubuntu 26 on 19 October 2026** — already pinned (`runs-on: ubuntu-24.04` in `ci.yml`, checked 5 November 2026), so the runner can change
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

## 7. The 24 launch blanks — 3 November 2026 pass

The owner asked for every `[TO CONFIRM: …]` placeholder across `privacy.md`, `terms.md`
and `cookies.md` listed in one place; a questionnaire artifact was built for the owner to
answer the ones only they can, and this session resolved everything that didn't need
them. See `docs/legal-checklist.md` for the full tracked list — this section only records
what changed and why.

**Resolved directly from the code, no decision needed:**
- [x] Hosting provider named as **Cloudflare** (`privacy.md`, three places).
- [x] Email provider named as **Resend** (`privacy.md`, two places) — already implied by
      `RESEND_API_KEY` everywhere in `functions/`; stating it was a formality, not a
      choice.
- [x] Payment providers named as **Dodo Payments (India) + Paddle (everywhere else)**
      (`privacy.md` and `terms.md`) — the decision already existed in
      `legal-checklist.md` §2 (28 October 2026); the pages just hadn't been updated to
      match it. Paddle is **not yet wired into the code** — see §3 above.
- [x] "Lifetime plan" wording in `terms.md` corrected to the real product: a limited
      founding **ten-year** Pro plan, $120 once — `terms.md` still called it "lifetime"
      after the 30 October rename landed everywhere else (pricing.ts, roadmap.md).
- [x] Open-source notices now have a real home: `/licenses`
      (`src/content/pages/en/licenses.md`), generated from the actual runtime
      dependencies and their installed versions, not typed from memory. `terms.md`'s
      blank now links to it instead of asking where notices would go.

**A real bug, not a blank: `cookies.md` was wrong, not just incomplete.** It claimed
"exactly one cookie" (`__Host-leaflock_session`), but the code sets three:
that one, `leaflock_signed_in` (added earlier for the signed-in header hint), and
`leaflock_skin` (added this week for the skin picker, 2 November). Neither addition
updated the cookie policy, despite the policy's own promise to update before any cookie
is added — the kind of drift that only shows up when someone actually reads the policy
against the code. Fixed: all three are now described, including `leaflock_skin`'s
session-only-vs-year-long split by plan.

**Researched, not decided — findings recorded for the lawyer, pages left as `[TO
CONFIRM: …]`:**
- Cloudflare Pages sets no cookies of its own by default; `__cf_bm` and similar only
  appear if a bot-protection feature (Bot Fight Mode, Bot Management, Super Bot Fight
  Mode) is turned on in the dashboard — worth a five-minute check against the real
  account rather than an assumption either way.
- Cloudflare's own log retention is 24 hours on the Free plan (Workers logs: 3 days);
  longer retention needs Log Explorer or a paid plan — depends on which tier the
  account is actually on.
- India's statutory retention for financial/payment records: Income Tax ~6–7 years,
  Companies Act 8 years, GST 6 years from the relevant year-end — practice is to keep
  8 years to satisfy all three at once. Still "a CA question, not a lawyer one" per §0a.
- Resend ships a pre-signed DPA (EU Standard Contractual Clauses included) that applies
  automatically to every account — nothing to negotiate, just cite it.
- Paddle's DPA likewise incorporates the EU SCCs (Implementing Decision 2021/914) for
  its sub-processors.
- Dodo Payments: merchant of record, refunds discretionary and case-by-case, a 60-day
  window to request one. Paddle: the EU's statutory 14-day digital-goods withdrawal
  right applies unless the buyer has expressly waived it by starting delivery; beyond
  that, refunds are Paddle's discretion.
- The ePrivacy "strictly necessary" exemption plausibly covers `leaflock_skin` — it's
  set only on an explicit user action and used only to give the user back what they
  asked for, and the design already withholds the year-long version from anyone who
  hasn't paid for persistence — but a long-lived preference cookie is exactly the case
  one of the sources flagged as needing confirmation rather than assumption. Flagged in
  `cookies.md` itself now, not left silent.

## 8. Security review follow-ups — 6 November 2026

Dashboard settings only; the code findings from the same review are in `docs/shipped.md`.

- [x] **HSTS** — added 7 November 2026 in `public/_headers` (`max-age=31536000`, no
      `includeSubDomains`/`preload`); live after the next deploy. Cloudflare's dashboard toggle
      is now optional, and would only add `includeSubDomains`/`preload` if ever wanted.
- [ ] **Minimum TLS 1.2** — same tab. Cloudflare Security Insights (4 Nov scan) flagged
      `www.leaflockpdf.com` as accepting older TLS.
- [ ] **Decide on Bot Fight Mode** (Security → Bots) — flagged Moderate. Free, but it can block
      legitimate scripted visitors; leaving it off is a defensible choice for a static site.
- [ ] **Check what returned 403 to GitHub's runner on `/sitemap.xml`** (Security → Events, 10 Nov 2026).
      The IndexNow workflow got a 403 with no User-Agent; a named one passes, so a bot or user-agent rule
      is involved. Harmless for search engines, but worth knowing which rule it was. Owner's dashboard.
- [x] **`security.txt`** — added 7 November 2026 at `public/.well-known/security.txt`
      (contact `basicappcompany@gmail.com`); clears the Low finding on the next scan. Its
      `Expires` date is tracked in §9. AI Labyrinth was skipped on purpose.
- [x] **`pages.dev` API and preview database** — done and live 7 November 2026 (PR #15).
      Confirmed from `wrangler.toml`: one top-level D1 block meant previews shared the
      production database. Now `[[env.preview.d1_databases]]` binds `leaflock-pdf-preview`
      (id in `wrangler.toml`, migrations applied), and `functions/api/_middleware.ts`
      308-redirects `/api/*` off any non-apex host. The static site still serves on `pages.dev`
      by design (a root middleware would meter every asset request).
- [x] **Verified live 7 November 2026** after PR #15 deployed:
      `https://leaflock-pdf.pages.dev/api/auth/me` returns 308 to the apex,
      `https://leaflockpdf.com/` sends `strict-transport-security: max-age=31536000`, and a
      GET to the apex `/api/auth/me` still returns 200 JSON. (Probe with GET, not `curl -I`:
      the routes define only GET handlers, so HEAD returns 404.)
- [ ] Preview deployments have **no secrets** yet; set
      `SESSION_IP_SALT` etc. with `wrangler pages secret put <NAME> --env preview` only if
      you want previews to run the API.

## 9. Locales — translation key and review, 6 November 2026

`scripts/translate.mjs` is written and works; only the value and the human step are missing.

- [ ] **`ANTHROPIC_API_KEY` for the translation script — the one in the owner's shell is rejected (HTTP
      401, "invalid x-api-key"), found 8 November 2026.** Translation was done by hand in-session
      instead (`--import`) for the 8–9 November strings; it works but costs a lot of output per
      batch. Read from the environment of
      whoever runs `node scripts/translate.mjs --locale <code>`; it is never in the repo or
      `.dev.vars`, and the site does not use it at run time. Decide whose account pays: a run
      is about 58,000 tokens per locale (`--dry-run` prints the estimate).
- [ ] **A person reads the trust claims, pricing and error strings per locale** before its
      status in `src/i18n/locales.mjs` goes from `machine` to `reviewed` (roadmap 5.7). Until
      then the Claims page ("Honest limits") says translations are machine-made. There is no
      per-page note any more; remove that Claims bullet only when every locale is reviewed.
      Review order, by traffic evidence: `hi`, `bn`, `pt-BR`, `id`, `ru`, then `de`, `es`, `fr`, `tr`.
      The glossary choices to check first are listed in `docs/shipped.md` (7 Nov 2026 entry).
- [ ] **Bump `Expires` in `public/.well-known/security.txt` before 1 Nov 2027.** RFC 9116
      scanners treat an expired file as a finding. Confirm the contact address is the right inbox.
- [ ] **Replace the inferred half of the language list with our own country data** once the
      site has traffic (Cloudflare analytics, which sets no cookies). Roadmap Phase 5.

## 10. Tool page load — investigated, nothing to do, 7 November 2026

The skeleton (docs/shipped.md, 7 Nov) removed the blank gap. The follow-up audit found no cheap
win: the biggest download (`pdf.worker`, 170 KB brotli of ~250 KB) arrives after the tool is usable,
and blocking it changed nothing; the critical path is ~70 KB. The 1.0–1.5 s wait only appears with a
4x CPU slowdown. A reason to look again would be a real-device or field measurement (Cloudflare
analytics has no timing data; there is no RUM, by design, because a beacon would break `connect-src
'self'`).
- [ ] **Optional: measure on a real mid-range phone** before spending any more effort here.

## Running the auth and billing routes at all

`pnpm dev` serves only the Astro site; Pages Functions do not run, so every `/api/*` route
404s and the Google button stays hidden. Use the build-and-wrangler route instead:

```bash
source ~/tools/leaflock-env.sh && pnpm build \
  && pnpm exec wrangler d1 migrations apply leaflock-pdf --local \
  && pnpm exec wrangler pages dev dist
```
