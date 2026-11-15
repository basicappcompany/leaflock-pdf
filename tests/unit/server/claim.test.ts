import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { onRequestPost as claim } from '../../../functions/api/usage/claim';
import { onRequestPost as refresh } from '../../../functions/api/billing/refresh';
import { verifyEntitlement } from '../../../src/lib/entitlement';
import { ENTITLEMENT_TTL_MS } from '../../../src/lib/server/entitlement';
import { SESSION_COOKIE_NAME, createSession } from '../../../src/lib/server/session';
import { plansStartAt } from '../../../src/lib/pricing';
import { createFakeD1 } from './fakeD1';

const { publicKey, privateKey } = generateKeyPairSync('ed25519');
const PRIVATE = privateKey.export({ type: 'pkcs8', format: 'der' }).toString('base64');
const PUBLIC = publicKey.export({ type: 'spki', format: 'der' }).toString('base64');

const afterLaunch = plansStartAt + 24 * 60 * 60 * 1000;
const beforeLaunch = plansStartAt - 24 * 60 * 60 * 1000;

type Plan = 'free' | 'pro' | 'practice' | 'lifetime';

async function setup(plan: Plan | null, planStatus = 'active', periodEnd: number | null = null, sessionAt: number = Date.now()) {
  const { db, tables } = createFakeD1();
  let cookie = '';
  if (plan) {
    tables.users.push({
      id: 'u1', email: 'a@example.com', created_at: 0, last_login_at: null, plan, status: 'active',
      plan_status: planStatus, current_period_end: periodEnd, subscription_id: null, dodo_payment_id: null,
      billing_event_at: null, billing_synced_at: null,
    });
    cookie = `${SESSION_COOKIE_NAME}=${await createSession(db, 'u1', 'Chrome 141', sessionAt)}`;
  }
  const env = { DB: db, SESSION_IP_SALT: 'salt', ENTITLEMENT_PRIVATE_KEY: PRIVATE } as unknown as Env;
  const post = (tool: string | undefined) =>
    claim({
      request: new Request('https://leaflockpdf.com/api/usage/claim', {
        method: 'POST',
        headers: { ...(cookie ? { cookie } : {}), 'cf-connecting-ip': '203.0.113.7', 'content-type': 'application/json' },
        body: tool ? JSON.stringify({ tool }) : '',
      }),
      env,
    });
  return { db, tables, env, cookie, post };
}

/** Time-travels the claim to after launch, when paid tools are gated, without touching the real clock. */
async function claimAfterLaunch(plan: Plan | null, tool: string | undefined, planStatus = 'active', periodEnd: number | null = null) {
  // The session must be valid at the simulated time, or it silently becomes an anonymous request.
  const { env, cookie } = await setup(plan, planStatus, periodEnd, afterLaunch - 2000);
  const { decideClaim } = await import('../../../src/lib/server/claim');
  const { readSessionFromRequest } = await import('../../../src/lib/server/session');
  const request = new Request('https://leaflockpdf.com/api/usage/claim', { headers: cookie ? { cookie } : {} });
  const session = cookie ? await readSessionFromRequest(request, env.DB, afterLaunch - 1000) : null;
  return decideClaim({ env, session: session ? { userId: session.userId, plan: session.plan } : null, tool, anonymousKey: 'k', now: afterLaunch });
}

describe('the usage claim', () => {
  it('counts a free tool for a free account and says how many remain', async () => {
    const { post } = await setup('free');
    const response = await post('merge');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ allowed: true, reason: 'free-account' });
  });

  it('counts an anonymous visitor by address, and gives it a token for today only', async () => {
    const { post } = await setup(null);
    const body = (await (await post('merge')).json()) as Record<string, unknown>;
    expect(body).toMatchObject({ allowed: true, reason: 'anonymous' });
    const claims = await verifyEntitlement(body['token'] as string, PUBLIC);
    expect(claims).toMatchObject({ sub: 'anonymous', tier: 'free', runs: 19 });
  });

  it('refuses an unknown tool id and an oversized or malformed body', async () => {
    const { post, env } = await setup('free');
    expect((await post('not-a-tool')).status).toBe(400);
    const big = await claim({ request: new Request('https://leaflockpdf.com/api/usage/claim', { method: 'POST', body: 'x'.repeat(2000) }), env });
    expect(big.status).toBe(413);
    const bad = await claim({ request: new Request('https://leaflockpdf.com/api/usage/claim', { method: 'POST', body: '{nope' }), env });
    expect(bad.status).toBe(400);
  });

  it('gives a paid account a signed token that the public key verifies and that expires', async () => {
    const { post } = await setup('practice');
    const { token } = (await (await post('merge')).json()) as { token: string };
    const claims = await verifyEntitlement(token, PUBLIC);
    expect(claims).toMatchObject({ v: 1, sub: 'u1', plan: 'practice', tier: 'practice' });
    expect(claims!.exp - Date.now()).toBeLessThanOrEqual(ENTITLEMENT_TTL_MS);
    expect(await verifyEntitlement(token, PUBLIC, claims!.exp + 1)).toBeNull();
  });

  it('issues no token without a signing key, and does not fail the run', async () => {
    const { post, env } = await setup('pro');
    delete (env as { ENTITLEMENT_PRIVATE_KEY?: string }).ENTITLEMENT_PRIVATE_KEY;
    const response = await post('merge');
    expect(response.status).toBe(200);
    expect(((await response.json()) as Record<string, unknown>)['token']).toBeUndefined();
  });

  it('a token for one key does not verify under another, and a tampered one never does', async () => {
    const { post } = await setup('pro');
    const { token } = (await (await post('merge')).json()) as { token: string };
    const other = generateKeyPairSync('ed25519').publicKey.export({ type: 'spki', format: 'der' }).toString('base64');
    expect(await verifyEntitlement(token, other)).toBeNull();
    const [payload, signature] = token.split('.') as [string, string];
    const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(payload, 'base64url').toString()), tier: 'practice', exp: 9e15 })).toString('base64url');
    expect(await verifyEntitlement(`${forged}.${signature}`, PUBLIC)).toBeNull();
    expect(await verifyEntitlement('garbage', PUBLIC)).toBeNull();
    expect(await verifyEntitlement(null, PUBLIC)).toBeNull();
  });
});

describe('the claim after paid plans start (1 January 2027)', () => {
  const future = afterLaunch + 365 * 24 * 60 * 60 * 1000;

  it('answers 402 with no token and no count for a Practice tool when signed out or on a lower plan', async () => {
    for (const plan of [null, 'free', 'pro', 'lifetime'] as const) {
      const outcome = await claimAfterLaunch(plan, 'redact', 'active', future);
      expect(outcome.status, String(plan)).toBe(402);
      expect(JSON.stringify(outcome.body)).not.toMatch(/token|remaining/);
    }
  });

  it('lets a Practice account run a Practice tool, and a Pro account a Pro-level or free tool', async () => {
    expect((await claimAfterLaunch('practice', 'redact', 'active', future)).status).toBe(200);
    expect((await claimAfterLaunch('pro', 'merge', 'active', future)).status).toBe(200);
  });

  it('treats an expired or cancelled-and-lapsed account as free, so a Practice tool is refused', async () => {
    expect((await claimAfterLaunch('practice', 'batch', 'expired', null)).status).toBe(402);
    expect((await claimAfterLaunch('practice', 'batch', 'cancelled', afterLaunch - 5000)).status).toBe(402);
  });

  it('keeps access for a cancelled account until the period it paid for ends, and for past_due', async () => {
    expect((await claimAfterLaunch('practice', 'compare', 'cancelled', future)).status).toBe(200);
    expect((await claimAfterLaunch('practice', 'compare', 'past_due', future)).status).toBe(200);
  });

  it('runs every Practice tool through the same check', async () => {
    for (const tool of ['extractTables', 'batesNumber', 'redact', 'pdfToPdfA', 'compare', 'batch']) {
      expect((await claimAfterLaunch('free', tool)).status, tool).toBe(402);
    }
  });
});

describe('before paid plans start the Practice tools are free for everyone', () => {
  it('lets a free account claim a Practice tool', async () => {
    expect(Date.now()).toBeLessThan(plansStartAt);
    const { post } = await setup('free');
    expect((await post('redact')).status).toBe(200);
  });

  it('is only the date that changes this: the same claim after the date is a 402', async () => {
    const outcome = await claimAfterLaunch('free', 'redact');
    expect(outcome.status).toBe(402);
    expect(beforeLaunch).toBeLessThan(plansStartAt);
  });
});

describe('the refresh endpoint', () => {
  const call = (env: Env, headers: Record<string, string>) =>
    refresh({ request: new Request('https://leaflockpdf.com/api/billing/refresh', { method: 'POST', headers }), env });

  it('refuses a request that is not from a page on this site, before reading anything else', async () => {
    const { env, cookie } = await setup('free');
    expect((await call(env, { cookie })).status).toBe(403);
    expect((await call(env, { cookie, origin: 'https://evil.example' })).status).toBe(403);
    expect((await call(env, { cookie, referer: 'https://evil.example/x' })).status).toBe(403);
  });

  it('accepts this site by Origin or by Referer, and needs a session', async () => {
    const { env, cookie } = await setup('free');
    expect((await call(env, { cookie, origin: 'https://leaflockpdf.com' })).status).toBe(200);
    expect((await call(env, { cookie, referer: 'https://leaflockpdf.com/account/' })).status).toBe(200);
    expect((await call(env, { origin: 'https://leaflockpdf.com' })).status).toBe(401);
  });

  it('stops answering once the whole site has asked too often in a minute', async () => {
    const { env, cookie } = await setup('free');
    let limited = false;
    for (let i = 0; i < 130 && !limited; i++) {
      limited = (await call(env, { cookie, origin: 'https://leaflockpdf.com' })).status === 429;
    }
    expect(limited).toBe(true);
  });
});
