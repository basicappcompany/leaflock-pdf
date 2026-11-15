import { generateKeyPairSync } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { plansStartAt } from '../../src/lib/pricing';
import { signEntitlement } from '../../src/lib/server/entitlement';

// vi.mock is hoisted above everything, so the key pair it serves has to be made in vi.hoisted.
const { PUBLIC, PRIVATE } = vi.hoisted(() => {
  const { generateKeyPairSync: generate } = process.getBuiltinModule('node:crypto');
  const pair = generate('ed25519');
  return {
    PUBLIC: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    PRIVATE: pair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  };
});
const signerEnv = { ENTITLEMENT_PRIVATE_KEY: PRIVATE } as unknown as Env;

vi.mock('../../src/lib/entitlementKey', () => ({ ENTITLEMENT_PUBLIC_KEY_SPKI: PUBLIC }));

const afterLaunch = plansStartAt + 24 * 60 * 60 * 1000;

function memoryStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  };
}

/** Loads the client usage module fresh, with the clock, network state and server reply the case needs. */
async function load(options: {
  online?: boolean;
  tool?: string;
  /** What the server answers; a function lets a case throw like a dropped connection. */
  reply?: () => Response | Promise<Response>;
  now?: number;
}) {
  vi.resetModules();
  if (options.now) vi.useFakeTimers({ now: options.now, toFake: ['Date'] });
  const storage = memoryStorage();
  vi.stubGlobal('window', { localStorage: storage });
  vi.stubGlobal('navigator', { onLine: options.online ?? true });
  const calls: { url: string; body: string }[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    calls.push({ url, body: String(init?.body ?? '') });
    if (!options.reply) throw new Error('no network expected');
    return options.reply();
  });
  const usage = await import('../../src/lib/usage');
  const { setActiveTool } = await import('../../src/lib/recentActivity');
  if (options.tool) setActiveTool(options.tool as never);
  return { ...usage, storage, calls };
}

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('claimJob online: the server is the only authority', () => {
  it('asks the server for every run, naming the tool, and starts when it says yes', async () => {
    const { claimJob, calls } = await load({ tool: 'merge', reply: () => json(200, { allowed: true, remaining: 19 }) });
    await expect(claimJob()).resolves.toBeUndefined();
    expect(calls).toEqual([{ url: '/api/usage/claim', body: JSON.stringify({ tool: 'merge' }) }]);
  });

  it('stops the run when the daily allowance is used up', async () => {
    const { claimJob, UsageLimitError } = await load({ tool: 'merge', reply: () => json(200, { allowed: false, remaining: 0, reason: 'free-account' }) });
    await expect(claimJob()).rejects.toBeInstanceOf(UsageLimitError);
  });

  it('stops a tool above the plan on a 402 and forgets any stored token', async () => {
    const { claimJob, EntitlementError, storage } = await load({ tool: 'redact', reply: () => json(402, { error: 'upgrade' }) });
    storage.setItem('leaflock-entitlement', 'stale');
    await expect(claimJob()).rejects.toBeInstanceOf(EntitlementError);
    expect(storage.getItem('leaflock-entitlement')).toBeNull();
  });

  it('fails closed on any non-2xx, so a free user cannot get unlimited runs by making the call fail', async () => {
    for (const status of [400, 401, 429, 500, 503]) {
      const { claimJob, ClaimUnavailableError } = await load({ tool: 'merge', reply: () => json(status, {}) });
      await expect(claimJob(), String(status)).rejects.toBeInstanceOf(ClaimUnavailableError);
    }
  });

  it('fails closed when the browser says it is online but the request never completes', async () => {
    const { claimJob, ClaimUnavailableError } = await load({
      tool: 'merge',
      reply: () => {
        throw new TypeError('Failed to fetch');
      },
    });
    await expect(claimJob()).rejects.toBeInstanceOf(ClaimUnavailableError);
  });

  it('fails closed on an answer it cannot read', async () => {
    const { claimJob, ClaimUnavailableError } = await load({ tool: 'merge', reply: () => new Response('not json', { status: 200 }) });
    await expect(claimJob()).rejects.toBeInstanceOf(ClaimUnavailableError);
  });

  it('keeps a paid account\'s token from the answer, and drops it once the account is no longer paid', async () => {
    const paid = await load({ tool: 'merge', reply: () => json(200, { allowed: true, remaining: null, token: 'signed.token' }) });
    await paid.claimJob();
    expect(paid.storage.getItem('leaflock-entitlement')).toBe('signed.token');

    const lapsed = await load({ tool: 'merge', reply: () => json(200, { allowed: true, remaining: 3, reason: 'free-account' }) });
    lapsed.storage.setItem('leaflock-entitlement', 'signed.token');
    await lapsed.claimJob();
    expect(lapsed.storage.getItem('leaflock-entitlement')).toBeNull();
  });
});

describe('claimJob offline', () => {
  it('lets a free tool run without asking anyone', async () => {
    const { claimJob, calls } = await load({ online: false, tool: 'merge' });
    await expect(claimJob()).resolves.toBeUndefined();
    expect(calls).toHaveLength(0);
  });

  it('before paid plans start, a Practice tool is free offline too', async () => {
    const { claimJob } = await load({ online: false, tool: 'redact' });
    await expect(claimJob()).resolves.toBeUndefined();
  });

  describe('after paid plans start', () => {
    it('blocks a Practice tool with no token', async () => {
      const { claimJob, EntitlementError } = await load({ online: false, tool: 'redact', now: afterLaunch });
      await expect(claimJob()).rejects.toBeInstanceOf(EntitlementError);
    });

    it('runs a Practice tool for a valid unexpired Practice token', async () => {
      const token = await signEntitlement(signerEnv, 'u1', 'practice', afterLaunch);
      const { claimJob, storage, calls } = await load({ online: false, tool: 'redact', now: afterLaunch });
      storage.setItem('leaflock-entitlement', token!);
      await expect(claimJob()).resolves.toBeUndefined();
      expect(calls).toHaveLength(0);
    });

    it('blocks a Practice tool for a Pro token, and runs a free tool regardless', async () => {
      const token = await signEntitlement(signerEnv, 'u1', 'pro', afterLaunch);
      const practiceTool = await load({ online: false, tool: 'batch', now: afterLaunch });
      practiceTool.storage.setItem('leaflock-entitlement', token!);
      await expect(practiceTool.claimJob()).rejects.toBeInstanceOf(practiceTool.EntitlementError);

      const freeTool = await load({ online: false, tool: 'merge', now: afterLaunch });
      await expect(freeTool.claimJob()).resolves.toBeUndefined();
    });

    it('blocks an expired token, a token signed by another key, and a forged one', async () => {
      const expired = await signEntitlement(signerEnv, 'u1', 'practice', afterLaunch - 3 * 24 * 60 * 60 * 1000);
      const stranger = generateKeyPairSync('ed25519').privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
      const foreign = await signEntitlement({ ENTITLEMENT_PRIVATE_KEY: stranger } as unknown as Env, 'u1', 'practice', afterLaunch);
      const real = (await signEntitlement(signerEnv, 'u1', 'pro', afterLaunch))!;
      const [payload, signature] = real.split('.') as [string, string];
      const upgraded = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), tier: 'practice' })).toString('base64url');

      for (const token of [expired!, foreign!, `${upgraded}.${signature}`, 'junk', '']) {
        const { claimJob, EntitlementError, storage } = await load({ online: false, tool: 'redact', now: afterLaunch });
        storage.setItem('leaflock-entitlement', token);
        await expect(claimJob(), token.slice(0, 12)).rejects.toBeInstanceOf(EntitlementError);
      }
    });
  });
});

describe('withClaim', () => {
  it('claims once, holds the claim while the work runs, and releases it afterwards', async () => {
    const { withClaim, holdingClaim, calls } = await load({ tool: 'merge', reply: () => json(200, { allowed: true, remaining: 5 }) });
    expect(holdingClaim()).toBe(false);
    const seen = await withClaim(async () => holdingClaim());
    expect(seen).toBe(true);
    expect(holdingClaim()).toBe(false);
    expect(calls).toHaveLength(1);
  });

  it('does not start the work without a claim, and releases nothing it never held', async () => {
    const { withClaim, holdingClaim } = await load({ tool: 'merge', reply: () => json(500, {}) });
    const work = vi.fn(async () => 'ran');
    await expect(withClaim(work)).rejects.toThrow();
    expect(work).not.toHaveBeenCalled();
    expect(holdingClaim()).toBe(false);
  });

  it('releases the claim when the work itself fails', async () => {
    const { withClaim, holdingClaim } = await load({ tool: 'merge', reply: () => json(200, { allowed: true, remaining: 5 }) });
    await expect(withClaim(async () => Promise.reject(new Error('boom')))).rejects.toThrow('boom');
    expect(holdingClaim()).toBe(false);
  });
});

describe('what the client may read to decide', () => {
  it('never consults the cached plan or the sign-in cookie', () => {
    const source = readFileSync(new URL('../../src/lib/usage.ts', import.meta.url), 'utf8');
    expect(source).not.toMatch(/planCache|getCachedPlan|isPaidPlan|leaflock_signed_in|document\.cookie/);
  });
});
