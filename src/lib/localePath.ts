import { localeRegistry } from '../i18n/config';

const prefixes: ReadonlySet<string> = new Set(localeRegistry.filter((locale) => locale.code !== 'en').map((locale) => locale.path));

/**
 * A site path in the language the visitor is reading: "/login/" on a German page is "/de/login/". Client-only
 * code (islands that redirect or link) has no Astro locale helper, so it reads the first URL segment, as the
 * routes themselves do. English has no prefix.
 */
export function localePath(path: string, pathname: string = typeof window === 'undefined' ? '/' : window.location.pathname): string {
  const first = pathname.split('/')[1] ?? '';
  return prefixes.has(first) ? `/${first}${path}` : path;
}
