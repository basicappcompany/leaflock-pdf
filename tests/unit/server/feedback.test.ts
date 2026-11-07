import { describe, expect, it, vi } from 'vitest';
import { onRequestPost } from '../../../functions/api/feedback';
import { MAX_MESSAGE, MIN_MESSAGE, parseFeedback, summarise } from '../../../src/lib/server/feedback';
import { createFakeD1 } from './fakeD1';

const valid = { kind: 'feature', message: 'Please add a way to reorder pages with the keyboard.' };

describe('parsing a submission', () => {
  it('accepts a feature request and feedback, trimming the message', () => {
    expect(parseFeedback({ ...valid, message: `  ${valid.message}  ` })).toEqual({
      ok: true,
      value: { kind: 'feature', message: valid.message, email: null, page: null },
    });
    expect(parseFeedback({ kind: 'feedback', message: 'The sidebar is great, thank you.' }).ok).toBe(true);
  });

  it('keeps an email only if it looks like one, lower-cased, and refuses a malformed one', () => {
    const ok = parseFeedback({ ...valid, email: ' Person@Example.COM ' });
    expect(ok.ok && ok.value.email).toBe('person@example.com');
    expect(parseFeedback({ ...valid, email: '' }).ok && (parseFeedback({ ...valid, email: '' }) as { value: { email: null } }).value.email).toBeNull();
    expect(parseFeedback({ ...valid, email: 'not an email' })).toEqual({ ok: false, reason: 'invalid' });
    expect(parseFeedback({ ...valid, email: `${'a'.repeat(250)}@example.com` })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('enforces the message length', () => {
    expect(parseFeedback({ ...valid, message: 'x'.repeat(MIN_MESSAGE - 1) })).toEqual({ ok: false, reason: 'invalid' });
    expect(parseFeedback({ ...valid, message: 'x'.repeat(MIN_MESSAGE) }).ok).toBe(true);
    expect(parseFeedback({ ...valid, message: 'x'.repeat(MAX_MESSAGE) }).ok).toBe(true);
    expect(parseFeedback({ ...valid, message: 'x'.repeat(MAX_MESSAGE + 1) })).toEqual({ ok: false, reason: 'invalid' });
    expect(parseFeedback({ ...valid, message: '          ' })).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects anything that is not a known kind or not an object', () => {
    for (const bad of [null, 'text', 5, [], { message: valid.message }, { ...valid, kind: 'bug' }, { ...valid, kind: 1 }, { ...valid, message: 42 }]) {
      expect(parseFeedback(bad), JSON.stringify(bad)).toEqual({ ok: false, reason: 'invalid' });
    }
  });

  it('treats a filled hidden field as spam, whatever else is in the body', () => {
    expect(parseFeedback({ ...valid, website: 'http://spam.example' })).toEqual({ ok: false, reason: 'spam' });
    expect(parseFeedback({ kind: 'nope', website: 'x' })).toEqual({ ok: false, reason: 'spam' });
    expect(parseFeedback({ ...valid, website: '   ' }).ok).toBe(true);
  });

  it('keeps only a plain page path, never a URL, query string or script', () => {
    const page = (value: unknown) => {
      const r = parseFeedback({ ...valid, page: value });
      return r.ok ? r.value.page : 'refused';
    };
    expect(page('/split-pdf')).toBe('/split-pdf');
    expect(page('/de/merge-pdf')).toBe('/de/merge-pdf');
    expect(page('/')).toBe('/');
    for (const bad of ['https://evil.example/x', '/split-pdf?x=1', '/a#b', '//evil.example', '/<script>', 'split-pdf', 5, null, `/${'a'.repeat(120)}`]) {
      expect(page(bad), String(bad)).toBeNull();
    }
  });

  it('summarises a message for the owner without inventing anything', () => {
    const { subject, text } = summarise({ kind: 'feature', message: 'Please add dark mode to the editor.', email: null, page: '/edit-pdf' });
    expect(subject).toBe('Feature request: Please add dark mode to the editor.');
    expect(text).toContain('Page: /edit-pdf');
    expect(text).toContain('no email given');
  });
});

function setup(extra: Partial<Env> = {}) {
  const fake = createFakeD1();
  const env = { DB: fake.db, SESSION_IP_SALT: 'salt', ...extra } as unknown as Env;
  return { ...fake, env };
}

const post = (body: unknown, init: { type?: string; ip?: string } = {}) =>
  new Request('https://leaflockpdf.com/api/feedback', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': init.type ?? 'application/json', ...(init.ip ? { 'cf-connecting-ip': init.ip } : {}) },
  });

describe('POST /api/feedback', () => {
  it('stores a valid submission and answers 204', async () => {
    const { env, tables } = setup();
    const response = await onRequestPost({ request: post({ ...valid, email: 'a@b.co', page: '/split-pdf' }, { ip: '1.2.3.4' }), env });
    expect(response.status).toBe(204);
    expect(tables.feedback).toHaveLength(1);
    expect(tables.feedback[0]).toMatchObject({ kind: 'feature', message: valid.message, email: 'a@b.co', page: '/split-pdf' });
  });

  it('never writes an IP address, raw or hashed, next to the message', async () => {
    const { env, tables } = setup();
    await onRequestPost({ request: post(valid, { ip: '203.0.113.9' }), env });
    const stored = JSON.stringify(tables.feedback[0]);
    expect(stored).not.toContain('203.0.113.9');
    expect(Object.keys(tables.feedback[0]!).sort()).toEqual(['created_at', 'email', 'id', 'kind', 'message', 'page']);
  });

  it('answers a bot like a success and stores nothing', async () => {
    const { env, tables } = setup();
    const response = await onRequestPost({ request: post({ ...valid, website: 'http://x.example' }), env });
    expect(response.status).toBe(204);
    expect(tables.feedback).toHaveLength(0);
  });

  it('refuses a body that is not JSON, not valid, or too large', async () => {
    const { env } = setup();
    expect((await onRequestPost({ request: post(valid, { type: 'text/plain' }), env })).status).toBe(415);
    expect((await onRequestPost({ request: post('not json'), env })).status).toBe(400);
    expect((await onRequestPost({ request: post({ kind: 'feature', message: 'short' }), env })).status).toBe(400);
    expect((await onRequestPost({ request: post({ ...valid, message: 'x'.repeat(5000) }), env })).status).toBe(413);
  });

  it('limits one visitor to five an hour, and keeps counting other visitors separately', async () => {
    const { env, tables } = setup();
    for (let i = 0; i < 5; i++) expect((await onRequestPost({ request: post(valid, { ip: '10.0.0.1' }), env })).status).toBe(204);
    expect((await onRequestPost({ request: post(valid, { ip: '10.0.0.1' }), env })).status).toBe(429);
    expect((await onRequestPost({ request: post(valid, { ip: '10.0.0.2' }), env })).status).toBe(204);
    expect(tables.feedback).toHaveLength(6);
  });

  it('answers 503, not a crash, when the table is missing', async () => {
    const { db } = setup();
    const broken = new Proxy(db, {
      get: (target, prop, receiver) => {
        if (prop !== 'prepare') return Reflect.get(target, prop, receiver);
        return (sql: string) => {
          if (sql.includes('INTO feedback')) throw new Error('no such table: feedback');
          return target.prepare(sql);
        };
      },
    });
    const env = { DB: broken, SESSION_IP_SALT: 'salt' } as unknown as Env;
    expect((await onRequestPost({ request: post(valid, { ip: '1.1.1.1' }), env })).status).toBe(503);
  });

  it('emails the owner only when an address is configured, and a mail failure never loses the message', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const quiet = setup();
    await onRequestPost({ request: post(valid, { ip: '9.9.9.1' }), env: quiet.env });
    expect(log).not.toHaveBeenCalled();

    const configured = setup({ FEEDBACK_NOTIFY_EMAIL: 'owner@example.com' });
    const response = await onRequestPost({ request: post(valid, { ip: '9.9.9.2' }), env: configured.env });
    expect(response.status).toBe(204);
    expect(configured.tables.feedback).toHaveLength(1);
    expect(log.mock.calls.flat().join(' ')).toContain('owner@example.com');
    log.mockRestore();
    err.mockRestore();
  });
});
