/**
 * Minimal in-memory stand-in for D1Database. Not a general SQL engine — it only
 * understands the exact statements src/lib/server/{db,rateLimit}.ts issue, matched
 * by their normalised text, which is enough to unit-test the logic built on top of them.
 */
type Row = Record<string, unknown>;

function normalize(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim();
}

export function createFakeD1() {
  const users: Row[] = [];
  const magicLinks: Row[] = [];
  const sessions: Row[] = [];
  const loginEvents: Row[] = [];
  const rateLimits: Row[] = [];
  const usageCounters: Row[] = [];
  const webhookEvents: Row[] = [];
  const starredTools: Row[] = [];

  function run(sql: string, params: unknown[]): { row: Row | null; rows: Row[] } {
    const text = normalize(sql);

    if (text === 'SELECT * FROM users WHERE email = ?') {
      return { row: users.find((row) => row['email'] === params[0]) ?? null, rows: [] };
    }
    if (text === 'SELECT * FROM users WHERE id = ?') {
      return { row: users.find((row) => row['id'] === params[0]) ?? null, rows: [] };
    }
    if (text === 'INSERT INTO users (id, email, created_at, last_login_at, plan, status) VALUES (?, ?, ?, ?, ?, ?)') {
      const [id, email, created_at, last_login_at, plan, status] = params;
      // The columns migrations 0002/0003 add, with the defaults the real schema gives them.
      users.push({
        id, email, created_at, last_login_at, plan, status,
        dodo_customer_id: null, subscription_id: null, plan_status: 'none', current_period_end: null,
        password_hash: null, google_sub: null,
      });
      return { row: null, rows: [] };
    }
    if (text === 'UPDATE users SET password_hash = ? WHERE id = ?') {
      const row = users.find((row) => row['id'] === params[1]);
      if (row) row['password_hash'] = params[0];
      return { row: null, rows: [] };
    }
    if (text === 'UPDATE users SET google_sub = ? WHERE id = ?') {
      const row = users.find((row) => row['id'] === params[1]);
      if (row) row['google_sub'] = params[0];
      return { row: null, rows: [] };
    }
    if (text === 'SELECT * FROM users WHERE google_sub = ?') {
      return { row: users.find((row) => row['google_sub'] === params[0]) ?? null, rows: [] };
    }
    if (text === 'UPDATE users SET last_login_at = ? WHERE id = ?') {
      const row = users.find((row) => row['id'] === params[1]);
      if (row) row['last_login_at'] = params[0];
      return { row: null, rows: [] };
    }

    if (
      text ===
      'INSERT INTO magic_links (id, email, token_hash, created_at, expires_at, consumed_at, request_ip_hash) VALUES (?, ?, ?, ?, ?, NULL, ?)'
    ) {
      const [id, email, token_hash, created_at, expires_at, request_ip_hash] = params;
      magicLinks.push({ id, email, token_hash, created_at, expires_at, consumed_at: null, request_ip_hash });
      return { row: null, rows: [] };
    }
    if (text === 'UPDATE magic_links SET consumed_at = ? WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ? RETURNING *') {
      const [consumedAt, tokenHash, now] = params;
      const row = magicLinks.find((row) => row['token_hash'] === tokenHash && row['consumed_at'] === null && (row['expires_at'] as number) > (now as number));
      if (row) row['consumed_at'] = consumedAt;
      return { row: row ?? null, rows: [] };
    }

    if (text === 'INSERT INTO sessions (id, user_id, secret_hash, created_at, expires_at, last_seen_at, browser) VALUES (?, ?, ?, ?, ?, ?, ?)') {
      const [id, user_id, secret_hash, created_at, expires_at, last_seen_at, browser] = params;
      sessions.push({ id, user_id, secret_hash, created_at, expires_at, last_seen_at, browser });
      return { row: null, rows: [] };
    }
    if (text === 'SELECT * FROM sessions WHERE id = ?') {
      return { row: sessions.find((row) => row['id'] === params[0]) ?? null, rows: [] };
    }
    if (text === 'UPDATE sessions SET last_seen_at = ?, expires_at = ? WHERE id = ?') {
      const row = sessions.find((row) => row['id'] === params[2]);
      if (row) {
        row['last_seen_at'] = params[0];
        row['expires_at'] = params[1];
      }
      return { row: null, rows: [] };
    }
    if (text === 'DELETE FROM sessions WHERE id = ?') {
      const index = sessions.findIndex((row) => row['id'] === params[0]);
      if (index !== -1) sessions.splice(index, 1);
      return { row: null, rows: [] };
    }
    if (text === 'SELECT created_at, expires_at, last_seen_at, browser FROM sessions WHERE user_id = ? ORDER BY created_at') {
      const rows = sessions
        .filter((row) => row['user_id'] === params[0])
        .map(({ created_at, expires_at, last_seen_at, browser }) => ({ created_at, expires_at, last_seen_at, browser }));
      return { row: null, rows };
    }
    if (text === 'SELECT period, metric, count FROM usage_counters WHERE user_id = ? ORDER BY period') {
      const rows = usageCounters
        .filter((row) => row['user_id'] === params[0])
        .map(({ period, metric, count }) => ({ period, metric, count }));
      return { row: null, rows };
    }
    if (text === 'INSERT INTO login_events (id, user_id, at, method, browser) VALUES (?, ?, ?, ?, ?)') {
      const [id, user_id, at, method, browser] = params;
      loginEvents.push({ id, user_id, at, method, browser });
      return { row: null, rows: [] };
    }
    if (text === 'SELECT at, method, browser FROM login_events WHERE user_id = ? ORDER BY at') {
      const rows = loginEvents
        .filter((row) => row['user_id'] === params[0])
        .sort((a, b) => (a['at'] as number) - (b['at'] as number))
        .map(({ at, method, browser }) => ({ at, method, browser }));
      return { row: null, rows };
    }
    if (text === 'DELETE FROM login_events WHERE user_id = ?') {
      for (let i = loginEvents.length - 1; i >= 0; i--) if (loginEvents[i]!['user_id'] === params[0]) loginEvents.splice(i, 1);
      return { row: null, rows: [] };
    }
    if (text === 'SELECT tool_id FROM starred_tools WHERE user_id = ? ORDER BY position') {
      const rows = starredTools
        .filter((row) => row['user_id'] === params[0])
        .sort((a, b) => (a['position'] as number) - (b['position'] as number))
        .map(({ tool_id }) => ({ tool_id }));
      return { row: null, rows };
    }
    if (text === 'INSERT INTO starred_tools (user_id, tool_id, position, created_at) VALUES (?, ?, ?, ?)') {
      const [user_id, tool_id, position, created_at] = params;
      starredTools.push({ user_id, tool_id, position, created_at });
      return { row: null, rows: [] };
    }
    if (text === 'DELETE FROM starred_tools WHERE user_id = ?') {
      for (let i = starredTools.length - 1; i >= 0; i--) if (starredTools[i]!['user_id'] === params[0]) starredTools.splice(i, 1);
      return { row: null, rows: [] };
    }
    if (text === 'DELETE FROM sessions WHERE user_id = ?') {
      for (let i = sessions.length - 1; i >= 0; i--) if (sessions[i]!['user_id'] === params[0]) sessions.splice(i, 1);
      return { row: null, rows: [] };
    }
    if (text === 'DELETE FROM usage_counters WHERE user_id = ?') {
      for (let i = usageCounters.length - 1; i >= 0; i--) if (usageCounters[i]!['user_id'] === params[0]) usageCounters.splice(i, 1);
      return { row: null, rows: [] };
    }
    if (text === 'DELETE FROM magic_links WHERE email = ?') {
      for (let i = magicLinks.length - 1; i >= 0; i--) if (magicLinks[i]!['email'] === params[0]) magicLinks.splice(i, 1);
      return { row: null, rows: [] };
    }
    if (text === 'DELETE FROM users WHERE id = ?') {
      const index = users.findIndex((row) => row['id'] === params[0]);
      if (index !== -1) users.splice(index, 1);
      return { row: null, rows: [] };
    }

    if (text === 'INSERT INTO webhook_events (id, type, received_at) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING RETURNING id') {
      const [id, type, received_at] = params;
      if (webhookEvents.some((row) => row['id'] === id)) return { row: null, rows: [] };
      webhookEvents.push({ id, type, received_at });
      return { row: { id }, rows: [] };
    }
    if (text === 'DELETE FROM webhook_events WHERE id = ?') {
      const index = webhookEvents.findIndex((row) => row['id'] === params[0]);
      if (index !== -1) webhookEvents.splice(index, 1);
      return { row: null, rows: [] };
    }
    if (
      text ===
      'UPDATE users SET plan = ?, plan_status = ?, current_period_end = ?, dodo_customer_id = COALESCE(?, dodo_customer_id), subscription_id = COALESCE(?, subscription_id) WHERE id = ?'
    ) {
      const [plan, plan_status, current_period_end, customer, subscription, id] = params;
      const row = users.find((row) => row['id'] === id);
      if (row) {
        Object.assign(row, { plan, plan_status, current_period_end });
        if (customer !== null) row['dodo_customer_id'] = customer;
        if (subscription !== null) row['subscription_id'] = subscription;
      }
      return { row: null, rows: [] };
    }

    if (text.includes('INTO usage_counters')) {
      const [userId, period] = params as [string, string];
      let row = usageCounters.find((row) => row['user_id'] === userId && row['period'] === period && row['metric'] === 'jobs');
      if (!row) {
        row = { user_id: userId, period, metric: 'jobs', count: 1 };
        usageCounters.push(row);
      } else {
        row['count'] = (row['count'] as number) + 1;
      }
      return { row: { count: row['count'] }, rows: [] };
    }

    if (text.includes('INTO rate_limits')) {
      const [key, windowStart] = params as [string, number];
      let row = rateLimits.find((row) => row['key'] === key);
      if (!row) {
        row = { key, window_start: windowStart, count: 1 };
        rateLimits.push(row);
      } else if (row['window_start'] === windowStart) {
        row['count'] = (row['count'] as number) + 1;
      } else {
        row['window_start'] = windowStart;
        row['count'] = 1;
      }
      return { row: { count: row['count'] }, rows: [] };
    }

    throw new Error(`fakeD1: unrecognised statement: ${text}`);
  }

  interface Statement {
    sql: string;
    params: unknown[];
    bind(...params: unknown[]): Statement;
    run(): Promise<unknown>;
    first<T>(): Promise<T | null>;
    all(): Promise<unknown>;
  }

  const db = {
    prepare(sql: string): Statement {
      return {
        sql,
        params: [],
        bind(...params: unknown[]) {
          this.params = params;
          return this;
        },
        async run() {
          run(this.sql, this.params);
          return { success: true } as unknown;
        },
        async first<T>() {
          return (run(this.sql, this.params).row as T) ?? null;
        },
        async all<T>() {
          return { results: run(this.sql, this.params).rows as T[] } as unknown;
        },
      };
    },
    /** Real D1 applies a batch as one transaction; here the statements just run in order. */
    async batch(statements: Statement[]) {
      return statements.map((statement) => {
        run(statement.sql, statement.params);
        return { success: true };
      });
    },
  };

  return { db: db as unknown as D1Database, tables: { users, magicLinks, sessions, loginEvents, rateLimits, usageCounters, webhookEvents, starredTools } };
}
