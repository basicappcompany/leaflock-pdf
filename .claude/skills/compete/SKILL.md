---
name: compete
description: Run a competitive review of LeafLock PDF against the PDF-tools market and publish it as an artifact. Scores feature parity AND revenue mechanics (pricing architecture, paywall design, conversion gating, commercial-search intent, procurement readiness), then slots each recommendation into a roadmap phase. Use when asked to compare competitors, re-check the market, review pricing or positioning against rivals, or when a scheduled checkpoint in docs/roadmap.md comes due.
---

<!-- Parameter log: 28/28 parameters from the 28 Oct 2026 review cycle are present
     below (8 product/demand, 13 revenue mechanics, 7 discovery/trust). Bump this line
     whenever a review surfaces a parameter worth asking every time, so the next run
     starts complete instead of rediscovering it. -->

# Competitive review

Produce a decision document, not a feature table. The test for every line: **would a
different answer here change what we build, charge, or say next?** If not, cut it.

## Scope control

Default to a **full sweep**. Narrow when the caller names a dimension ("just pricing",
"only the tool gap") — a narrow sweep is faster and the three scheduled checkpoints in
`docs/roadmap.md` each have their own scope.

Ask the caller for nothing. If a parameter can't be sourced, mark it `unknown` and move
on; a gap honestly marked is worth more than a guess.

## Who to measure against

| Tier | Who | Why they're in |
| --- | --- | --- |
| Volume incumbents | iLovePDF, Smallpdf, Adobe online | The traffic and the pricing anchors |
| Feature benchmarks | Sejda, PDF24 | Deepest tool catalogues; where the gap list comes from |
| Direct positioning rivals | ihatepdf.cv, and any new client-side entrant | They make our own claim; watch trajectory, not just current state |
| Business-edition rival | Stirling-PDF | Open-core, ~95k stars, its own enterprise tier |

Always check for **new client-side entrants** — that's the category that can take our
positioning. A search for recent "client-side PDF", "browser-based PDF no upload",
"WASM PDF tools" results is part of every full sweep.

## Parameters

Two halves. The first is table stakes; the second is where revenue is actually decided
and is the half most competitive reviews skip.

### A. Product and demand

1. **Tool coverage** — count, but treat count as a vanity metric. What matters is which
   of the top-ten-by-volume queries each player serves, and at what depth.
2. **Depth on head terms** — the checkable axes competitors win on: bookmark and metadata
   preservation, annotation and form-field survival, OCR language count, compression
   ratio, max file size, batch size.
3. **Search demand** — monthly volume per tool keyword. Drives *traffic* ordering.
4. **Commercial intent per keyword** — separate from volume, and more important for
   revenue. Professional terms (Bates numbering, redaction, PDF/A, compare, extract
   tables) are low-volume and high-willingness-to-pay; the head conversions
   (PDF → Word) are enormous and mostly free-intent. **Rank these two orderings
   separately and say which one each recommendation serves.**
5. **Processing model** — server, customer's server, or on device. Our only structural
   moat, and only when provable.
6. **Offline and install** — and whether they charge for it (most sell a desktop app).
7. **Locales** — count, and which.
8. **Platform surfaces** — web, desktop, mobile, extension, API, integrations.

### B. Revenue mechanics

9. **Revenue model mix** — subscription vs ads vs enterprise. Record what share comes
   from ads: that is the line our CSP forbids us ever to have, so it sets how much
   harder our subscription has to work per visit.
10. **Cost structure and break-even** — headcount and infrastructure. A competitor
    needing $20–40M/yr to pay 70+ staff and serve 16M documents/day is not solving our
    problem; our break-even is orders of magnitude lower, which changes what "winning on
    revenue" even means. Always state both sides of this.
11. **Revenue per 1,000 visits** — the metric that decides whether the lever is more
    traffic or better conversion. Derive it where revenue and traffic are both known,
    and mark it as derived.
12. **Pricing architecture** — not just the price. Annual discount depth, lifetime
    offers, seat minimums, per-seat vs flat, upgrade and downgrade paths.
13. **Regional / PPP pricing** — whether they price in local currency at local levels.
    A competitor quoting ₹500/mo in India is running purchasing-power pricing; a
    USD-only price sheet forfeits revenue in exactly the geographies where PDF search
    volume is highest.
14. **Free-tier gating strategy** — and this one has a counter-intuitive answer worth
    carrying into every review: **usage limits convert better than feature limits**, and
    narrowly-gated product-led free tiers convert at 5–15% against 1–4% for broad
    freemium. So removing a usage cap to look generous can cost real revenue. The
    question is never "cap or no cap" but "is the cap placed where it bites buyers
    rather than casual users".
15. **Paywall trigger design** — *where* the upgrade prompt fires. Hitting a limit
    mid-task is the highest-intent moment in the product; count how many such surfaces
    each competitor has, and how many we have.
16. **Trial terms** — length, and whether a card is required up front.
17. **Payment friction** — merchant of record, local payment methods (UPI, Pix, iDEAL),
    refund and withdrawal terms, invoicing.
18. **Expansion revenue** — teams and seats, API, enterprise, white-label. Where the
    revenue per account grows without new acquisition.
19. **Procurement readiness** — SOC 2 / ISO 27001, DPA, SSO, PO and net-30 invoicing,
    security questionnaire answers. This gates B2B deals regardless of product quality,
    and absence of it is a revenue ceiling, not a cosmetic gap.
20. **Churn and LTV levers** — monthly/annual mix, renewal reminders, lifetime-plan
    cannibalisation (cash now against recurring forever).
21. **Referral and affiliate programmes** — a distribution channel that pays only on
    conversion.

### C. Discovery and trust

22. **Technical SEO** — rendering model, structured data, Core Web Vitals, `llms.txt`.
23. **AI-answer presence** — LLM-mention rank and whether assistants cite them. A newer
    surface than SERPs and currently cheaper to win.
24. **Backlink and directory surface** — Capterra, G2, AlternativeTo, DEV, devhunt,
    Product Hunt. Cheap, and it feeds both SERPs and AI answers.
25. **Page and domain age** — the one ranking input that cannot be bought later.
26. **Trust proof** — certifications they hold and we don't, and what we substitute.
    Ours has to be demonstrability (`connect-src 'self'`, a live network panel), because
    a badge claims and a demo proves.
27. **Brand and visual register** — the category convention and our deliberate distance
    from it.
28. **Retention surface** — every mechanism creating a return visit. Note which ones our
    non-negotiables forbid, and never recommend those.

## Sourcing discipline

This project's comparison pages are public factual claims about named trademarks, and
`docs/legal-checklist.md` §6 governs them. Carry the same standard into the review:

- **Prefer the competitor's own pages** for prices, limits, tool lists and retention
  terms. Review aggregators are a fallback, and must be labelled as such.
- **Traffic and revenue figures are third-party estimates that disagree** — often by
  25% or more, sometimes by 40×. Give a range, name it an estimate, never state one as
  fact.
- **Date every figure.** Anything written into `src/content/compare/` needs a
  `checkedOn` date, which is rendered publicly *and* fed to the sitemap as `lastmod`.
- **Mark derived numbers as derived** (revenue per visit, PPP comparisons, conversions).
- When a competitor's own claims contradict each other, that contradiction is a finding.

## Output

Two things, in this order.

**1. An artifact.** Follow the `artifact-design` skill. Use the project's own palette
from `src/styles/global.css` so it reads as part of the project. Shape:

- A standing verdict per dimension — leading / at parity / behind / exposed.
- The findings that **change a plan**, stated first and separated from the rest. A review
  that confirms the plan should say so briefly rather than padding.
- The landscape table, with an honest caveat line about estimate quality.
- The two orderings — by volume, by commercial intent — kept visibly separate.
- Ranked moves, each naming the roadmap phase it belongs to and what it touches in the
  repo.
- A footer stating which figures are soft and why.

Publish it; don't leave it in scrollback. Then summarise in the terminal: the findings
that change a decision, and the decisions that are the owner's to make.

**2. Phase placement.** Every recommendation gets a phase in `docs/roadmap.md`. Edit the
doc as part of the review — that file describes the present tense and is meant to change.
Record *why* the placement changed, with a date, so a later reader sees the reasoning and
not just the result. Put code-level stubs and owner decisions in `docs/TODO.md`, legal
items in `docs/legal-checklist.md`.

Do not commit. Report what changed and let the owner commit.

## Guardrails

- **Never recommend anything the non-negotiables forbid**, however well it works for a
  competitor: no ads, no third-party analytics or error tracking, no server-side
  per-job processing, no AI feature that sends page text anywhere, no AGPL/GPL
  dependency, no loosened CSP directive. If a competitor's revenue depends on one of
  these, say so plainly and price the forfeit — it is a real cost and should be visible.
- **Don't recommend retention mechanics built on holding user data.** Stored files,
  synced signatures and document history are forbidden here by design, and the refusal
  is the product.
- **Separate "we are behind" from "we declined this".** `docs/roadmap.md` already
  declines AI document features and Office-at-parity for stated reasons; a review that
  re-litigates a settled decision wastes the reader's time. Re-open one only with new
  evidence, and say what the new evidence is.
