# Fill-in sheet: the 24 `[TO CONFIRM]` lines

Written 22 November 2026. **Answer these and the pages can lose their draft notice.** Nothing here is filled in, because
each blank is a fact only the owner has, or a policy only the owner (with a lawyer) can set. The wording around each
one is already drafted.

`grep -c "TO CONFIRM" src/content/pages/en/*.md` counts lines: privacy 11, terms 10, cookies 3. A line can hold more
than one blank. Several lines take the same answer, so there are 21 decisions for the 24 lines.

When you reply, quote the ids (P3, T5 ...). I will replace the blanks and run `pnpm test`. The pages keep their draft
notice (`awaitingLegalReview`) until you say a lawyer has read them. `docs/legal-brief.md` is what goes to the lawyer.

## 1. One answer, four lines: who you are

| Ids | Blank |
|---|---|
| P1, P11, T1, T10 | **Legal entity name** and **registered address**. Also used for the contact lines at the end of both pages |

## 2. Law and courts

| Id | Blank | What to give |
|---|---|---|
| T9 | Governing law (`India, state`) and courts (`city and state`) | e.g. India and the state; the city whose courts hear disputes |

## 3. How long you keep things (privacy.md)

These are your choices. The draft already says "no longer than" or similar; it needs the number.

| Id | Retention of | Note |
|---|---|---|
| P2 | Server logs at the hosting provider | The provider's own period |
| P3 | Sign-in history | Currently "until you delete your account"; say if it should expire instead |
| P4 | Messages sent through the contact or feedback form | e.g. 12 months |
| P5 | Emails you receive | A period "in case of follow-up questions" |
| P6 | Payment records | Whatever tax and accounting law requires where you are |
| P7 | Crash reports | e.g. 90 days |

## 4. Providers and people (privacy.md)

| Id | Blank | What is needed |
|---|---|---|
| P8 | Transfer mechanism used by each provider | Adequacy decision or Standard Contractual Clauses, for Cloudflare, Resend, Dodo and Paddle. Resend's and Paddle's are researched in `docs/legal-checklist.md` §2; Dodo's was not checked |
| P9 | Minimum age, and how you handle verifiable parental consent under India's DPDP Act 2023 | The age you set and the approach |
| P10 | Grievance officer | Whether the DPDP Act requires one for you; if so a name and contact |

## 5. Terms and money (terms.md)

| Id | Blank | What is needed |
|---|---|---|
| T2 | Business edition licence terms | The separate agreement, or a line saying it is by contract |
| T3 | How many ten-year plans are offered | The cap behind "limited" on the pricing page |
| T4 | Renewal reminder emails for yearly plans | Whether you send them, and how long before renewal |
| T5 | Refund policy | Aligned with Dodo's terms and consumer law, including the EU 14-day withdrawal right for digital services. Dodo's refunds are discretionary with a 60-day request window; Paddle follows the EU right. Both are researched in the checklist |
| T6 | Remedy if a significant Pro feature is removed | e.g. a pro-rata refund |
| T7 | Minimum liability amount | The floor in "the greater of what you paid in 12 months, or ...", e.g. US$50 |
| T8 | Remedy if you end a paid plan other than for breach | e.g. a pro-rata refund |

## 6. Cookies (cookies.md)

| Id | Blank | What is needed |
|---|---|---|
| C1 | Whether the skin-choice cookie needs consent under the ePrivacy Directive, especially the year-long case for signed-in Pro and Practice members | A lawyer's reading. The cookie only gives back the choice you made and is not used to track |
| C2 | That Cloudflare sets no cookies of its own on your account | Check the bot-protection and similar settings in the Cloudflare dashboard. Cloudflare's documentation says it sets none unless a bot feature is switched on |
| C3 | That this storage is exempt from consent under the ePrivacy Directive and other applicable law | A lawyer's reading |

## 7. One decision that is not a blank but changes what the pages say

| | Decision |
|---|---|
| Paddle | The policy pages already name Paddle as the seller outside India, but only Dodo is wired in the code. Either wire Paddle (roadmap 4.3, about 3 to 5 days, after launch) or reword the pages to say Dodo only until then. Until one of those happens, the pages promise something the product does not do |

## After you answer

1. I fill the blanks and run `pnpm test` (the claims tests read these pages).
2. The pages keep their draft notice until you tell me a lawyer has reviewed them.
3. `docs/launch-listings.md` can then be posted, since every listing links to these pages.
