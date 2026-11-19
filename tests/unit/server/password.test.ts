import { describe, expect, it, vi } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/lib/server/password';

describe('password hashing', () => {
  it('accepts the right password and rejects the wrong one', async () => {
    const stored = await hashPassword('correct horse battery staple');
    await expect(verifyPassword('correct horse battery staple', stored)).resolves.toBe(true);
    await expect(verifyPassword('Correct horse battery staple', stored)).resolves.toBe(false);
    await expect(verifyPassword('', stored)).resolves.toBe(false);
  });

  it('never stores the password itself, and salts every hash', async () => {
    const password = 'correct horse battery staple';
    const first = await hashPassword(password);
    const second = await hashPassword(password);

    expect(first).not.toContain(password);
    // Same password, different salt, so the hashes must differ.
    expect(first).not.toBe(second);
    await expect(verifyPassword(password, second)).resolves.toBe(true);
  });

  it('records the cost it used, so it can be raised later without locking anyone out', async () => {
    const stored = await hashPassword('correct horse battery staple');
    const [scheme, iterations] = stored.split('$');
    expect(scheme).toBe('pbkdf2');
    // Cloudflare Workers rejects anything above 100,000 (NotSupportedError), which Node does not, so only a test can catch it.
    expect(Number(iterations)).toBeLessThanOrEqual(100_000);
  });

  it('refuses an account with no password set', async () => {
    await expect(verifyPassword('anything', null)).resolves.toBe(false);
  });

  it('does the same amount of hashing work whether or not an account has a password', async () => {
    const stored = await hashPassword('correct horse battery staple');
    await verifyPassword('warm-up', null); // builds the decoy once, outside the measurement
    const spy = vi.spyOn(crypto.subtle, 'deriveBits');

    await verifyPassword('wrong', stored);
    const withPassword = spy.mock.calls.length;
    spy.mockClear();
    await verifyPassword('wrong', null);
    const withoutPassword = spy.mock.calls.length;
    spy.mockRestore();

    expect(withPassword).toBe(1);
    expect(withoutPassword).toBe(withPassword);
  });

  it('refuses a malformed or truncated hash instead of throwing', async () => {
    for (const broken of ['', 'nonsense', 'pbkdf2$', 'pbkdf2$0$c2FsdA==$aGFzaA==', 'bcrypt$10$x$y']) {
      await expect(verifyPassword('anything', broken)).resolves.toBe(false);
    }
  });
});
