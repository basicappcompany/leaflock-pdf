/**
 * Daily job allowances for the free tier, counted in usage_counters.
 *
 * One row per user per UTC day, so the daily reset is implicit in the period key and
 * needs no rollover logic (unlike src/lib/server/rateLimit.ts, which visitors with no
 * account use instead, keyed by hashed IP because they have no user row).
 *
 * Only a count is ever stored: never a file name, a file size, or anything about the
 * document itself. Paid plans aren't counted at all.
 */

/**
 * Daily job allowance for a signed-in free account. Confirmed by the owner
 * 28 October 2026, kept at roughly 3x the anonymous allowance so an account still buys
 * something real without being a number anyone normal ever hits.
 */
export const FREE_ACCOUNT_DAILY_JOBS = 60;
/**
 * Daily job allowance for visitors with no account. Confirmed by the owner
 * 28 October 2026: raised from 5 so it stops gating casual, one-off use — the work runs
 * on the visitor's own device either way, so the cap is a positioning lever, not a cost
 * control. Conversion pressure comes from Pro-tool access and real volume, not this
 * number. See docs/roadmap.md Phase 4 and docs/TODO.md §5.
 */
export const ANONYMOUS_DAILY_JOBS = 20;

/** UTC day, e.g. "2026-10-22": the period key one day's counter lives under. */
export function dayKey(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

/**
 * Today's count for one user, without changing it.
 *
 * Separate from claimDailyJob because the dashboard has to be able to show the meter
 * without spending an allowance to read it.
 */
export async function readDailyJobs(db: D1Database, userId: string, now = Date.now()): Promise<number> {
  const row = await db
    .prepare(`SELECT count FROM usage_counters WHERE user_id = ? AND period = ? AND metric = 'jobs'`)
    .bind(userId, dayKey(now))
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/** Counts one job against today's allowance and says whether it was within it. */
export async function claimDailyJob(
  db: D1Database,
  userId: string,
  limit: number,
  now = Date.now(),
): Promise<{ allowed: boolean; count: number }> {
  const row = await db
    .prepare(
      `INSERT INTO usage_counters (user_id, period, metric, count) VALUES (?, ?, 'jobs', 1)
       ON CONFLICT(user_id, period, metric) DO UPDATE SET count = usage_counters.count + 1
       RETURNING count`,
    )
    .bind(userId, dayKey(now))
    .first<{ count: number }>();
  const count = row?.count ?? 1;
  return { allowed: count <= limit, count };
}
