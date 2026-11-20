import { describe, expect, it } from 'vitest';
import { signInEmail } from '../../src/lib/email/signInEmail';
import { MAGIC_LINK_TTL_MS } from '../../src/lib/server/magicLink';

const link = 'https://leaflockpdf.com/api/auth/verify?token=abc_DEF-123&next=%2Fpricing%2F';
const minutes = Math.round(MAGIC_LINK_TTL_MS / 60_000);

describe('the sign-in email', () => {
  it('carries the link in both the text and the HTML button, escaped for HTML', () => {
    const { text, html } = signInEmail(link, minutes);
    expect(text).toContain(link);
    // The ampersand in a real link must be &amp; inside an attribute.
    expect(html).toContain('href="https://leaflockpdf.com/api/auth/verify?token=abc_DEF-123&amp;next=%2Fpricing%2F"');
    expect(html).toContain('>Sign in</a>');
  });

  it('cannot be turned into markup by a hostile link', () => {
    const { html } = signInEmail('https://x.test/"><script>alert(1)</script>', minutes);
    expect(html).not.toContain('<script');
    expect(html).toContain('&quot;&gt;&lt;script&gt;');
  });

  it('states the lifetime from the constant that enforces it, in both parts', () => {
    const { text, html } = signInEmail(link, minutes);
    expect(text).toContain(`expires in ${minutes} minutes`);
    expect(html).toContain(`expires in ${minutes} minutes`);
  });

  it('loads nothing from anywhere: no images, no remote styles, no scripts', () => {
    const { html } = signInEmail(link, minutes);
    expect(html).not.toMatch(/<img|<script|<link|<iframe|url\(|@import|src=/i);
    // The only addresses in it are the sign-in link itself.
    const addresses = [...html.matchAll(/https?:\/\/[^\s"'<]+/g)].map((match) => match[0].replace(/&amp;/g, '&'));
    expect(new Set(addresses)).toEqual(new Set([link]));
  });

  it('keeps a plain-text version a text-only client can use on its own', () => {
    const { text } = signInEmail(link, minutes);
    expect(text).toMatch(/^Sign in to LeafLock PDF: https:\/\//);
    expect(text).not.toMatch(/<\w+/);
  });
});

describe('requesting a sign-in link', () => {
  it('sends the HTML button and the plain text together through the email provider', async () => {
    const { onRequestPost } = await import('../../functions/api/auth/request-link');
    const { createFakeD1 } = await import('./server/fakeD1');
    const { vi } = await import('vitest');
    const { db } = createFakeD1();
    const sent: Array<Record<string, unknown>> = [];
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (_url, init) => {
      sent.push(JSON.parse(String((init as RequestInit).body)));
      return new Response('{}', { status: 200 });
    });
    try {
      const env = { DB: db, SESSION_IP_SALT: 's', RESEND_API_KEY: 're_test', EMAIL_FROM: 'hello@example.test' } as unknown as Env;
      const response = await onRequestPost({
        request: new Request('https://leaflockpdf.com/api/auth/request-link', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'cf-connecting-ip': '203.0.113.9' },
          body: JSON.stringify({ email: 'person@example.com' }),
        }),
        env,
      });
      expect(response.status).toBe(204);
      expect(sent).toHaveLength(1);
      const [message] = sent;
      expect(message?.['to']).toBe('person@example.com');
      expect(String(message?.['text'])).toMatch(/verify\?token=/);
      expect(String(message?.['html'])).toContain('>Sign in</a>');
      expect(String(message?.['html'])).toMatch(/href="https:\/\/leaflockpdf\.com\/api\/auth\/verify\?token=/);
    } finally {
      fetchSpy.mockRestore();
    }
  });
});
