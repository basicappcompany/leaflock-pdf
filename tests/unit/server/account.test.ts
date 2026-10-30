import { describe, expect, it } from 'vitest';
import { createUser, deleteAccount, exportAccount, getUserByEmail, setPasswordHash } from '../../../src/lib/server/db';
import { createMagicLink } from '../../../src/lib/server/magicLink';
import { createSession } from '../../../src/lib/server/session';
import { claimDailyJob } from '../../../src/lib/server/usage';
import { createFakeD1 } from './fakeD1';

const NOW = Date.parse('2026-10-23T10:00:00Z');

/** An account with a session, a magic link and some usage behind it. */
async function seed() {
  const fake = createFakeD1();
  const user = await createUser(fake.db, 'person@example.com', NOW);
  await setPasswordHash(fake.db, user.id, 'pbkdf2$210000$c2FsdA==$aGFzaA==');
  await createSession(fake.db, user.id, 'Chrome 141', NOW);
  await createMagicLink(fake.db, 'person@example.com', null, NOW);
  await claimDailyJob(fake.db, user.id, 30, NOW);
  return { ...fake, user };
}

describe('exporting an account', () => {
  it('returns the account, its sessions and its usage', async () => {
    const { db, user } = await seed();
    const data = await exportAccount(db, user.id);

    expect(data?.account).toMatchObject({ email: 'person@example.com', plan: 'free' });
    expect(data?.sessions).toHaveLength(1);
    expect(data?.sessions[0]).toMatchObject({ browser: 'Chrome 141' });
    expect(data?.usage).toEqual([{ period: '2026-10-23', metric: 'jobs', count: 1 }]);
  });

  it('never hands out credentials, only whether a password exists', async () => {
    const { db, user } = await seed();
    const data = await exportAccount(db, user.id);

    const serialised = JSON.stringify(data);
    expect(serialised).not.toContain('pbkdf2');
    expect(serialised).not.toContain('secret_hash');
    expect(data?.account).toMatchObject({ password_set: true });
    expect(data?.account).not.toHaveProperty('password_hash');
  });

  it('reports no password when none is set', async () => {
    const fake = createFakeD1();
    const user = await createUser(fake.db, 'plain@example.com', NOW);
    const data = await exportAccount(fake.db, user.id);
    expect(data?.account.password_set).toBe(false);
  });

  it('returns nothing for an account that no longer exists', async () => {
    const { db } = await seed();
    await expect(exportAccount(db, 'missing-id')).resolves.toBeNull();
  });
});

describe('deleting an account', () => {
  it('removes the account and everything attached to it', async () => {
    const { db, tables, user } = await seed();
    expect(tables.sessions).toHaveLength(1);

    await deleteAccount(db, user.id, user.email);

    expect(tables.users).toHaveLength(0);
    expect(tables.sessions).toHaveLength(0);
    expect(tables.usageCounters).toHaveLength(0);
    expect(tables.magicLinks).toHaveLength(0);
    await expect(getUserByEmail(db, 'person@example.com')).resolves.toBeNull();
  });

  it('leaves other people’s data alone', async () => {
    const { db, tables, user } = await seed();
    const other = await createUser(db, 'other@example.com', NOW);
    await createSession(db, other.id, 'Firefox 140', NOW);
    await claimDailyJob(db, other.id, 30, NOW);

    await deleteAccount(db, user.id, user.email);

    expect(tables.users.map((row) => row['email'])).toEqual(['other@example.com']);
    expect(tables.sessions).toHaveLength(1);
    expect(tables.usageCounters).toHaveLength(1);
  });
});
