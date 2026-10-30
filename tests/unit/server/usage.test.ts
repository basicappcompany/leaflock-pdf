import { describe, expect, it } from 'vitest';
import { claimDailyJob, dayKey } from '../../../src/lib/server/usage';
import { createFakeD1 } from './fakeD1';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('daily job allowance', () => {
  it('allows jobs up to the limit, then refuses', async () => {
    const { db } = createFakeD1();
    const now = Date.parse('2026-10-22T09:00:00Z');

    for (let i = 1; i <= 3; i++) {
      await expect(claimDailyJob(db, 'user-1', 3, now)).resolves.toMatchObject({ allowed: true, count: i });
    }
    await expect(claimDailyJob(db, 'user-1', 3, now)).resolves.toMatchObject({ allowed: false, count: 4 });
  });

  it('starts a fresh allowance on the next UTC day', async () => {
    const { db } = createFakeD1();
    const now = Date.parse('2026-10-22T23:00:00Z');
    await claimDailyJob(db, 'user-1', 1, now);
    await expect(claimDailyJob(db, 'user-1', 1, now)).resolves.toMatchObject({ allowed: false });

    await expect(claimDailyJob(db, 'user-1', 1, now + DAY_MS)).resolves.toMatchObject({ allowed: true, count: 1 });
  });

  it('counts each account separately', async () => {
    const { db } = createFakeD1();
    const now = Date.parse('2026-10-22T09:00:00Z');
    await claimDailyJob(db, 'user-1', 1, now);

    await expect(claimDailyJob(db, 'user-2', 1, now)).resolves.toMatchObject({ allowed: true, count: 1 });
  });

  it('stores only a count, never anything about the file', async () => {
    const { db, tables } = createFakeD1();
    await claimDailyJob(db, 'user-1', 5, Date.parse('2026-10-22T09:00:00Z'));

    expect(tables.usageCounters).toEqual([{ user_id: 'user-1', period: '2026-10-22', metric: 'jobs', count: 1 }]);
  });

  it('keys a day by its UTC date', () => {
    expect(dayKey(Date.parse('2026-10-22T23:59:59Z'))).toBe('2026-10-22');
    expect(dayKey(Date.parse('2026-10-23T00:00:00Z'))).toBe('2026-10-23');
  });
});
