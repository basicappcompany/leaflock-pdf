import { consumeMagicLink, insertMagicLink } from './db';

/** How long a magic link stays valid before it must be requested again. [TO CONFIRM: owner] */
export const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Creates a magic link for `email`; returns the raw token to embed in the emailed URL. */
export async function createMagicLink(
  db: D1Database,
  email: string,
  requestIpHash: string | null,
  now = Date.now(),
): Promise<string> {
  const token = randomToken();
  await insertMagicLink(db, {
    email,
    tokenHash: await sha256Hex(token),
    now,
    expiresAt: now + MAGIC_LINK_TTL_MS,
    requestIpHash,
  });
  return token;
}

/** Consumes a raw token from the verify link. Returns the email it was issued for, or null if invalid, expired or already used. */
export async function verifyMagicLink(db: D1Database, rawToken: string, now = Date.now()): Promise<string | null> {
  const row = await consumeMagicLink(db, await sha256Hex(rawToken), now);
  return row?.email ?? null;
}
