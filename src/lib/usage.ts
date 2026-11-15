import { tools } from '../tools/registry';
import { verifyEntitlement } from './entitlement';
import { proToolsGated } from './pricing';
import { requiresUpgrade, type ToolTier } from './proAccess';
import { getActiveTool } from './recentActivity';

export type UsageLimitReason = 'anonymous' | 'free-account';

interface ClaimResponse {
  allowed: boolean;
  remaining: number | null;
  reason?: UsageLimitReason;
  /** A signed entitlement token for a paid account, for offline use (src/lib/entitlement.ts). */
  token?: string;
}

/** Thrown by runPdfJob when the free tier's daily allowance is already used up. Not a
 * bug, so it is never sent to /api/errors: it's handled in useTask.ts before that. */
export class UsageLimitError extends Error {
  readonly reason: UsageLimitReason;

  constructor(reason: UsageLimitReason) {
    super(`daily job allowance reached: ${reason}`);
    this.name = 'UsageLimitError';
    this.reason = reason;
  }
}

/**
 * The server says this tool is above the account's plan (402), or the browser is offline and holds no valid,
 * unexpired entitlement token for it. Not a bug, so never reported.
 */
export class EntitlementError extends Error {
  readonly reason: 'upgrade' | 'offline';

  constructor(reason: 'upgrade' | 'offline') {
    super(`not entitled to run this tool: ${reason}`);
    this.name = 'EntitlementError';
    this.reason = reason;
  }
}

/** The server could not be reached or did not answer 2xx while the browser is online. A run does not start
 * without the server's yes, so this stops it. Not a bug in our code, so never reported. */
export class ClaimUnavailableError extends Error {
  constructor() {
    super('the usage check could not be completed');
    this.name = 'ClaimUnavailableError';
  }
}

function enabled(): boolean {
  // Off in builds made with PUBLIC_USAGE_LIMITS=off, which is how the self-hosted
  // Business edition is built: it runs on networks with no internet access at all,
  // where even a failing request would make every job wait for a connection timeout.
  // That edition is an honor-system build by design (docs/self-hosting.md).
  return import.meta.env.PUBLIC_USAGE_LIMITS !== 'off';
}

const TOKEN_KEY = 'leaflock-entitlement';

function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string | undefined): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be blocked; the token is only for offline use, so nothing else depends on it.
  }
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function activeTier(): ToolTier {
  const id = getActiveTool();
  return tools.find((tool) => tool.id === id)?.tier ?? 'free';
}

/**
 * Offline there is no server to ask, so a paid tool needs a token the server signed and that has not expired.
 * A free tool always works offline. Nothing is ever granted from the cached plan or a cookie.
 */
async function allowedOffline(tier: ToolTier): Promise<void> {
  if (!requiresUpgrade(tier, 'anonymous', proToolsGated)) return;
  const claims = await verifyEntitlement(readToken());
  if (!claims || requiresUpgrade(tier, claims.tier, proToolsGated)) throw new EntitlementError('offline');
}

/**
 * Asks the server whether this run may start, and counts it. The server is the only authority: this never
 * looks at the plan to decide whether to ask, and a run does not start unless it says yes.
 *
 * - Online: the answer must be a 2xx. A 402 means the tool is above the plan; anything else, or no answer,
 *   stops the run rather than letting it through. A paid account's answer carries a fresh token.
 * - Offline: free tools run; paid tools need a valid unexpired token.
 */
export async function claimJob(): Promise<void> {
  if (!enabled()) return;

  const tier = activeTier();
  if (isOffline()) return allowedOffline(tier);

  const tool = getActiveTool();
  let response: Response;
  try {
    response = await fetch('/api/usage/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tool ? { tool } : {}),
    });
  } catch {
    // The connection dropped between the check above and the request: that is offline too.
    if (isOffline()) return allowedOffline(tier);
    throw new ClaimUnavailableError();
  }

  if (response.status === 402) {
    storeToken(undefined);
    throw new EntitlementError('upgrade');
  }
  if (!response.ok) throw new ClaimUnavailableError();

  let claim: ClaimResponse;
  try {
    claim = (await response.json()) as ClaimResponse;
  } catch {
    throw new ClaimUnavailableError();
  }

  // A paid answer refreshes the offline token; anything else removes a stale one, so a lapsed plan loses it.
  storeToken(claim.token);
  if (!claim.allowed) throw new UsageLimitError(claim.reason ?? 'anonymous');
}

/** How many tasks currently hold a claim, so the work inside them is not counted again. */
let held = 0;

/** Whether the work now running is inside a task that already made its claim. */
export function holdingClaim(): boolean {
  return held > 0;
}

/**
 * Runs one tool task. The claim is made first and the work does not start without it; operations the work
 * calls (runPdfJob, runBatch) see that a claim is held and do not ask again, so a task counts once however
 * many operations it uses.
 */
export async function withClaim<T>(work: () => Promise<T>): Promise<T> {
  await claimJob();
  held += 1;
  try {
    return await work();
  } finally {
    held -= 1;
  }
}
