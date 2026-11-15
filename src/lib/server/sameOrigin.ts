/**
 * Whether a state-changing request came from a page on this site. Browsers send `Origin` on every cross-site and
 * same-site POST and `Referer` on most; a request with neither is not from a page of ours and is refused.
 *
 * The session cookie is `SameSite=Lax`, which already keeps a cross-site POST from carrying it. This makes the
 * rule explicit, so it does not depend on a cookie attribute staying as it is.
 */
export function isSameOrigin(request: Request): boolean {
  const own = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin) return origin === own;
  const referer = request.headers.get('referer');
  if (!referer) return false;
  try {
    return new URL(referer).origin === own;
  } catch {
    return false;
  }
}
