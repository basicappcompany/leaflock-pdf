import { effectivePlan } from './billing';
import { createSession as insertSession, deleteSession as removeSession, getSession, getUserById, touchSession } from './db';

export const SESSION_COOKIE_NAME = '__Host-leaflock_session';
/** Non-HttpOnly companion cookie, readable by src/components/ui/useSession.ts (the literal
 * name is duplicated there — it must stay client-side code, so it can't import this module).
 * Never itself treated as proof of a session: it only lets the client skip calling
 * /api/auth/me when there's clearly no session, instead of doing that on every page view
 * for every signed-out visitor, which is nearly everyone. */
export const SIGNED_IN_HINT_COOKIE_NAME = 'leaflock_signed_in';
/** How long a session lasts before it must be re-created via a new login. [TO CONFIRM: owner] */
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
/** Below this much time left, an active session's expiry is extended — avoids a DB write on every request. */
const RENEW_THRESHOLD_MS = 24 * 60 * 60 * 1000;

export interface AuthenticatedSession {
  sessionId: string;
  userId: string;
  email: string;
  plan: 'free' | 'pro' | 'lifetime' | 'practice' | 'business';
}

function randomSecret(): string {
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

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function parseCookie(header: string | null): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator === -1) continue;
    if (part.slice(0, separator).trim() === SESSION_COOKIE_NAME) return part.slice(separator + 1).trim();
  }
  return undefined;
}

/** Creates a session row; returns the cookie value to set (`<sessionId>.<secret>`). The server
 * stores only the session id and a hash of the secret, so a database read alone can't forge one. */
export async function createSession(
  db: D1Database,
  userId: string,
  browser: string | null,
  now = Date.now(),
): Promise<string> {
  const secret = randomSecret();
  const id = await insertSession(db, {
    userId,
    secretHash: await sha256Hex(secret),
    now,
    expiresAt: now + SESSION_TTL_MS,
    browser,
  });
  return `${id}.${secret}`;
}

/** Validates the session cookie on `request`, extending its expiry if it's due for renewal. */
export async function readSessionFromRequest(
  request: Request,
  db: D1Database,
  now = Date.now(),
): Promise<AuthenticatedSession | null> {
  const cookieValue = parseCookie(request.headers.get('cookie'));
  if (!cookieValue) return null;
  const separator = cookieValue.indexOf('.');
  if (separator === -1) return null;
  const id = cookieValue.slice(0, separator);
  const secret = cookieValue.slice(separator + 1);
  if (!id || !secret) return null;

  const session = await getSession(db, id);
  if (!session || session.expires_at <= now) return null;
  if (!timingSafeEqual(session.secret_hash, await sha256Hex(secret))) return null;

  const user = await getUserById(db, session.user_id);
  if (!user || user.status !== 'active') return null;

  if (session.expires_at - now < SESSION_TTL_MS - RENEW_THRESHOLD_MS) {
    await touchSession(db, id, now, now + SESSION_TTL_MS);
  }
  // effectivePlan, not user.plan: a cancelled subscription keeps its plan only until
  // the period already paid for runs out.
  return { sessionId: id, userId: user.id, email: user.email, plan: effectivePlan(user, now) };
}

export function sessionSetCookieHeader(cookieValue: string): string {
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  return `${SESSION_COOKIE_NAME}=${cookieValue}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

/** The values the hint cookie may carry: the account's plan. Anything else is written as 'free'. */
const HINT_PLANS: ReadonlySet<string> = new Set(['free', 'pro', 'lifetime', 'practice', 'business']);

/**
 * The non-HttpOnly cookie that says "someone is signed in here", and now which plan they are on.
 *
 * The plan is there so a page can pick the member's view before first paint, from a cookie, instead
 * of showing the new-visitor view until a fetch to /api/auth/me comes back (a 1-2 second flash on the
 * pricing page). It is a display hint and nothing more: the server never reads it, a visitor who edits
 * it only changes what their own page looks like, and /api/auth/me rewrites it on every call so it
 * follows a plan change. Readers that only ask "is it present?" are unaffected by the value.
 */
export function signedInHintCookieHeader(plan: string = 'free'): string {
  const maxAgeSeconds = Math.floor(SESSION_TTL_MS / 1000);
  const value = HINT_PLANS.has(plan) ? plan : 'free';
  return `${SIGNED_IN_HINT_COOKIE_NAME}=${value}; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSeconds}`;
}

export function clearSignedInHintCookieHeader(): string {
  return `${SIGNED_IN_HINT_COOKIE_NAME}=; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await removeSession(db, sessionId);
}
