# Legal checklist for the lawyer meeting

Everything a lawyer (and the owner) must settle before launch. The drafts live in `src/content/pages/en/`; every open item there is marked `[TO CONFIRM: …]` and the pages show a "draft" notice until `awaitingLegalReview` is set to `false`.

Prepared 21 October 2026.

**To send a lawyer, use `docs/legal-brief.md`** (added 30 October 2026) — it carries the
product context this list assumes, the exact ask, and the six answers the owner must supply
before anyone can start drafting. This file stays the authoritative list of open items; the
brief does not duplicate it and is not updated as items close.

## 1. Company and jurisdiction

- [ ] Legal entity name and registered address (privacy.md, terms.md: top and contact sections).
- [ ] Governing law (India, which state) and courts (city and state) (terms.md, "Governing law").
- [ ] Whether a grievance officer is required under India's DPDP Act 2023, and their name and contact (privacy.md).
- [ ] Minimum age for users and the DPDP verifiable parental consent approach (privacy.md, "Children").

## 2. Service providers (decide, then name them)

- [ ] Hosting provider, likely Cloudflare Pages (privacy.md, three places; cookies.md).
- [ ] Whether the hosting provider sets any cookies of its own, e.g. bot protection (cookies.md).
- [ ] Email provider for hello@leaflockpdf.com (privacy.md).
- [x] Payment provider and merchant of record — **decided 28 October 2026: both,
      routed by region.** Dodo Payments as merchant of record for customers in India
      (cheaper domestic rate, confirmed UPI); Paddle as merchant of record for
      customers everywhere else (confirmed iDEAL and Pix, flat fee with no surcharge
      stacking). See `docs/roadmap.md` Phase 4 for the reasoning and the engineering
      cost accepted alongside it.
- [ ] **privacy.md and terms.md must now name both providers**, each as merchant of
      record for its own region, not one. This doubles the review in the two items
      below — each needs doing once per provider.
- [ ] How each provider's international data transfers are covered (adequacy decision
      or Standard Contractual Clauses) (privacy.md) — **for both Dodo and Paddle**.
- [ ] Retention periods and refund/withdrawal terms may differ by provider — confirm
      whether Dodo's and Paddle's own terms agree closely enough to state one policy,
      or whether `terms.md` needs a per-provider carve-out.

## 3. Retention periods

- [ ] Server access logs (privacy.md).
- [ ] Emails sent to us (privacy.md).
- [ ] Payment records under Indian tax law (privacy.md).
- [ ] Crash reports, e.g. 90 days (privacy.md, "Error reports"). Reports contain no IP address and no file data; see `src/lib/errorReporting.ts`.

**Zero-knowledge share links — added 29 October 2026, and this is a second pass, not part
of the launch review.** `docs/roadmap.md` Phase 2 item 6 (tracker id 2.12, formerly 4.8)
adds an opt-in feature that stores
browser-encrypted file bytes (key in the URL fragment, never sent to us). It is deliberately
after launch, so none of the below blocks `awaitingLegalReview` — but it is written down now
because it changes sentences the launch review will have already approved.

- [ ] Retention schedule for stored ciphertext: the user picks 24 hours, 7 days or 30 days,
      and we need to state what the hard ceiling is and when deletion actually happens.
- [ ] Abuse policy for a link that can be shared publicly — what we can act on when we
      cannot read the content, and what a takedown request can realistically ask for.
- [ ] The DPA (§8) stops being able to say we hold no file content. The replacement claim
      is stronger but longer: we hold ciphertext we have no key for and cannot decrypt on
      any request, court order included. Confirm that framing survives review.
- [ ] `privacy.md` and the claims pages: the current wording rests on files being unable to
      leave the device. Confirm the revised form — nothing leaves unless the user asks, and
      it is encrypted before it does — with the lawyer **before** the feature ships, since
      the launch-reviewed text will contradict it otherwise.

Device-local retention (Phase 2 item 5) needs none of this: the bytes stay in the browser's
own storage, which is the same category as the OCR model cache already covered in §5.

## 4. Paid plans (terms.md)

- [x] ~~Number of founding lifetime plans offered, and what "lifetime" covers.~~
      **Replaced 30 October 2026 by a defined ten-year term: $120 once, for Pro.** This is
      deliberately easier to draft and to honour than an indefinite promise — please confirm
      the wording for a fixed-term prepaid plan, including what happens if the service ends
      before the term expires (which the next item also covers).
- [ ] Renewal reminder emails for yearly plans, and their timing.
- [ ] Refund policy, aligned with the merchant of record's terms and consumer law, including the EU 14-day withdrawal right for digital services.
- [ ] Remedy if a paid feature is removed, or if we end a paid plan for a reason other than the user's breach.
- [ ] Minimum liability amount, e.g. US$50.
- [ ] Business edition licence terms (separate agreement).
- [ ] Where open-source licence notices are published.

## 5. Cookies and consent (cookies.md)

- [ ] Confirm no consent banner is needed: the site sets no cookies, stores only the theme choice in localStorage, and caches the OCR model in the browser after first use.

## 6. Trademarks and comparison pages

- [ ] Trademark clearance for "LeafLock" (WIPO Global Brand Database, Indian registry classes 9 and 42, US and EU searches), as in the business plan.

      **Pre-work done 30 October 2026, to shorten the lawyer's time — not clearance.**
      Secondary databases only (Justia, Trademarkia, uspto.report), US-only results:
      - **No LEAFLOCK mark found in software.** Nearest: LEAFLOCKER (Reg. 5371121,
        packaging containers), LEAFLOGIX, LEAF TRADE, LEAFPAY, LEAFPON — all different
        second elements or different fields.
      - **`leaflock.com` is a live gutter-guard product** (redirects to
        gutterguardsdirect.com). Building materials and installation services, so expected
        to be coexistence rather than conflict — **please confirm** that reading for
        classes 9 and 42, since it is the basis for keeping the name.
      - **The one question we could not answer: LIFELOCK.** Phonetically and visually close,
        and it operates in identity protection — adjacent to our privacy positioning. This
        is the specific risk we want an opinion on.
      - The name was reviewed twice on 30 October — against ContraPDF, HushPDF, OpaquePDF,
        IntraPDF, ChartaPDF and others, then against AlmostPDF, StormPDF and NordicPDF —
        and every one was dropped: on a live mark in software, on domain availability, on
        meaning in a launch locale, or on a statutory bar (`docs/design.md` §13 records
        each with its reason). **No rename is planned**, so clearance is needed on
        "LeafLock" / "LeafLock PDF" only. Two of those findings may be worth your eye as
        context for the LIFELOCK question, since both show how close is too close in this
        field: **StormPDF** was dropped because Content Guru Limited, which sells software
        called `storm`, filed four TTAB oppositions on 10 June 2026 and two of the four
        targets were `STORM` + a descriptive noun — the same construction as `StormPDF`.
        **NordicPDF** was dropped under **§2(e)(3)**, since our governing law is India and
        "Nordic" would be a material origin claim for a privacy product; we read that as a
        permanent bar post-NAFTA rather than a risk to weigh, and would welcome correction.
      - A contingency shortlist (SorrelPDF, SedgePDF, TansyPDF) was screened on 30 October
        in case the LIFELOCK answer forces a rename. It is **not** a proposal and needs no
        clearance now; `docs/design.md` §13 records it so the work is not redone under
        time pressure.
- [ ] Review `src/content/compare/en/leaflock-vs-ilovepdf.md` and `leaflock-vs-smallpdf.md`: they name competitors' trademarks. Every claim is attributed to the competitor's own page (listed in the page's sources) and was checked on 21 October 2026. No logos are used.
- [ ] Confirm the statement that LeafLock holds no security certification at this time
      (security.md, and claims.md, added 30 October 2026 — it repeats the statement in its
      questionnaire table, so both move together).
- [ ] **claims.md is new and is written to be quoted verbatim** (item 3.5). It is factual
      rather than legal text, but it states what we receive and what we store, so it has to
      agree with privacy.md — and it is the page a buyer is most likely to paste into a
      contract. Worth reading alongside privacy.md in the 6.3 engagement.

## 7. Wording to confirm

- [ ] "Pro tools are free during early access" (pricing page, tool pages). Reworded by item
      4.9 on 30 October 2026: there are two paid tiers now, so the pages say every tool is
      free during early access and the badge names Pro or Practice. Both wordings need
      confirming, and `terms.md` §5's announce-first promise covers both.
- [ ] Business edition described as early access at **US$499/year** (raised from $299 on
      30 October 2026 when the Practice tier was introduced at $249), stepping up to
      **US$750/year** once SSO, a DPA and invoicing ship — decided 28 October 2026, see
      `docs/roadmap.md` Phase 4 (business.md, pricing page).

## 8. Business edition procurement deliverables — added 28 October 2026

Split out of the general security-certification item above because three of the four
things a procurement buyer asks for have no real blocker and should simply be built;
only the fourth is a genuine time/cost constraint. See `docs/roadmap.md` Phase 4 and 6.

- [ ] **DPA (data processing agreement)** — draft and have reviewed. Short by
      construction: we hold no file content and almost no personal data.
- [ ] SSO (SAML/OIDC) for Business accounts — an engineering item, tracked as a Phase 4
      build on the existing auth infrastructure, not a legal one; listed here only so
      procurement copy doesn't promise it before it exists.
- [ ] **Cyber liability and E&O insurance — added 30 October 2026, and nobody had scoped
      it.** Enterprise contracts routinely require minimum coverage, and signing
      indemnities without it is the single most dangerous move available to a one-person
      entity. Needs a **broker**, not a lawyer. It is a Phase 7 precondition
      (`docs/roadmap.md`), so it is not needed before launch — but it must exist before the
      first bespoke deal, and a questionnaire cannot be answered honestly without it.
- [ ] **A pre-drafted MSA** — written once, reused without redlines. The thing that makes
      bespoke enterprise servable by one person. Also Phase 7.
- [ ] PO / net-30 invoicing — confirm both Dodo and Paddle support it before promising
      it in Business edition copy.
- [ ] SOC 2 Type II or ISO 27001 — Phase 6, not before. 6–12 months plus an accredited
      auditor's fee; not shortened by anything built in-house. Our small data
      footprint should narrow the audit scope versus a typical SaaS — worth stating
      once pursued, not a reason to promise it early.
