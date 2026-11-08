# Legal review brief — LeafLock PDF

**This is the document to send.** `docs/legal-checklist.md` is the authoritative list of open
items and is not repeated here; this brief gives a reviewer the context that list assumes,
separates the questions only the owner can answer from the ones that need a lawyer, and
states the ask. Prepared 30 October 2026 for roadmap item 6.3.

One planning note for the owner: 6.3 is the **critical path to launch**, budgeted at ~21
days, and it is the only remaining item that moves the launch date. Sections 1 and 2 below
are what make the difference between a lawyer starting and a lawyer asking for more
information.

---

## 1. The ask

Four deliverables, in priority order:

1. **Finalise three pages** — `privacy.md`, `terms.md`, `cookies.md`. They are complete
   drafts with **30 marked blanks** (`[TO CONFIRM: …]`), not outlines.
2. **Confirm the trademark position** on "LeafLock" / "LeafLock PDF" — checklist §6, which
   carries our own preliminary search and the one question we could not answer.
3. **Confirm the comparison pages are safe to publish** — they name competitors' marks and
   quote their published prices. Checklist §6.
4. **Draft a DPA** — needed for paid professional customers, not for launch, but **please
   quote it with this engagement rather than separately.** It is short by construction (see
   §3) and is designed for **click-through acceptance at signup**, not per-customer
   negotiation. Checklist §8.
5. **Draft a Business licence agreement** — for the self-hosted edition. Same reasoning:
   one standard document, accepted as-is, no redlines. `src/content/pages/en/business.md`
   describes the product and states honestly what it does not yet include.

**Why 4 and 5 are bundled here rather than requested later.** The business model is
deliberately **self-serve only**: every paid tier must work without a human in the loop, so
these two documents are accepted by checkbox by every customer rather than negotiated with
any of them. Commissioned now they are marginal additions to a review already underway;
commissioned in three months they are a fresh engagement with a fresh minimum fee. If a
fixed quote is easier, treat them as two standard-form documents rather than bespoke
drafting.

Not in scope: SOC 2 / ISO certification (deferred, roadmap Phase 6), a master services
agreement for negotiated enterprise deals (deferred to roadmap Phase 7, with insurance), and
the future server-retention feature in §4 below.

## 2. Four answers still needed from the owner before a lawyer starts (six were listed; #5 and #6 resolved 3 November 2026)

These are inputs, not legal questions — nobody can draft around them. They are the real
reason 6.3 has not begun.

| # | Needed | Appears in |
| --- | --- | --- |
| 1 | Legal entity name and registered address | privacy.md, terms.md |
| 2 | Governing law — India, which state — and courts (city, state) | terms.md |
| 3 | Whether a DPDP Act 2023 grievance officer is required, and their name and contact | privacy.md |
| 4 | Minimum user age, and the approach to DPDP verifiable parental consent | privacy.md |
| 5 | ~~Hosting provider confirmed~~ — **Cloudflare**, named 3 Nov. Still open: whether it sets cookies of its own (`docs/legal-checklist.md` §2) | privacy.md, cookies.md |
| 6 | ~~Email provider~~ — **Resend**, named 3 Nov | privacy.md |

**#6 was resolved on 3 November 2026:** Resend is the sending provider and is named in
`privacy.md`; the domain is verified there. What remains is not a question for the lawyer:
Resend only *sends*, so receiving at `hello@` needed a forwarder: **Cloudflare Email Routing to a
Gmail mailbox, set up 9 November 2026 and named in `privacy.md`** (`docs/TODO.md` §0).

## 3. The fact the whole review turns on

**We hold no file content, and this is verifiable rather than promised.** Every document
operation runs in the visitor's own browser. The site ships a Content-Security-Policy with
`connect-src 'self'`, which the **browser** enforces — a reviewer can confirm it in DevTools
on any page, and no file data can be sent anywhere even if our code tried.

What we do store — the database has exactly six tables, and this is all of them
(`migrations/`):

| Table | Contents |
| --- | --- |
| `users` | email address, plan, created and last-login timestamps |
| `magic_links` | a **hash** of a sign-in token, with expiry and consumed-at |
| `sessions` | a **hash** of the session secret, a **salted one-way hash of the IP** (`SESSION_IP_SALT`), timestamps, and the browser **family and major version only** — e.g. "Chrome 141", deliberately too coarse to fingerprint |
| `usage_counters` | per account, per UTC day: **a number**. No file name, size, page count or type is attached to it |
| `rate_limits` | the same count for visitors with **no account**, keyed by the salted IP hash |
| `webhook_events` | that a payment webhook arrived: an id, a type, a timestamp, a status |

Three clarifications a reviewer will want:

- **Visitors without an account give us no email and no identity** — they appear only as a
  salted, non-reversible IP hash in `rate_limits`, which exists solely to meter the free
  daily allowance. The hashes are never logged raw.
- **We hold no card data, no billing addresses and no invoices.** Payment processing and
  records sit with the merchant of record (§4). On our side a paid customer is a `plan`
  value on their row, plus webhook metadata.
- **Crash reports** are scrubbed before sending: no IP address, no file names, no page text,
  no user input. Only genuine software faults, never user-side problems like a locked file.

Shipped 30 October 2026 and worth stating plainly: visitors can now **keep a finished file
on their own device** for 5 minutes, 1 hour or 24 hours, opt-in per file. Those bytes are
stored in the visitor's own browser storage and are **never transmitted to us** — the same
category as a browser cache, and no change to anything above.

Two consequences a reviewer should find useful: the **DPA is short by construction**, and
data-subject access, erasure and portability requests are close to trivial, because there is
almost nothing to produce.

## 4. Four things that make this engagement unusual

1. **Two merchants of record, by region** — Dodo Payments for customers in India, Paddle for
   everywhere else (decided 28 October 2026). This **doubles** the provider review: both must
   be named in `privacy.md` and `terms.md`, and each needs its own international-transfer
   basis and its own refund and withdrawal terms. Checklist §2 covers it.
2. **A planned feature will later store encrypted file bytes** — roadmap item 2.12, after
   launch and only if demand justifies it. The browser encrypts before anything is sent and
   the key lives in the URL fragment, so we would hold ciphertext we have no key for. **It is
   not in scope now.** It is flagged because the wording chosen today should not have to be
   rewritten later: the durable phrasing is *nothing leaves your device unless you ask it
   to*, rather than *nothing can leave your device*. Checklist §3.
3. **The comparison pages name competitors** (iLovePDF, Smallpdf) and quote their published
   prices. Every claim is attributed to the competitor's own page, sources are listed on each
   page, figures were checked 21 October 2026, and no logos are used.
4. **We claim no security certification**, and say so explicitly. Checklist §6 asks for that
   statement to be confirmed as adequate.

## 5. The documents

Under review — all three show a visible "draft" notice to visitors until cleared:

| Page | Words | Blanks |
| --- | --- | --- |
| `src/content/pages/en/privacy.md` | 1,668 | 16 |
| `src/content/pages/en/terms.md` | 1,535 | 12 |
| `src/content/pages/en/cookies.md` | 647 | 2 |

Supporting context, not under review but quoted by the above: `security.md` (1,665 words),
`help.md` (1,012), `business.md` (633), `about.md` (539), `contact.md` (355).

English is the only language, and **the English text governs** — a decision recorded in
roadmap Phase 5 specifically to avoid a second reviewable text per locale.

## 6. Returning the work

Each page is Markdown with a short YAML header. A page is cleared by replacing its
`[TO CONFIRM: …]` markers and setting `awaitingLegalReview: false` in that header, which
removes the draft notice. Marked-up text in any format is fine — the owner will apply it.

Open items stay tracked in `docs/legal-checklist.md`; this brief is not updated as they
close.
