import { describe, expect, it } from 'vitest';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookieHeader,
  clearSignedInHintCookieHeader,
  createSession,
  deleteSession,
  readSessionFromRequest,
  sessionSetCookieHeader,
  signedInHintCookieHeader,
} from '../../../src/lib/server/session';
import { createFakeD1 } from './fakeD1';

function seedUser(tables: ReturnType<typeof createFakeD1>['tables'], overrides: Partial<Record<string, unknown>> = {}) {
  const user = {
    id: 'user-1',
    email: 'person@example.com',
    created_at: Date.now(),
    last_login_at: null,
    plan: 'free',
    status: 'active',
    ...overrides,
  };
  tables.users.push(user);
  return user;
}

function requestWithCookie(cookieValue: string): Request {
  return new Request('https://leaflockpdf.com/api/auth/me', { headers: { cookie: `${SESSION_COOKIE_NAME}=${cookieValue}` } });
}

describe('sessions', () => {
  it('authenticates a request carrying a freshly issued session cookie', async () => {
    const { db, tables } = createFakeD1();
    seedUser(tables);
    const now = Date.now();
    const cookieValue = await createSession(db, 'user-1', 'Chrome 141', now);

    const session = await readSessionFromRequest(requestWithCookie(cookieValue), db, now);
    expect(session).toMatchObject({ userId: 'user-1', email: 'person@example.com', plan: 'free' });
  });

  it('rejects a request with no cookie', async () => {
    const { db } = createFakeD1();
    await expect(readSessionFromRequest(new Request('https://leaflockpdf.com/api/auth/me'), db)).resolves.toBeNull();
  });

  it('rejects a cookie with the wrong secret', async () => {
    const { db, tables } = createFakeD1();
    seedUser(tables);
    const now = Date.now();
    const cookieValue = await createSession(db, 'user-1', null, now);
    const id = cookieValue.split('.')[0];

    await expect(readSessionFromRequest(requestWithCookie(`${id}.wrong-secret`), db, now)).resolves.toBeNull();
  });

  it('rejects an expired session', async () => {
    const { db, tables } = createFakeD1();
    seedUser(tables);
    const now = Date.now();
    const cookieValue = await createSession(db, 'user-1', null, now);

    await expect(
      readSessionFromRequest(requestWithCookie(cookieValue), db, now + 31 * 24 * 60 * 60 * 1000),
    ).resolves.toBeNull();
  });

  it('rejects a session for a disabled user', async () => {
    const { db, tables } = createFakeD1();
    seedUser(tables, { status: 'disabled' });
    const now = Date.now();
    const cookieValue = await createSession(db, 'user-1', null, now);

    await expect(readSessionFromRequest(requestWithCookie(cookieValue), db, now)).resolves.toBeNull();
  });

  it('is unreadable after logout', async () => {
    const { db, tables } = createFakeD1();
    seedUser(tables);
    const now = Date.now();
    const cookieValue = await createSession(db, 'user-1', null, now);
    const id = cookieValue.split('.')[0]!;

    await deleteSession(db, id);
    await expect(readSessionFromRequest(requestWithCookie(cookieValue), db, now)).resolves.toBeNull();
  });

  it('cookie headers carry the expected security attributes', () => {
    expect(sessionSetCookieHeader('abc.def')).toMatch(/Secure; HttpOnly; SameSite=Lax; Path=\/;/);
    expect(clearSessionCookieHeader()).toContain('Max-Age=0');
  });

  it('the sign-in hint cookie is readable by client JS, unlike the session cookie', () => {
    expect(signedInHintCookieHeader()).toMatch(/Secure; SameSite=Lax; Path=\/;/);
    expect(signedInHintCookieHeader()).not.toContain('HttpOnly');
    expect(clearSignedInHintCookieHeader()).toContain('Max-Age=0');
  });
});
