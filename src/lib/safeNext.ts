/**
 * Where to go after signing in, accepted only if it is a plain path on this site. Anything else (another host, a
 * protocol-relative "//", a backslash, a script URL, an odd character) is dropped, so the sign-in links cannot be
 * turned into an open redirect. Shared by the pages and the server.
 */
export function safeNext(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 120) return null;
  if (!/^\/[A-Za-z0-9\-_./]*$/.test(value) || value.startsWith('//') || value.includes('..')) return null;
  if (value.startsWith('/api/')) return null;
  return value;
}
