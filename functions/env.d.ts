/// <reference types="@cloudflare/workers-types" />

/** Bindings and secrets available to every Cloudflare Pages Function (see wrangler.toml). */
interface Env {
  DB: D1Database;
  /** Resend API key. Omitted in dev/CI, where src/lib/email/consoleSender.ts is used instead. */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
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

  /** Google sign-in. Without these the button is hidden and the route redirects back. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}
