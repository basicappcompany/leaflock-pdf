import { canonicalRedirect } from '../../src/lib/server/canonicalHost';

/**
 * Scoped to /api/* on purpose. A root _middleware would turn every static asset request
 * into a Functions invocation, which is metered; the static site on pages.dev is public
 * content, and it is the API that must not answer on a host other than the apex.
 * 308, not 301, so a POST keeps its method and body.
 */
export const onRequest: PagesFunction<Env> = async ({ request, next }) => {
  const target = canonicalRedirect(request.url);
  if (target) return Response.redirect(target, 308);
  return next();
};
