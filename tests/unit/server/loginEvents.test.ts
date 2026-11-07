import { describe, expect, it, vi } from 'vitest';
import { createUser, recordLogin } from '../../../src/lib/server/db';
import { createFakeD1 } from './fakeD1';

const NOW = Date.parse('2026-11-07T10:00:00Z');

describe('recordLogin', () => {
  it('updates the latest login time and adds one history row', async () => {
    const { db, tables } = createFakeD1();
    const user = await createUser(db, 'person@example.com', NOW - 1000);

    await recordLogin(db, { userId: user.id, method: 'password', browser: 'Edge 141', now: NOW });

    expect(tables.users[0]!['last_login_at']).toBe(NOW);
    expect(tables.loginEvents).toHaveLength(1);
    expect(tables.loginEvents[0]).toMatchObject({ user_id: user.id, at: NOW, method: 'password', browser: 'Edge 141' });
  });

  it('keeps every sign-in rather than overwriting the last one', async () => {
    const { db, tables } = createFakeD1();
    const user = await createUser(db, 'person@example.com', NOW);

    await recordLogin(db, { userId: user.id, method: 'link', browser: 'Chrome 141', now: NOW });
    await recordLogin(db, { userId: user.id, method: 'google', browser: 'Safari 18', now: NOW + 60_000 });

    expect(tables.loginEvents.map((row) => row['method'])).toEqual(['link', 'google']);
    expect(tables.users[0]!['last_login_at']).toBe(NOW + 60_000);
  });

  it('stores nothing beyond who, when, how and browser family', async () => {
    const { db, tables } = createFakeD1();
    const user = await createUser(db, 'person@example.com', NOW);
    await recordLogin(db, { userId: user.id, method: 'link', browser: null, now: NOW });

    expect(Object.keys(tables.loginEvents[0]!).sort()).toEqual(['at', 'browser', 'id', 'method', 'user_id']);
  });

  it('never blocks a sign-in when the history row cannot be written', async () => {
    const fake = createFakeD1();
    const user = await createUser(fake.db, 'person@example.com', NOW);
    const realPrepare = fake.db.prepare.bind(fake.db);
    const failing = {
      ...fake.db,
      prepare: (sql: string) => {
        if (sql.includes('INTO login_events')) throw new Error('D1 unavailable');
        return realPrepare(sql);
      },
    } as unknown as D1Database;
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(recordLogin(failing, { userId: user.id, method: 'link', browser: 'Chrome 141', now: NOW })).resolves.toBeUndefined();

    expect(fake.tables.users[0]!['last_login_at']).toBe(NOW);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
