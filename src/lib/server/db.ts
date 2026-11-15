/**
 * Thin D1 wrapper for accounts, sessions and magic links. Keeps raw SQL in one place,
 * the same way src/lib/pdf/ops/index.ts centralises PDF operations.
 *
 * Server-only: nothing here ever runs in the browser bundle.
 */

export interface UserRow {
  id: string;
  email: string;
  created_at: number;
  last_login_at: number | null;
  /** `lifetime` is the ten-year Pro term; see src/lib/pricing.ts `proTenYear`. */
  plan: 'free' | 'pro' | 'lifetime' | 'practice' | 'business';
  status: 'active' | 'disabled';
  dodo_customer_id: string | null;
  subscription_id: string | null;
  plan_status: 'none' | 'active' | 'past_due' | 'cancelled' | 'expired';
  /** When the paid period ends. Null means it doesn't (the lifetime plan). */
  current_period_end: number | null;
  /** PBKDF2 hash; null when the account has no password set. */
  password_hash: string | null;
  /** Google's stable account id, when Google sign-in has been used. */
  google_sub: string | null;
  /** Dodo's timestamp (ms) of the newest billing event applied; an older one arriving later is ignored. */
  billing_event_at: number | null;
  /** When Dodo's API was last read for this account (ms). */
  billing_synced_at: number | null;
  /** The one-off ten-year payment, so a refund or lost dispute on it can be found. */
  dodo_payment_id: string | null;
}

export interface SessionRow {
  id: string;
  user_id: string;
  secret_hash: string;
  created_at: number;
  expires_at: number;
  last_seen_at: number;
  browser: string | null;
}

export interface MagicLinkRow {
  id: string;
  email: string;
  token_hash: string;
  created_at: number;
  expires_at: number;
  consumed_at: number | null;
  request_ip_hash: string | null;
}

export function newId(): string {
  return crypto.randomUUID();
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return (await db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()) ?? null;
}

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return (await db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()) ?? null;
}

export async function createUser(db: D1Database, email: string, now: number): Promise<UserRow> {
  const id = newId();
  await db
    .prepare('INSERT INTO users (id, email, created_at, last_login_at, plan, status) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, email, now, now, 'free', 'active')
    .run();
  return {
    id,
    email,
    created_at: now,
    last_login_at: now,
    plan: 'free',
    status: 'active',
    dodo_customer_id: null,
    subscription_id: null,
    plan_status: 'none',
    current_period_end: null,
    password_hash: null,
    google_sub: null,
    billing_event_at: null,
    billing_synced_at: null,
    dodo_payment_id: null,
  };
}

export interface ExportedAccount {
  account: Omit<UserRow, 'password_hash'> & { password_set: boolean };
  sessions: { created_at: number; expires_at: number; last_seen_at: number; browser: string | null }[];
  login_events: { at: number; method: LoginMethod; browser: string | null }[];
  usage: { period: string; metric: string; count: number }[];
  /** Registry ids of the tools the account has starred, newest first. */
  starred_tools: string[];
}

/**
 * Everything we hold about one account, for the visitor to download.
 *
 * Deliberately never includes the password hash, session secrets or magic-link
 * tokens: those are credentials, and handing them out would be a security hole,
 * not a transparency measure. Whether a password exists is reported instead.
 * We hold no file data at all, so there is none to export.
 */
export async function exportAccount(db: D1Database, userId: string): Promise<ExportedAccount | null> {
  const user = await getUserById(db, userId);
  if (!user) return null;
  const { password_hash, ...rest } = user;

  const sessions = await db
    .prepare('SELECT created_at, expires_at, last_seen_at, browser FROM sessions WHERE user_id = ? ORDER BY created_at')
    .bind(userId)
    .all<ExportedAccount['sessions'][number]>();
  const loginEvents = await db
    .prepare('SELECT at, method, browser FROM login_events WHERE user_id = ? ORDER BY at')
    .bind(userId)
    .all<ExportedAccount['login_events'][number]>();
  const usage = await db
    .prepare('SELECT period, metric, count FROM usage_counters WHERE user_id = ? ORDER BY period')
    .bind(userId)
    .all<ExportedAccount['usage'][number]>();

  // Tolerant of a database that has not had migration 0006 applied yet: an export must never fail
  // because a convenience list is missing.
  let starred: string[] = [];
  try {
    starred = await listStarredTools(db, userId);
  } catch {
    starred = [];
  }

  return {
    account: { ...rest, password_set: password_hash !== null },
    sessions: sessions.results ?? [],
    login_events: loginEvents.results ?? [],
    usage: usage.results ?? [],
    starred_tools: starred,
  };
}

/**
 * Erases an account and everything attached to it, in one transaction so a
 * half-deleted account can't be left behind.
 *
 * Payment records are not ours to delete: Dodo is the merchant of record and has
 * its own retention duties under tax law (see privacy.md).
 */
export async function deleteAccount(db: D1Database, userId: string, email: string): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM login_events WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM usage_counters WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM magic_links WHERE email = ?').bind(email),
    db.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ]);
  // Its own statement, after the transaction: if migration 0006 has not been applied the table
  // does not exist, and that must not stop an account from being erased.
  try {
    await db.prepare('DELETE FROM starred_tools WHERE user_id = ?').bind(userId).run();
  } catch {
    /* No table, so nothing was stored. */
  }
}

/** The account's starred tool ids, newest first. */
export async function listStarredTools(db: D1Database, userId: string): Promise<string[]> {
  const rows = await db
    .prepare('SELECT tool_id FROM starred_tools WHERE user_id = ? ORDER BY position')
    .bind(userId)
    .all<{ tool_id: string }>();
  return (rows.results ?? []).map((row) => row.tool_id);
}

/** Replaces the account's starred list with `tools` (already validated, newest first), in one transaction. */
export async function replaceStarredTools(db: D1Database, userId: string, tools: string[], now: number): Promise<void> {
  await db.batch([
    db.prepare('DELETE FROM starred_tools WHERE user_id = ?').bind(userId),
    ...tools.map((tool, position) =>
      db
        .prepare('INSERT INTO starred_tools (user_id, tool_id, position, created_at) VALUES (?, ?, ?, ?)')
        .bind(userId, tool, position, now),
    ),
  ]);
}

export async function setPasswordHash(db: D1Database, userId: string, hash: string): Promise<void> {
  await db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(hash, userId).run();
}

export async function getUserByGoogleSub(db: D1Database, sub: string): Promise<UserRow | null> {
  return (await db.prepare('SELECT * FROM users WHERE google_sub = ?').bind(sub).first<UserRow>()) ?? null;
}

export async function linkGoogleAccount(db: D1Database, userId: string, sub: string): Promise<void> {
  await db.prepare('UPDATE users SET google_sub = ? WHERE id = ?').bind(sub, userId).run();
}

export async function touchLastLogin(db: D1Database, userId: string, now: number): Promise<void> {
  await db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, userId).run();
}

export type LoginMethod = 'link' | 'password' | 'google';

export async function insertLoginEvent(
  db: D1Database,
  args: { userId: string; method: LoginMethod; browser: string | null; now: number },
): Promise<void> {
  await db
    .prepare('INSERT INTO login_events (id, user_id, at, method, browser) VALUES (?, ?, ?, ?, ?)')
    .bind(newId(), args.userId, args.now, args.method, args.browser)
    .run();
}

/**
 * Records a successful sign-in: the latest time on the account, plus a history row.
 *
 * The history row is best effort. A failure writing it must never stop someone signing in,
 * so it is logged (no personal data in the message) and swallowed; the last-login update,
 * which sign-in already depended on, still throws.
 */
export async function recordLogin(
  db: D1Database,
  args: { userId: string; method: LoginMethod; browser: string | null; now: number },
): Promise<void> {
  await touchLastLogin(db, args.userId, args.now);
  try {
    await insertLoginEvent(db, args);
  } catch {
    console.error('login_events insert failed');
  }
}

export async function insertMagicLink(
  db: D1Database,
  args: { email: string; tokenHash: string; now: number; expiresAt: number; requestIpHash: string | null },
): Promise<void> {
  await db
    .prepare(
      'INSERT INTO magic_links (id, email, token_hash, created_at, expires_at, consumed_at, request_ip_hash) VALUES (?, ?, ?, ?, ?, NULL, ?)',
    )
    .bind(newId(), args.email, args.tokenHash, args.now, args.expiresAt, args.requestIpHash)
    .run();
}

/** Atomically marks a magic link consumed; returns it only if it existed, was unused and unexpired. */
export async function consumeMagicLink(db: D1Database, tokenHash: string, now: number): Promise<MagicLinkRow | null> {
  const row = await db
    .prepare(
      'UPDATE magic_links SET consumed_at = ? WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ? RETURNING *',
    )
    .bind(now, tokenHash, now)
    .first<MagicLinkRow>();
  return row ?? null;
}

export async function createSession(
  db: D1Database,
  args: { userId: string; secretHash: string; now: number; expiresAt: number; browser: string | null },
): Promise<string> {
  const id = newId();
  await db
    .prepare(
      'INSERT INTO sessions (id, user_id, secret_hash, created_at, expires_at, last_seen_at, browser) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(id, args.userId, args.secretHash, args.now, args.expiresAt, args.now, args.browser)
    .run();
  return id;
}

export async function getSession(db: D1Database, id: string): Promise<SessionRow | null> {
  return (await db.prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first<SessionRow>()) ?? null;
}

export async function touchSession(db: D1Database, id: string, now: number, expiresAt: number): Promise<void> {
  await db.prepare('UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?').bind(now, expiresAt, id).run();
}

export async function deleteSession(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
}

export interface PlanUpdate {
  plan: UserRow['plan'];
  planStatus: UserRow['plan_status'];
  currentPeriodEnd: number | null;
  dodoCustomerId: string | null;
  subscriptionId: string | null;
  /** The ten-year payment, when this update is about one. Left alone when absent. */
  paymentId?: string | null;
  /** Dodo's time for the event behind this update (ms). Recorded so an older event can be told apart. */
  eventAt?: number | null;
}

/**
 * Whether an error is only that migration 0008 (the billing sync columns) has not reached this database yet.
 * Billing must keep working through that gap: a deploy can land before the migration is applied, and a webhook
 * that failed here would leave a paying customer without their plan.
 */
function missingBillingColumns(error: unknown): boolean {
  return error instanceof Error && /no such column|has no column/i.test(error.message);
}

export async function setUserPlan(db: D1Database, userId: string, update: PlanUpdate, now: number = Date.now()): Promise<void> {
  try {
    await db
      .prepare(
        `UPDATE users SET plan = ?, plan_status = ?, current_period_end = ?,
         dodo_customer_id = COALESCE(?, dodo_customer_id), subscription_id = COALESCE(?, subscription_id),
         dodo_payment_id = COALESCE(?, dodo_payment_id),
         billing_event_at = COALESCE(?, billing_event_at), billing_synced_at = ?
         WHERE id = ?`,
      )
      .bind(
        update.plan,
        update.planStatus,
        update.currentPeriodEnd,
        update.dodoCustomerId,
        update.subscriptionId,
        update.paymentId ?? null,
        update.eventAt ?? null,
        now,
        userId,
      )
      .run();
  } catch (error) {
    if (!missingBillingColumns(error)) throw error;
    await db
      .prepare(
        `UPDATE users SET plan = ?, plan_status = ?, current_period_end = ?,
         dodo_customer_id = COALESCE(?, dodo_customer_id), subscription_id = COALESCE(?, subscription_id)
         WHERE id = ?`,
      )
      .bind(update.plan, update.planStatus, update.currentPeriodEnd, update.dodoCustomerId, update.subscriptionId, userId)
      .run();
  }
}

/** Records that Dodo was read for this account and agreed with what we hold, so it is not read again soon. */
export async function markBillingSynced(db: D1Database, userId: string, now: number): Promise<void> {
  try {
    await db.prepare('UPDATE users SET billing_synced_at = ? WHERE id = ?').bind(now, userId).run();
  } catch (error) {
    if (!missingBillingColumns(error)) throw error;
  }
}

export async function getUserByPayment(db: D1Database, paymentId: string): Promise<UserRow | null> {
  try {
    return (await db.prepare('SELECT * FROM users WHERE dodo_payment_id = ?').bind(paymentId).first<UserRow>()) ?? null;
  } catch (error) {
    if (missingBillingColumns(error)) return null;
    throw error;
  }
}

/**
 * Accounts whose billing has not been read from Dodo since `before`, stalest first: those holding a
 * Dodo subscription or payment id, which are the only ones Dodo can have something to say about. A paid plan with
 * no Dodo id (a manual grant) is left out on purpose: reconcileUser skips it without marking it read, so keeping
 * it in would let such rows fill the whole batch for ever. If an id is later attached it qualifies again.
 */
export async function listStaleBillingUsers(db: D1Database, before: number, limit: number): Promise<UserRow[]> {
  try {
    const result = await db
      .prepare(
        `SELECT * FROM users
         WHERE (subscription_id IS NOT NULL OR dodo_payment_id IS NOT NULL)
           AND (billing_synced_at IS NULL OR billing_synced_at < ?)
         ORDER BY COALESCE(billing_synced_at, 0) ASC
         LIMIT ?`,
      )
      .bind(before, limit)
      .all<UserRow>();
    return result.results ?? [];
  } catch (error) {
    if (missingBillingColumns(error)) return [];
    throw error;
  }
}

export async function getUserBySubscription(db: D1Database, subscriptionId: string): Promise<UserRow | null> {
  return (await db.prepare('SELECT * FROM users WHERE subscription_id = ?').bind(subscriptionId).first<UserRow>()) ?? null;
}

/**
 * Un-records a delivery whose handling failed, so Dodo's retry is processed rather than
 * acknowledged as a duplicate of something that never took effect.
 */
export async function forgetWebhook(db: D1Database, id: string): Promise<void> {
  await db.prepare('DELETE FROM webhook_events WHERE id = ?').bind(id).run();
}

/** Records a webhook delivery; returns false if that id has already been handled. */
export async function recordWebhookOnce(db: D1Database, id: string, type: string, now: number): Promise<boolean> {
  const row = await db
    .prepare('INSERT INTO webhook_events (id, type, received_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING RETURNING id')
    .bind(id, type, now)
    .first<{ id: string }>();
  return row !== null;
}
