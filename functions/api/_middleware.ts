import { canonicalRedirect } from '../../src/lib/server/canonicalHost';
import { isSameOrigin } from '../../src/lib/server/sameOrigin';

/**
 * Scoped to /api/* on purpose. A root _middleware would turn every static asset request
 * into a Functions invocation, which is metered; the static site on pages.dev is public
 * content, and it is the API that must not answer on a host other than the apex.
 * 308, not 301, so a POST keeps its method and body.
 *
 * Two rules for every endpoint, so no handler has to remember them:
 *  1. Only the apex answers (above).
 *  2. A request that changes something (anything but GET, HEAD, OPTIONS) must come from a page on this site. The
 *     session cookie is SameSite=Lax, which already keeps a cross-site POST from carrying it; this makes the rule
 *     explicit for all of them instead of only the one endpoint that used to check. The two callers that are not
 *     pages are exempt and authenticate another way: Dodo's webhook (signature) and the scheduled sweep (bearer token).
 */
const NOT_FROM_A_PAGE = new Set(['/api/billing/webhook', '/api/billing/reconcile']);
const READ_ONLY = new Set(['GET', 'HEAD', 'OPTIONS']);

export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  const target = canonicalRedirect(request.url);
  if (target) return Response.redirect(target, 308);

  if (!READ_ONLY.has(request.method) && !NOT_FROM_A_PAGE.has(new URL(request.url).pathname) && !isSameOrigin(request)) {
    return new Response(null, { status: 403 });
  }
  return next();
};
