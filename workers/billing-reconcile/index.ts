/**
 * Cloudflare Worker on a cron schedule: asks the site to re-read paid accounts from Dodo.
 *
 * Dodo is the source of truth for who has paid (docs/design.md section 8) and the site repairs its copy
 * in `/api/billing/reconcile`. That endpoint has to be called every few hours, and GitHub Actions cannot do
 * it: Cloudflare's Bot Fight Mode answers GitHub's servers with a browser challenge, and on the free plan a
 * custom rule cannot skip it. A Worker runs inside Cloudflare, so the call is not treated as outside traffic.
 *
 * It holds only the shared token. The Dodo key, the product ids and the database stay with the site, so
 * switching to live mode at go-live changes nothing here.
 */

interface WorkerEnv {
  /** The same value as the site's RECONCILE_TOKEN secret. */
  RECONCILE_TOKEN: string;
  /** Overridable for tests; defaults to the production site. */
  SITE_URL?: string;
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

export default {
  async scheduled(_controller, env): Promise<void> {
    await runSweep(env);
  },
} satisfies ExportedHandler<WorkerEnv>;
