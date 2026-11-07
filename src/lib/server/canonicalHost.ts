/**
 * Which hostnames may serve /api/*, and where everything else is sent.
 *
 * The Pages project is reachable at <name>.pages.dev and at every preview hostname as well
 * as the apex. Sign-in and magic links build their URLs from the request origin, so an API
 * call on any of those hosts would run real flows against whatever D1 that deployment is
 * bound to. The API answers only on the apex (and on localhost, for `wrangler pages dev`).
 */

export const CANONICAL_HOST = 'leaflockpdf.com';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/** The URL to redirect to, or null when this request's host may be served as-is. */
export function canonicalRedirect(requestUrl: string): string | null {
  const url = new URL(requestUrl);
  if (url.hostname === CANONICAL_HOST || LOCAL_HOSTS.has(url.hostname)) return null;
  return `https://${CANONICAL_HOST}${url.pathname}${url.search}`;
}
