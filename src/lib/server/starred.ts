/**
 * Server-side rules for the starred-tools list. Pure functions, so they can be unit-tested
 * without a database or a request.
 */

/** More than the number of tools there will ever be; a bound on what one account can store. */
export const MAX_STARRED = 100;

/** A registry tool id: lower-camel, letters and digits. Matches every id in src/tools/registry.ts. */
const TOOL_ID = /^[a-z][a-zA-Z0-9]{0,39}$/;

/**
 * The ids from a request body, or null when the body is not `{ tools: string[] }`.
 *
 * Anything that is not a plausible tool id is rejected outright rather than skipped, because
 * a client that sends junk is a client with a bug, and silently storing a partial list would
 * hide it. Duplicates are collapsed, keeping the first (newest) position.
 */
export function parseStarredBody(raw: unknown): string[] | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const tools = (raw as Record<string, unknown>)['tools'];
  if (!Array.isArray(tools) || tools.length > MAX_STARRED) return null;
  const seen = new Set<string>();
  for (const item of tools) {
    if (typeof item !== 'string' || !TOOL_ID.test(item)) return null;
    seen.add(item);
  }
  return [...seen];
}

/**
 * An opaque, stable name for an account that the browser can store and compare, so a list
 * synced for one person is never merged into another's. A hash of the user id, shortened:
 * it identifies nobody and cannot be reversed to the id.
 */
export async function accountKey(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`starred:${userId}`));
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
