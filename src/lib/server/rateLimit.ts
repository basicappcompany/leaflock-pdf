/**
 * Fixed-window rate limiting backed by D1. A single upsert does the read-and-write
 * atomically, so concurrent requests can't race past the limit the way a KV
 * read-then-write could.
 */

export interface RateLimitResult {
  allowed: boolean;
  count: number;
}

export async function checkAndIncrement(
  db: D1Database,
  key: string,
  limit: number,
  windowSeconds: number,
  now = Date.now(),
  /** How much to add: one for a normal hit, more when offline runs are being reported. */
  by = 1,
): Promise<RateLimitResult> {
  const windowStart = Math.floor(now / 1000 / windowSeconds) * windowSeconds;
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET
         count = CASE WHEN rate_limits.window_start = excluded.window_start THEN rate_limits.count + excluded.count ELSE excluded.count END,
         window_start = excluded.window_start
       RETURNING count`,
    )
    .bind(key, windowStart, by)
    .first<{ count: number }>();
  const count = row?.count ?? by;
  return { allowed: count <= limit, count };
}
