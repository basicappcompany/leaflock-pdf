/**
 * Google sign-in, using the plain redirect (authorization code) flow.
 *
 * The browser navigates to Google and back; nothing of Google's is ever loaded on our
 * origin. That matters here: a one-tap button or their SDK would need `script-src` and
 * `connect-src` opened up, and the CSP is the privacy promise (see astro.config.mjs).
 * A navigation isn't covered by those directives, so this costs us no exception.
 */

const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export const GOOGLE_STATE_COOKIE = 'leaflock_oauth_state';

export function googleConfigured(env: Env): boolean {
  return Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/auth/google/callback`;
}

/** Where to send the browser to start sign-in. `state` guards against a forged callback. */
export function authorizeUrl(env: Env, origin: string, state: string): string {
  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set('client_id', env.GOOGLE_CLIENT_ID ?? '');
  url.searchParams.set('redirect_uri', redirectUri(origin));
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email');
  url.searchParams.set('state', state);
  // We only ever want the address, so don't ask for anything that needs consent again.
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

export interface GoogleIdentity {
  sub: string;
  email: string;
  emailVerified: boolean;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Trades the code Google sent back for the identity behind it.
 *
 * The id_token's signature isn't checked separately, and doesn't need to be: it comes
 * straight from Google's token endpoint over TLS, authenticated with our client secret.
 * Google's own documentation treats that as sufficient.
 */
export async function exchangeCode(env: Env, origin: string, code: string): Promise<GoogleIdentity | null> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID ?? '',
      client_secret: env.GOOGLE_CLIENT_SECRET ?? '',
      redirect_uri: redirectUri(origin),
      grant_type: 'authorization_code',
    }),
  });
  if (!response.ok) {
    console.error('google token exchange failed', response.status);
    return null;
  }

  const body = (await response.json()) as { id_token?: string };
  if (!body.id_token) return null;
  const claims = decodeJwtPayload(body.id_token);
  if (!claims) return null;

  const sub = typeof claims['sub'] === 'string' ? claims['sub'] : null;
  const email = typeof claims['email'] === 'string' ? claims['email'].toLowerCase() : null;
  // Google sets this false for addresses it hasn't confirmed; those must not be trusted
  // to claim an existing account.
  const emailVerified = claims['email_verified'] === true || claims['email_verified'] === 'true';
  if (!sub || !email) return null;

  return { sub, email, emailVerified };
}
