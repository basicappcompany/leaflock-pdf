/// <reference types="@cloudflare/workers-types" />

/** Bindings and secrets available to every Cloudflare Pages Function (see wrangler.toml). */
interface Env {
  DB: D1Database;
  /** Resend API key. Omitted in dev/CI, where src/lib/email/consoleSender.ts is used instead. */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  /** Where to send a short notice for each feature request or piece of feedback. Optional: without it
   * messages are still stored in the `feedback` table and read from there. [TO CONFIRM: owner] */
  FEEDBACK_NOTIFY_EMAIL?: string;
  /** Server-only salt for hashing requester IPs before they're ever stored (never the raw address).
   * [TO CONFIRM: owner] Set via `wrangler pages secret put SESSION_IP_SALT`. */
  SESSION_IP_SALT: string;

  /** Dodo Payments, the merchant of record for paid plans (terms.md §5).
   * Without these, checkout answers 503 and nothing can be bought. */
  DODO_API_KEY?: string;
  DODO_WEBHOOK_SECRET?: string;
  /** "live" uses live.dodopayments.com; anything else stays on the test host. */
  DODO_MODE?: string;
  DODO_PRODUCT_PRO_MONTHLY?: string;
  DODO_PRODUCT_PRO_YEARLY?: string;
  /** The ten-year Pro term. Named LIFETIME because the stored plan value still is. */
  DODO_PRODUCT_LIFETIME?: string;
  DODO_PRODUCT_PRACTICE_YEARLY?: string;
  /** The launch-offer versions of the two yearly products (src/lib/server/billing.ts `checkoutFor`):
   * the same recurring price, with the discounted price as the trial amount. Needed until 31 Dec 2026. */
  DODO_PRODUCT_PRO_YEARLY_LAUNCH?: string;
  DODO_PRODUCT_PRACTICE_YEARLY_LAUNCH?: string;
  /** The Dodo discount code (25% off, the ten-year product only) pre-applied during the launch offer. */
  DODO_DISCOUNT_TEN_YEAR?: string;

  /** Google sign-in. Without these the button is hidden and the route redirects back. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}
