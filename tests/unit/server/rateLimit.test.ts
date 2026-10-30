import { describe, expect, it } from 'vitest';
import { checkAndIncrement } from '../../../src/lib/server/rateLimit';
import { createFakeD1 } from './fakeD1';

describe('rate limiting', () => {
  it('allows requests up to the limit', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    for (let i = 0; i < 3; i++) {
      await expect(checkAndIncrement(db, 'k', 3, 900, now)).resolves.toMatchObject({ allowed: true, count: i + 1 });
    }
  });

  it('blocks once the limit is exceeded, within the same window', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    await checkAndIncrement(db, 'k', 2, 900, now);
    await checkAndIncrement(db, 'k', 2, 900, now);
    await expect(checkAndIncrement(db, 'k', 2, 900, now)).resolves.toMatchObject({ allowed: false, count: 3 });
  });

  it('resets once a new window starts', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    await checkAndIncrement(db, 'k', 1, 900, now);
    await expect(checkAndIncrement(db, 'k', 1, 900, now)).resolves.toMatchObject({ allowed: false });
    await expect(checkAndIncrement(db, 'k', 1, 900, now + 900 * 1000)).resolves.toMatchObject({ allowed: true, count: 1 });
  });

  it('tracks separate keys independently', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    await checkAndIncrement(db, 'a', 1, 900, now);
    await expect(checkAndIncrement(db, 'b', 1, 900, now)).resolves.toMatchObject({ allowed: true, count: 1 });
  });
});
