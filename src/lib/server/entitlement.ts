/**
 * Signs the entitlement token (src/lib/entitlement.ts). Server only: it reads the private key.
 */

import { toBase64Url, type EntitlementClaims, type EntitlementTier } from '../entitlement';
import type { UserRow } from './db';

/** How long a token is good for. Each successful online run issues a fresh one, so this is the offline window. */
export const ENTITLEMENT_TTL_MS = 48 * 60 * 60 * 1000;

/** The token subject for an anonymous visitor, who has no account. */
export const ANONYMOUS_SUB = 'anonymous';

function endOfUtcDay(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
}

/** The highest tool tier an account's plan reaches. Mirrors PLAN_RANK in src/lib/proAccess.ts. */
export function tierForPlan(plan: UserRow['plan']): EntitlementTier {
  if (plan === 'practice' || plan === 'business') return 'practice';
  if (plan === 'pro' || plan === 'lifetime') return 'pro';
  return 'free';
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/**
 * A token for this account and plan, or null when no key is configured or signing fails. Never throws: a
 * missing token only costs offline use, and must never stop an online run.
 */
export async function signEntitlement(
  env: Env,
  userId: string,
  plan: UserRow['plan'] | 'anonymous',
  now: number = Date.now(),
  /** A free or anonymous token: what is left of today's allowance. Required for them, ignored for a paid plan. */
  allowance?: { day: string; runs: number },
): Promise<string | null> {
  const tier = plan === 'anonymous' ? 'free' : tierForPlan(plan);
  if (!env.ENTITLEMENT_PRIVATE_KEY) return null;
  if (tier === 'free' && !allowance) return null;
  try {
    const claims: EntitlementClaims =
      tier === 'free' && allowance
        ? { v: 1, sub: userId, plan, tier, exp: Math.min(now + 24 * 60 * 60 * 1000, endOfUtcDay(now)), day: allowance.day, runs: Math.max(0, Math.floor(allowance.runs)) }
        : { v: 1, sub: userId, plan, tier, exp: now + ENTITLEMENT_TTL_MS };
    const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(claims)));
    const key = await crypto.subtle.importKey('pkcs8', fromBase64(env.ENTITLEMENT_PRIVATE_KEY.trim()), { name: 'Ed25519' }, false, ['sign']);
    const signature = await crypto.subtle.sign({ name: 'Ed25519' }, key, new TextEncoder().encode(payload));
    return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
  } catch (error) {
    console.error('entitlement signing failed', error instanceof Error ? error.message : error);
    return null;
  }
}
