import { describe, expect, it } from 'vitest';
import { onRequestGet as callback } from '../../../functions/api/auth/google/callback';
import { onRequestGet as start } from '../../../functions/api/auth/google/start';
import { GOOGLE_STATE_COOKIE, authorizeUrl, googleConfigured, redirectUri } from '../../../src/lib/server/google';

const real = { GOOGLE_CLIENT_ID: '1234567890-abc.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'GOCSPX-realsecretvalue' };
const asEnv = (values: Record<string, string | undefined>) => values as unknown as Env;
const origin = 'https://leaflockpdf.com';

describe('googleConfigured', () => {
  it('is true for a real-looking client', () => {
    expect(googleConfigured(asEnv(real))).toBe(true);
  });

  it('is false when either value is missing or blank', () => {
    expect(googleConfigured(asEnv({}))).toBe(false);
    expect(googleConfigured(asEnv({ GOOGLE_CLIENT_ID: real.GOOGLE_CLIENT_ID }))).toBe(false);
    expect(googleConfigured(asEnv({ ...real, GOOGLE_CLIENT_SECRET: '   ' }))).toBe(false);
  });

  it('rejects stand-ins, which are shaped like real ids and drew a button Google answered with 401', () => {
    expect(googleConfigured(asEnv({ GOOGLE_CLIENT_ID: 'dummy-local-id.apps.googleusercontent.com', GOOGLE_CLIENT_SECRET: 'dummy-secret' }))).toBe(false);
    expect(googleConfigured(asEnv({ ...real, GOOGLE_CLIENT_SECRET: 'changeme' }))).toBe(false);
    expect(googleConfigured(asEnv({ ...real, GOOGLE_CLIENT_ID: 'not-a-google-client-id' }))).toBe(false);
  });
});

describe('the sign-in redirect', () => {
  it('asks Google for the address only, back to our own callback, with the state we made', () => {
    const url = new URL(authorizeUrl(asEnv(real), origin, 'abc123'));
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe(real.GOOGLE_CLIENT_ID);
    expect(url.searchParams.get('redirect_uri')).toBe(`${origin}/api/auth/google/callback`);
    expect(redirectUri(origin)).toBe(url.searchParams.get('redirect_uri'));
    expect(url.searchParams.get('scope')).toBe('openid email');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('state')).toBe('abc123');
  });

  it('start sends the browser to Google and sets a short-lived state cookie that matches', async () => {
    const response = await start({ request: new Request(`${origin}/api/auth/google/start`), env: asEnv(real) });
    expect(response.status).toBe(302);
    const location = new URL(response.headers.get('Location')!);
    expect(location.host).toBe('accounts.google.com');
    const cookie = response.headers.get('Set-Cookie')!;
    const state = new RegExp(`${GOOGLE_STATE_COOKIE}=([0-9a-f]{32});`).exec(cookie)?.[1];
    expect(state, 'a 128-bit random state in the cookie').toBeDefined();
    expect(location.searchParams.get('state')).toBe(state);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Max-Age=600/);
  });

  it('start does not send anyone to Google when it is not configured', async () => {
    const response = await start({ request: new Request(`${origin}/api/auth/google/start`), env: asEnv({}) });
    expect(response.headers.get('Location')).toBe(`${origin}/login?error=google_unavailable`);
  });
});

describe('the callback', () => {
  const call = (query: string, cookie?: string) =>
    callback({
      request: new Request(`${origin}/api/auth/google/callback${query}`, cookie ? { headers: { cookie } } : {}),
      env: asEnv(real),
    });

  it('returns to the form with no error when the person cancels', async () => {
    const response = await call('?error=access_denied&state=abc');
    expect(response.headers.get('Location')).toBe(`${origin}/login`);
  });

  it('refuses a callback we did not start: no cookie, or a different state', async () => {
    expect((await call('?code=x&state=abc')).headers.get('Location')).toBe(`${origin}/login?error=google_failed`);
    const wrong = await call('?code=x&state=abc', `${GOOGLE_STATE_COOKIE}=def`);
    expect(wrong.headers.get('Location')).toBe(`${origin}/login?error=google_failed`);
  });

  it('refuses a callback with no code', async () => {
    const response = await call('?state=abc', `${GOOGLE_STATE_COOKIE}=abc`);
    expect(response.headers.get('Location')).toBe(`${origin}/login?error=google_failed`);
  });
});
