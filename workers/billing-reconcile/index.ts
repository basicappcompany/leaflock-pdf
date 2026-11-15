/**
 * Cloudflare Worker on a cron schedule: asks the site to re-read paid accounts from Dodo.
 *
 * Dodo is the source of truth for who has paid (docs/design.md section 8) and the site repairs its copy
 * in `/api/billing/reconcile`. That endpoint has to be called every few hours, and GitHub Actions cannot do
 * it: Cloudflare's Bot Fight Mode answers GitHub's servers with a browser challenge, and on the free plan a
 * custom rule cannot skip it. A Worker runs inside Cloudflare, so the call is not treated as outside traffic.
 *
 * It holds the shared token, and the means to send an alert email when a sweep fails. The Dodo key, the product
 * ids and the database stay with the site, so switching to live mode at go-live changes nothing here.
 *
 * A failed sweep is reported two ways: the invocation fails (visible in the Workers dashboard) and an email goes
 * to the owner. The email is sent from here, not from the site, so it still goes out when the site is the thing
 * that is down or when the token is wrong.
 */

interface WorkerEnv {
  /** The same value as the site's RECONCILE_TOKEN secret. */
  RECONCILE_TOKEN: string;
  /** Overridable for tests; defaults to the production site. */
  SITE_URL?: string;
  /** Resend API key, sender and recipient for the failure alert. Without all three no email is sent. */
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  ALERT_EMAIL?: string;
}

export interface SweepResult {
  checked: number;
  corrected: number;
  errors: number;
}

/**
 * Runs one sweep. Throws when the endpoint cannot be reached or any account could not be read, so the
 * invocation shows as failed in the Workers dashboard instead of passing silently.
 */
export async function runSweep(env: WorkerEnv, fetcher: typeof fetch = fetch): Promise<SweepResult> {
  const response = await fetcher(`${env.SITE_URL ?? 'https://leaflockpdf.com'}/api/billing/reconcile`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RECONCILE_TOKEN}`, 'User-Agent': 'leaflock-billing-reconcile-worker/1.0' },
  });
  if (!response.ok) throw new Error(`the reconcile endpoint answered ${response.status}`);

  const result = (await response.json()) as SweepResult;
  console.log(JSON.stringify({ type: 'billing-sweep', ...result }));
  if (result.errors > 0) throw new Error(`${result.errors} account(s) could not be read from Dodo`);
  return result;
}

/**
 * Emails the owner. Never throws: an alert that cannot be sent must not hide the failure it is about, which
 * is rethrown by the caller. The text carries only the reason, never the token or any account detail.
 */
export async function sendAlert(env: WorkerEnv, reason: string, fetcher: typeof fetch = fetch): Promise<void> {
  if (!env.RESEND_API_KEY || !env.EMAIL_FROM || !env.ALERT_EMAIL) {
    console.error('billing sweep failed and no alert email is configured:', reason);
    return;
  }
  try {
    const response = await fetcher('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: env.ALERT_EMAIL,
        subject: 'LeafLock billing sweep failed',
        text: `The scheduled billing sweep failed: ${reason}.

While it keeps failing, a paid account whose webhook was lost is not repaired until that member next loads a page. See docs/design.md section 8 and the Workers dashboard (leaflock-billing-reconcile, Logs).`,
      }),
    });
    if (!response.ok) console.error('billing sweep alert email was refused:', response.status);
  } catch (error) {
    console.error('billing sweep alert email could not be sent:', error instanceof Error ? error.message : error);
  }
}

export default {
  async scheduled(_controller, env): Promise<void> {
    try {
      await runSweep(env);
    } catch (error) {
      await sendAlert(env, error instanceof Error ? error.message : 'unknown error');
      throw error;
    }
  },
} satisfies ExportedHandler<WorkerEnv>;
