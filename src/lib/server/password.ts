/**
 * Password hashing with PBKDF2-HMAC-SHA256, which WebCrypto implements natively so the
 * work happens in the runtime rather than in JavaScript.
 *
 * A deliberate note on cost: hashing is meant to be slow, and slow costs CPU time.
 * Cloudflare's free plan allows about 10ms of CPU per request, which this exceeds, so
 * password login needs the paid Workers plan. The magic link has no such cost, which is
 * why it stays the default way in.
 */

/** OWASP's recommendation for PBKDF2-HMAC-SHA256. Raise it over time, never lower it. */
const ITERATIONS = 210_000;
const SALT_BYTES = 16;
const KEY_BITS = 256;

/** Rejects passwords that are trivially weak. Length is the only rule worth enforcing. */
export const MIN_PASSWORD_LENGTH = 10;
export const MAX_PASSWORD_LENGTH = 200;

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, KEY_BITS);
  return toBase64(new Uint8Array(bits));
}

/** Hashes a password for storage. The result carries its own salt and cost. */
export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(new ArrayBuffer(SALT_BYTES));
  crypto.getRandomValues(salt);
  const hash = await derive(password, salt, ITERATIONS);
  return `pbkdf2$${ITERATIONS}$${toBase64(salt)}$${hash}`;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

let decoyHash: Promise<string> | undefined;

/** Checks a password against a stored hash, at whatever cost that hash was made with.
 *
 * With no stored hash it still does a full derivation against a decoy and returns false, so
 * "no such account" takes as long as "wrong password" and response time can't be used to
 * discover which addresses have an account. */
export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) {
    decoyHash ??= hashPassword('decoy-for-constant-work');
    const [, iterations, salt] = (await decoyHash).split('$');
    await derive(password, fromBase64(salt!), Number(iterations));
    return false;
  }
  const [scheme, iterations, salt, hash] = stored.split('$');
  if (scheme !== 'pbkdf2' || !iterations || !salt || !hash) return false;
  const rounds = Number(iterations);
  if (!Number.isInteger(rounds) || rounds < 1) return false;
  return timingSafeEqual(await derive(password, fromBase64(salt), rounds), hash);
}
