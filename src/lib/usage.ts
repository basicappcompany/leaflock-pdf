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
  /** A signed entitlement token, for offline use (src/lib/entitlement.ts): a paid plan's, or a free or anonymous one's allowance for today. */
  token?: string;
  /** The tier this claim authorized, from the server's own registry. The client refuses to run a tool above it. */
  authorizedTier?: ToolTier;
  grantedTier?: ToolTier;
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
/** Offline runs spent from the stored token, recorded as "<token>|<count>" so a fresh token starts at zero. */
const USED_KEY = 'leaflock-offline-used';
/** Offline runs spent on a day when the device holds no usable token, recorded as "<day>|<count>". */
const GRACE_KEY = 'leaflock-offline-grace';

/**
 * Offline runs allowed in a UTC day when the device holds no usable token at all: a first visit that never ran
 * online, a free token from a day ago, or a paid token that has expired. Small on purpose, and counted on the device
 * only, so it is a bound for honest use and not a lock. It is the one defined behaviour for "no token", and it is
 * what keeps free tools working offline for a paid account whose token has expired (docs/design.md).
 */
export const OFFLINE_GRACE_RUNS = 5;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Storage can be blocked; the token is only for offline use, so nothing else depends on it.
  }
}

function storeToken(token: string | undefined): void {
  write(TOKEN_KEY, token ?? null);
  write(USED_KEY, null);
}

/**
 * Signing out must not leave the last account's offline access on the device: a paid token would keep paid tools
 * working offline for up to 48 hours after the person had signed out (or on a shared computer, for the next person).
 */
export function clearOfflineAccess(): void {
  storeToken(undefined);
}

function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

function activeTier(): ToolTier {
  const id = getActiveTool();
  return tools.find((tool) => tool.id === id)?.tier ?? 'free';
}

const TIER_ORDER: Record<ToolTier, number> = { free: 0, pro: 1, practice: 2 };

/** The tier the latest claim authorized, held for the work inside the task that made it. */
let authorized: ToolTier = 'free';

/**
 * Refuses a run of a tool above what the claim authorized: the page claimed one tool's id and is now running another.
 * Called before each operation inside a claimed task. This is client-enforced (a person with developer tools can
 * skip it, see proAccess.ts), but the server has logged the tier it authorized, so the mismatch is visible there too.
 */
export function assertAuthorized(): void {
  if (!enabled()) return;
  if (TIER_ORDER[activeTier()] > TIER_ORDER[authorized]) throw new EntitlementError('upgrade');
}

function todayUtc(now: number = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}

/** Spends one run of a locally kept allowance, or says there is none left. */
function spend(key: string, scope: string, limit: number): boolean {
  const recorded = read(key) ?? '';
  const cut = recorded.lastIndexOf('|');
  const used = cut > 0 && recorded.slice(0, cut) === scope ? Number(recorded.slice(cut + 1)) || 0 : 0;
  if (used >= limit) return false;
  write(key, `${scope}|${used + 1}`);
  return true;
}

/**
 * Offline there is no server to ask, so the device uses what the server last signed.
 *
 * - A paid tool needs a valid, unexpired paid token that reaches its tier. A paid token is not counted.
 * - A free or anonymous token carries the server's remaining allowance for its UTC day. Each offline run spends one;
 *   at zero the run is blocked. The token cannot be edited (the signature fails) and cannot outlive its day, so
 *   offline use across days cannot exceed the daily cap. The next online claim reports what was spent.
 * - With no usable token (none, a day old, or a paid one that expired), up to OFFLINE_GRACE_RUNS runs a day are
 *   allowed, so free tools still work offline, counted on the device only.
 *
 * Nothing is ever granted from the cached plan or a cookie.
 */
async function allowedOffline(tier: ToolTier): Promise<void> {
  const token = read(TOKEN_KEY);
  const claims = await verifyEntitlement(token);

  if (requiresUpgrade(tier, claims?.tier ?? 'anonymous', proToolsGated)) throw new EntitlementError('offline');
  authorized = tier;

  if (claims && claims.tier !== 'free') return;

  if (claims && token && claims.runs !== undefined && claims.day === todayUtc()) {
    if (!spend(USED_KEY, token, claims.runs)) throw new UsageLimitError(claims.plan === 'anonymous' ? 'anonymous' : 'free-account');
    return;
  }

  if (!spend(GRACE_KEY, todayUtc(), OFFLINE_GRACE_RUNS)) throw new UsageLimitError('anonymous');
}

/** What the device spent offline from its stored free token, to settle with the server on the next claim. */
function offlineReport(): { token: string; used: number } | undefined {
  const token = read(TOKEN_KEY);
  const recorded = read(USED_KEY) ?? '';
  const cut = recorded.lastIndexOf('|');
  const used = Number(recorded.slice(cut + 1));
  if (!token || cut <= 0 || recorded.slice(0, cut) !== token || !Number.isInteger(used) || used <= 0) return undefined;
  return { token, used };
}

/**
 * Asks the server whether this run may start, and counts it. The server is the only authority: this never
 * looks at the plan to decide whether to ask, and a run does not start unless it says yes.
 *
 * - Online: the answer must be a 2xx. A 402 means the tool is above the plan; anything else, or no answer,
 *   stops the run rather than letting it through. Every answer carries a fresh token, and the request settles any
 *   runs spent offline from the previous one.
 * - Offline: see allowedOffline.
 */
export async function claimJob(): Promise<void> {
  if (!enabled()) return;

  const tier = activeTier();
  if (isOffline()) return allowedOffline(tier);

  const tool = getActiveTool();
  const offline = offlineReport();
  let response: Response;
  try {
    response = await fetch('/api/usage/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...(tool ? { tool } : {}), ...(offline ? { offline } : {}) }),
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

  // The answer's token replaces the old one and clears what was spent from it; no token removes a stale one.
  storeToken(claim.token);
  authorized = claim.authorizedTier ?? 'free';
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
