import { describe, expect, it } from 'vitest';
import { onRequestGet, onRequestPut } from '../../../functions/api/starred';
import { createUser, deleteAccount, exportAccount, listStarredTools, replaceStarredTools } from '../../../src/lib/server/db';
import { SESSION_COOKIE_NAME, createSession } from '../../../src/lib/server/session';
import { accountKey, parseStarredBody, MAX_STARRED } from '../../../src/lib/server/starred';
import { createFakeD1 } from './fakeD1';

const NOW = Date.parse('2026-11-08T10:00:00Z');

async function signedIn() {
  const fake = createFakeD1();
  const user = await createUser(fake.db, 'person@example.com', NOW);
  const cookie = await createSession(fake.db, user.id, 'Chrome 141', Date.now());
  return { ...fake, user, cookie, env: { DB: fake.db } as unknown as Env };
}

const call = (cookie: string | null, init: RequestInit = {}) =>
  new Request('https://leaflockpdf.com/api/starred', {
    ...init,
    headers: { ...(cookie ? { cookie: `${SESSION_COOKIE_NAME}=${cookie}` } : {}), ...(init.headers as Record<string, string> | undefined) },
  });

const put = (cookie: string | null, body: unknown, type = 'application/json') =>
  call(cookie, { method: 'PUT', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'content-type': type } });

describe('parsing a starred list', () => {
  it('accepts tool ids and collapses duplicates, keeping the first position', () => {
    expect(parseStarredBody({ tools: ['merge', 'split', 'merge'] })).toEqual(['merge', 'split']);
    expect(parseStarredBody({ tools: [] })).toEqual([]);
  });

  it('rejects anything that is not a list of plausible tool ids', () => {
    for (const bad of [null, 'merge', {}, { tools: 'merge' }, { tools: [1] }, { tools: ['Merge'] }, { tools: ['a b'] }, { tools: ['../x'] }, { tools: [''] }]) {
      expect(parseStarredBody(bad), JSON.stringify(bad)).toBeNull();
    }
  });

  it('rejects a list longer than the cap', () => {
    expect(parseStarredBody({ tools: Array.from({ length: MAX_STARRED + 1 }, (_, i) => `t${i}`) })).toBeNull();
  });

  it('names an account without revealing or being its id', async () => {
    const key = await accountKey('user-123');
    expect(key).toMatch(/^[0-9a-f]{16}$/);
    expect(key).not.toContain('user-123');
    expect(await accountKey('user-123')).toBe(key);
    expect(await accountKey('user-124')).not.toBe(key);
  });
});

describe('storing starred tools', () => {
  it('lists them in the order they were saved, and replaces the whole list', async () => {
    const { db, user } = await signedIn();
    await replaceStarredTools(db, user.id, ['split', 'merge', 'rotate'], NOW);
    expect(await listStarredTools(db, user.id)).toEqual(['split', 'merge', 'rotate']);
    await replaceStarredTools(db, user.id, ['crop'], NOW);
    expect(await listStarredTools(db, user.id)).toEqual(['crop']);
    await replaceStarredTools(db, user.id, [], NOW);
    expect(await listStarredTools(db, user.id)).toEqual([]);
  });

  it("keeps one account's list apart from another's", async () => {
    const { db, user } = await signedIn();
    const other = await createUser(db, 'other@example.com', NOW);
    await replaceStarredTools(db, user.id, ['merge'], NOW);
    await replaceStarredTools(db, other.id, ['split'], NOW);
    expect(await listStarredTools(db, user.id)).toEqual(['merge']);
    expect(await listStarredTools(db, other.id)).toEqual(['split']);
  });

  it('is included in the account export, and gone when the account is deleted', async () => {
    const { db, user } = await signedIn();
    await replaceStarredTools(db, user.id, ['merge', 'split'], NOW);
    expect((await exportAccount(db, user.id))?.starred_tools).toEqual(['merge', 'split']);
    await deleteAccount(db, user.id, 'person@example.com');
    expect(await listStarredTools(db, user.id)).toEqual([]);
  });
});

describe('GET /api/starred', () => {
  it('answers 200 with a null body when signed out, like /api/auth/me, so no console error is logged', async () => {
    const { env } = await signedIn();
    const response = await onRequestGet({ request: call(null), env });
    expect(response.status).toBe(200);
    expect(await response.json()).toBeNull();
  });

  it("returns the signed-in account's list and its opaque name", async () => {
    const { env, db, user, cookie } = await signedIn();
    await replaceStarredTools(db, user.id, ['merge', 'split'], NOW);
    const response = await onRequestGet({ request: call(cookie), env });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ tools: ['merge', 'split'], account: await accountKey(user.id) });
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  it('answers 503, not a crash, when the table is missing', async () => {
    const { cookie, db } = await signedIn();
    const broken = new Proxy(db, {
      get: (target, prop, receiver) => {
        if (prop !== 'prepare') return Reflect.get(target, prop, receiver);
        return (sql: string) => {
          if (sql.includes('starred_tools')) throw new Error('no such table: starred_tools');
          return target.prepare(sql);
        };
      },
    });
    const response = await onRequestGet({ request: call(cookie), env: { DB: broken } as unknown as Env });
    expect(response.status).toBe(503);
  });
});

describe('PUT /api/starred', () => {
  it('replaces the list and answers with it', async () => {
    const { env, db, user, cookie } = await signedIn();
    const response = await onRequestPut({ request: put(cookie, { tools: ['crop', 'merge'] }), env });
    expect(response.status).toBe(200);
    expect(await listStarredTools(db, user.id)).toEqual(['crop', 'merge']);
  });

  it('needs a session', async () => {
    const { env } = await signedIn();
    expect((await onRequestPut({ request: put(null, { tools: ['merge'] }), env })).status).toBe(401);
  });

  it('refuses a body that is not JSON, is not a tool list, or is too large', async () => {
    const { env, cookie } = await signedIn();
    expect((await onRequestPut({ request: put(cookie, { tools: ['merge'] }, 'text/plain'), env })).status).toBe(415);
    expect((await onRequestPut({ request: put(cookie, 'not json'), env })).status).toBe(400);
    expect((await onRequestPut({ request: put(cookie, { tools: ['Not A Tool'] }), env })).status).toBe(400);
    expect((await onRequestPut({ request: put(cookie, { tools: ['x'.repeat(5000)] }), env })).status).toBe(413);
  });

  it("never lets one account write another's list", async () => {
    const { env, db, user, cookie } = await signedIn();
    const other = await createUser(db, 'other@example.com', NOW);
    await replaceStarredTools(db, other.id, ['split'], NOW);
    await onRequestPut({ request: put(cookie, { tools: ['merge'] }), env });
    expect(await listStarredTools(db, other.id)).toEqual(['split']);
    expect(await listStarredTools(db, user.id)).toEqual(['merge']);
  });
});
