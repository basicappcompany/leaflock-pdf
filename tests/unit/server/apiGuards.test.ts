import { describe, expect, it } from 'vitest';
import { onRequest } from '../../../functions/api/_middleware';
import { onRequestGet as verifyGet, onRequestPost as verifyPost } from '../../../functions/api/auth/verify';
import { createMagicLink } from '../../../src/lib/server/magicLink';
import { createFakeD1 } from './fakeD1';

const run = (request: Request) =>
  (onRequest as unknown as (ctx: { request: Request; next: () => Response }) => Promise<Response>)({ request, next: () => new Response('ok') });

describe('the /api middleware: state-changing requests must come from a page on this site', () => {
  const url = 'https://leaflockpdf.com/api/auth/logout';

  it('refuses a POST, PUT or DELETE with no Origin or from another site', async () => {
    for (const method of ['POST', 'PUT', 'DELETE', 'PATCH']) {
      expect((await run(new Request(url, { method }))).status, method).toBe(403);
      expect((await run(new Request(url, { method, headers: { origin: 'https://evil.example' } }))).status, method).toBe(403);
    }
  });

  it('lets a same-site POST through, and every read', async () => {
    expect((await run(new Request(url, { method: 'POST', headers: { origin: 'https://leaflockpdf.com' } }))).status).toBe(200);
    expect((await run(new Request('https://leaflockpdf.com/api/auth/me'))).status).toBe(200);
  });

  it('exempts only the two callers that are not pages: the payment webhook and the scheduled sweep', async () => {
    for (const path of ['/api/billing/webhook', '/api/billing/reconcile']) {
      expect((await run(new Request(`https://leaflockpdf.com${path}`, { method: 'POST' }))).status, path).toBe(200);
    }
    expect((await run(new Request('https://leaflockpdf.com/api/billing/checkout', { method: 'POST' }))).status).toBe(403);
  });

  it('still sends other hosts to the apex first', async () => {
    expect((await run(new Request('https://x.pages.dev/api/usage/claim', { method: 'POST' }))).status).toBe(308);
  });
});

describe('the sign-in link survives a mail scanner that opens it', () => {
  async function world() {
    const { db, tables } = createFakeD1();
    const env = { DB: db, SESSION_IP_SALT: 's' } as unknown as Env;
    const token = await createMagicLink(db, 'new@example.com', null);
    return { env, tables, token };
  }
  const get = (env: Env, token: string) =>
    verifyGet({ request: new Request(`https://leaflockpdf.com/api/auth/verify?token=${encodeURIComponent(token)}`), env });
  const post = (env: Env, token: string) =>
    verifyPost({ request: new Request('https://leaflockpdf.com/api/auth/verify', { method: 'POST', body: new URLSearchParams({ token }) }), env });

  it('opening the link (GET) shows a button and spends nothing, however many times it is opened', async () => {
    const { env, tables, token } = await world();
    for (let i = 0; i < 3; i++) {
      const response = await get(env, token);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('method="post"');
    }
    expect(tables.sessions).toHaveLength(0);
    expect(tables.users).toHaveLength(0);
  });

  it('pressing the button (POST) signs in once, creating the account, and the link cannot be reused', async () => {
    const { env, tables, token } = await world();
    const first = await post(env, token);
    expect(first.status).toBe(303);
    expect(first.headers.get('location')).toBe('https://leaflockpdf.com/account/');
    expect(first.headers.get('set-cookie')).toContain('HttpOnly');
    expect(tables.users).toHaveLength(1);
    const again = await post(env, token);
    expect(again.headers.get('location')).toContain('error=expired');
  });

  it('puts nothing but the escaped token in the page, and sends no token-less visit to a sign-in', async () => {
    const { env } = await world();
    const html = await (await get(env, '"><script>x</script>')).text();
    expect(html).not.toContain('<script>');
    expect((await verifyGet({ request: new Request('https://leaflockpdf.com/api/auth/verify'), env })).headers.get('location')).toContain('error=invalid');
  });
});

import { safeNext } from '../../../src/lib/safeNext';
import { loginPath } from '../../../src/lib/localePath';

describe('coming back to the page that asked for a sign-in', () => {
  it('accepts a plain path on this site and nothing else', () => {
    expect(safeNext('/pricing/')).toBe('/pricing/');
    expect(safeNext('/de/redact-pdf/')).toBe('/de/redact-pdf/');
    for (const bad of ['https://evil.example/', '//evil.example', '/\\evil', 'javascript:alert(1)', '/a/../b', '/api/auth/logout', '/x?y=1', null, undefined, 5, '/' + 'a'.repeat(200)]) {
      expect(safeNext(bad), String(bad)).toBeNull();
    }
  });

  it('builds the sign-in path in the reader\'s language, with the page to return to', () => {
    expect(loginPath('/pricing/')).toBe('/login/?next=%2Fpricing%2F');
    expect(loginPath('/de/pricing/')).toBe('/de/login/?next=%2Fde%2Fpricing%2F');
  });

  it('lets the button page POST back to us: its referrer policy must not turn Origin into "null"', async () => {
    const { db } = createFakeD1();
    const env = { DB: db, SESSION_IP_SALT: 's' } as unknown as Env;
    const token = await createMagicLink(db, 'a@example.com', null);
    const res = await verifyGet({ request: new Request(`https://leaflockpdf.com/api/auth/verify?token=${token}`), env });
    expect(res.headers.get('referrer-policy')).not.toBe('no-referrer');
  });

  it('carries it through the emailed link and the button, and ignores a hostile one', async () => {
    const { db } = createFakeD1();
    const env = { DB: db, SESSION_IP_SALT: 's' } as unknown as Env;
    const token = await createMagicLink(db, 'a@example.com', null);
    const page = await (await verifyGet({ request: new Request(`https://leaflockpdf.com/api/auth/verify?token=${token}&next=%2Fpricing%2F`), env })).text();
    expect(page).toContain('name="next" value="/pricing/"');
    const hostile = await (await verifyGet({ request: new Request(`https://leaflockpdf.com/api/auth/verify?token=${token}&next=https%3A%2F%2Fevil.example`), env })).text();
    expect(hostile).not.toContain('name="next"');

    const go = await verifyPost({ request: new Request('https://leaflockpdf.com/api/auth/verify', { method: 'POST', body: new URLSearchParams({ token, next: '/pricing/' }) }), env });
    expect(go.headers.get('location')).toBe('https://leaflockpdf.com/pricing/');
    const t2 = await createMagicLink(db, 'a@example.com', null);
    const evil = await verifyPost({ request: new Request('https://leaflockpdf.com/api/auth/verify', { method: 'POST', body: new URLSearchParams({ token: t2, next: '//evil.example' }) }), env });
    expect(evil.headers.get('location')).toBe('https://leaflockpdf.com/account/');
  });
});
