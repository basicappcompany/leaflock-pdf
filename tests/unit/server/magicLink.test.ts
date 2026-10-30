import { describe, expect, it } from 'vitest';
import { createMagicLink, verifyMagicLink } from '../../../src/lib/server/magicLink';
import { createFakeD1 } from './fakeD1';

describe('magic links', () => {
  it('verifies a freshly created token and returns its email', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    const token = await createMagicLink(db, 'person@example.com', null, now);
    await expect(verifyMagicLink(db, token, now)).resolves.toBe('person@example.com');
  });

  it('can only be used once', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    const token = await createMagicLink(db, 'person@example.com', null, now);
    await verifyMagicLink(db, token, now);
    await expect(verifyMagicLink(db, token, now)).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const { db } = createFakeD1();
    const now = Date.now();
    const token = await createMagicLink(db, 'person@example.com', null, now);
    await expect(verifyMagicLink(db, token, now + 16 * 60 * 1000)).resolves.toBeNull();
  });

  it('rejects a token that was never issued', async () => {
    const { db } = createFakeD1();
    await expect(verifyMagicLink(db, 'not-a-real-token', Date.now())).resolves.toBeNull();
  });
});
