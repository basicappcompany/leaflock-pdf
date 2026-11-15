/**
 * A signed, short-lived statement from the server: "this account is on this plan until this time".
 *
 * Why it exists: the server checks every tool run when the browser is online, but the installed offline app
 * has no server to ask. A token lets a paid tool keep working offline for a few days, and only the server can
 * make one. It is signed with Ed25519: the private key lives in a server secret and never ships, the public key
 * below is in the client bundle and can only check a signature, never create one. (An HMAC would put the
 * secret in the bundle, and anyone could then mint their own.)
 *
 * What it is not: a lock on the computation. The paid tools run in the visitor's own browser and their code is
 * in the page, so a determined person can call the bundled operations directly (see proAccess.ts). The token
 * and the server claim make paying the normal, supported way to use them, not the only possible way.
 *
 * Shared by the client (verifies) and the server (signs, in src/lib/server/entitlement.ts), so the format has
 * one definition.
 */

import { ENTITLEMENT_PUBLIC_KEY_SPKI } from './entitlementKey';

export type EntitlementTier = 'free' | 'pro' | 'practice';

export interface EntitlementClaims {
  /** Format version, so a later change cannot be misread by an old client. */
  v: 1;
  /** The account the token was issued to. Opaque; never an email. */
  sub: string;
  plan: string;
  /** The highest tool tier the plan reaches. */
  tier: EntitlementTier;
  /** Expiry, milliseconds since the epoch. */
  exp: number;
}

const TIERS: readonly string[] = ['free', 'pro', 'practice'];

export function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  return fromBase64Url(value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''));
}

/** Imports an Ed25519 public key given as base64 SPKI. */
export function importPublicKey(spkiBase64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('spki', fromBase64(spkiBase64), { name: 'Ed25519' }, false, ['verify']);
}

/**
 * Checks a token's signature and expiry. Returns its claims, or null for anything wrong: malformed, bad
 * signature, expired, unknown format, or a browser that cannot verify Ed25519 (which then simply gets no
 * offline access, never a wrong grant).
 */
export async function verifyEntitlement(
  token: string | null | undefined,
  publicKey: string | CryptoKey = ENTITLEMENT_PUBLIC_KEY_SPKI,
  now: number = Date.now(),
): Promise<EntitlementClaims | null> {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts as [string, string];
  try {
    const key = typeof publicKey === 'string' ? await importPublicKey(publicKey) : publicKey;
    const valid = await crypto.subtle.verify({ name: 'Ed25519' }, key, fromBase64Url(signature), new TextEncoder().encode(payload));
    if (!valid) return null;

    const claims = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as Partial<EntitlementClaims>;
    if (claims.v !== 1 || typeof claims.sub !== 'string' || typeof claims.plan !== 'string') return null;
    if (typeof claims.tier !== 'string' || !TIERS.includes(claims.tier)) return null;
    if (typeof claims.exp !== 'number' || claims.exp <= now) return null;
    return claims as EntitlementClaims;
  } catch {
    return null;
  }
}
