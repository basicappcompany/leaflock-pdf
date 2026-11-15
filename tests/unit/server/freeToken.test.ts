import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { verifyEntitlement } from '../../../src/lib/entitlement';
import { plansStartAt } from '../../../src/lib/pricing';
import { createFakeD1 } from './fakeD1';

// The server verifies the offline report with the bundled public key, so the key pair has to be ours.
const { PUBLIC, PRIVATE } = vi.hoisted(() => {
  const { generateKeyPairSync } = process.getBuiltinModule('node:crypto');
  const pair = generateKeyPairSync('ed25519');
  return {
    PUBLIC: pair.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'),
    PRIVATE: pair.privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64'),
  };
});
vi.mock('../../../src/lib/entitlementKey', () => ({ ENTITLEMENT_PUBLIC_KEY_SPKI: PUBLIC }));

import { decideClaim, gateForcedOn } from '../../../src/lib/server/claim';
import { FREE_ACCOUNT_DAILY_JOBS, ANONYMOUS_DAILY_JOBS } from '../../../src/lib/server/usage';

const NOON = Date.UTC(2026, 10, 15, 12, 0, 0);
const MIDNIGHT = Date.UTC(2026, 10, 16);
const free = { userId: 'u1', plan: 'free' as const };

function world() {
  const { db } = createFakeD1();
  return { env: { DB: db, SESSION_IP_SALT: 's', ENTITLEMENT_PRIVATE_KEY: PRIVATE } as unknown as Env };
}

type Body = { allowed: boolean; remaining: number; token?: string; authorizedTier?: string; grantedTier?: string };
const run = async (w: ReturnType<typeof world>, extra: Partial<Parameters<typeof decideClaim>[0]> = {}) =>
  (await decideClaim({ env: w.env, session: free, tool: 'merge', anonymousKey: 'k', now: NOON, ...extra })).body as unknown as Body;

describe('every online claim hands out a token (P0)', () => {
  it('gives a free account a token with the day, what is left, and an expiry inside that day', async () => {
    const body = await run(world());
    expect(body.remaining).toBe(FREE_ACCOUNT_DAILY_JOBS - 1);
    const claims = await verifyEntitlement(body.token, PUBLIC, NOON);
    expect(claims).toMatchObject({ sub: 'u1', plan: 'free', tier: 'free', day: '2026-11-15', runs: FREE_ACCOUNT_DAILY_JOBS - 1 });
    expect(claims!.exp).toBeLessThanOrEqual(MIDNIGHT);
    expect(claims!.exp - NOON).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
  });

  it('a token issued just before midnight dies at midnight, so it cannot straddle days', async () => {
    const late = MIDNIGHT - 60_000;
    const body = await run(world(), { now: late });
    const claims = await verifyEntitlement(body.token, PUBLIC, late);
    expect(claims!.exp).toBe(MIDNIGHT);
    expect(await verifyEntitlement(body.token, PUBLIC, MIDNIGHT)).toBeNull();
  });

  it('gives a token with zero runs when the allowance is used up, so offline stays blocked too', async () => {
    const w = world();
    let last: Body = await run(w);
    for (let i = 1; i <= FREE_ACCOUNT_DAILY_JOBS; i++) last = await run(w);
    expect(last.allowed).toBe(false);
    expect((await verifyEntitlement(last.token, PUBLIC, NOON))!.runs).toBe(0);
  });

  it('gives a paid account the same 48-hour token with no run count', async () => {
    const body = await run(world(), { session: { userId: 'u2', plan: 'pro' } });
    const claims = await verifyEntitlement(body.token, PUBLIC, NOON);
    expect(claims).toMatchObject({ plan: 'pro', tier: 'pro' });
    expect(claims!.runs).toBeUndefined();
    expect(claims!.exp - NOON).toBe(48 * 60 * 60 * 1000);
  });
});

describe('reconciling offline runs on the next online claim (P0)', () => {
  const offlineFrom = async (w: ReturnType<typeof world>, spent: number, session: typeof free | null = free) => {
    const issued = await run(w, { session });
    return { issued, report: { token: issued.token!, used: spent } };
  };

  it('charges runs spent offline, so going offline and back cannot mint a second allowance', async () => {
    const w = world();
    const { issued, report } = await offlineFrom(w, 30);
    expect(issued.remaining).toBe(59);
    const next = await run(w, { offline: report });
    // 1 (first claim) + 30 offline + 1 (this claim).
    expect(next.remaining).toBe(FREE_ACCOUNT_DAILY_JOBS - 32);
  });

  it('stops the run when the offline runs already used the day up', async () => {
    const w = world();
    const { report } = await offlineFrom(w, 59);
    const next = await run(w, { offline: report });
    expect(next.allowed).toBe(false);
    expect(next.remaining).toBe(0);
  });

  it('never charges more than the token allowed, however large the claimed count', async () => {
    const w = world();
    const { report } = await offlineFrom(w, 0);
    const next = await run(w, { offline: { ...report, used: 1_000_000 } });
    expect(next.remaining).toBe(0);
  });

  it('ignores a forged token, another account\'s token, a paid token and a token from another day', async () => {
    const w = world();
    const mine = await run(w);
    const other = await run(world(), { session: { userId: 'u9', plan: 'free' } });
    const [payload, signature] = mine.token!.split('.') as [string, string];
    const forged = `${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), runs: 9999 })).toString('base64url')}.${signature}`;
    const paid = await run(world(), { session: { userId: 'u1', plan: 'pro' } });
    const yesterday = await run(world(), { now: NOON - 24 * 60 * 60 * 1000 });

    const before = (await run(w)).remaining;
    let expected = before;
    for (const token of [forged, other.token!, paid.token!, yesterday.token!, 'junk']) {
      const body = await run(w, { offline: { token, used: 40 } });
      expected -= 1;
      expect(body.remaining, token.slice(0, 10)).toBe(expected);
    }
  });

  it('does the same for an anonymous visitor, settled against the address', async () => {
    const w = world();
    const issued = await run(w, { session: null });
    expect(issued.remaining).toBe(ANONYMOUS_DAILY_JOBS - 1);
    expect((await verifyEntitlement(issued.token, PUBLIC, NOON))!.sub).toBe('anonymous');
    const next = await run(w, { session: null, offline: { token: issued.token!, used: 10 } });
    expect(next.remaining).toBe(ANONYMOUS_DAILY_JOBS - 12);
  });
});

describe('claim-swap: the tier comes from the server registry (P2)', () => {
  it('names the tier it authorized and what the plan reaches', async () => {
    expect(await run(world(), { tool: 'merge' })).toMatchObject({ authorizedTier: 'free', grantedTier: 'free' });
    expect(await run(world(), { tool: 'redact', session: { userId: 'u2', plan: 'practice' } })).toMatchObject({ authorizedTier: 'practice', grantedTier: 'practice' });
    expect(await run(world(), { tool: 'merge', session: { userId: 'u2', plan: 'practice' } })).toMatchObject({ authorizedTier: 'free', grantedTier: 'practice' });
  });

  it('takes no tier from the request: a body can only name a tool id, and an unknown one is refused', async () => {
    const outcome = await decideClaim({ env: world().env, session: free, tool: { tier: 'free' }, anonymousKey: 'k', now: NOON });
    expect(outcome.status).toBe(400);
    const source = readFileSync(new URL('../../../src/lib/server/claim.ts', import.meta.url), 'utf8');
    expect(source).toMatch(/tierOfTool\(tool\)/);
  });

  it('logs the tier it authorized for each run, and nothing about the file', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    await run(world(), { tool: 'merge' });
    const line = JSON.parse(String(log.mock.calls.at(-1)?.[0])) as Record<string, unknown>;
    log.mockRestore();
    expect(line).toEqual({ type: 'claim', tool: 'merge', required: 'free', granted: 'free', outcome: 'free' });
  });
});

describe('the staging flag that rehearses launch day (P1)', () => {
  const beforeLaunch = plansStartAt - 1000;

  it('is off by default: a free account claims a Practice tool before 2027', async () => {
    expect((await decideClaim({ env: world().env, session: free, tool: 'redact', anonymousKey: 'k', now: beforeLaunch })).status).toBe(200);
  });

  it('forces the 402 before 2027 when ENTITLEMENT_GATE_ALWAYS_ON=on, off the production hostnames', async () => {
    const w = world();
    const env = { ...w.env, ENTITLEMENT_GATE_ALWAYS_ON: 'on' } as unknown as Env;
    const outcome = await decideClaim({ env, session: free, tool: 'redact', anonymousKey: 'k', now: beforeLaunch, host: 'staging.leaflock-pdf.pages.dev' });
    expect(outcome).toMatchObject({ status: 402, body: { error: 'upgrade', required: 'practice' } });
  });

  it('is ignored on the production hostnames even when set there by mistake', async () => {
    const env = { ...world().env, ENTITLEMENT_GATE_ALWAYS_ON: 'on' } as unknown as Env;
    for (const host of ['leaflockpdf.com', 'www.leaflockpdf.com', 'LeafLockPDF.com']) {
      expect(gateForcedOn(env, host), host).toBe(false);
      expect((await decideClaim({ env, session: free, tool: 'redact', anonymousKey: 'k', now: beforeLaunch, host })).status).toBe(200);
    }
  });

  it('only the exact value "on" counts', () => {
    for (const value of ['1', 'true', 'ON', '', undefined]) expect(gateForcedOn({ ENTITLEMENT_GATE_ALWAYS_ON: value } as Pick<Env, 'ENTITLEMENT_GATE_ALWAYS_ON'>, 'x.pages.dev')).toBe(false);
  });

  it('is not set anywhere production reads it', () => {
    const toml = readFileSync(new URL('../../../wrangler.toml', import.meta.url), 'utf8');
    // Production vars are the top-level [vars] table; the preview env is allowed to differ.
    const production = toml.split(/^\[+env\./m)[0] ?? '';
    expect(production).not.toMatch(/ENTITLEMENT_GATE_ALWAYS_ON/);
    for (const file of ['.env', '.env.production', '.dev.vars']) {
      try {
        expect(readFileSync(new URL(`../../../${file}`, import.meta.url), 'utf8'), file).not.toMatch(/GATE_ALWAYS_ON\s*=\s*on/);
      } catch {
        // The file is not there, which is the point.
      }
    }
  });
});
