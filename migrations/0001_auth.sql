-- Accounts, passwordless login, sessions, and the tables usage metering (Phase 2)
-- and abuse-resistant rate limiting will use. See CLAUDE.md and the Phase 1 plan:
-- no table here ever stores file content, file names, or raw IP addresses.

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'lifetime', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled'))
);

CREATE TABLE magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  consumed_at INTEGER,
  -- Salted hash of the requester's IP, never the raw address (see functions/api/auth/request-link.ts).
  request_ip_hash TEXT
);

CREATE INDEX idx_magic_links_email ON magic_links (email);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  secret_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  -- Browser family and major version only, e.g. "Chrome 141" (src/lib/errorReporting.ts's browserFamily()).
  browser TEXT
);

CREATE INDEX idx_sessions_user ON sessions (user_id);

-- Unused until Phase 2 (usage metering); created now so this migration doesn't need a second pass.
CREATE TABLE usage_counters (
  user_id TEXT NOT NULL,
  period TEXT NOT NULL,
  metric TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, period, metric)
);

-- Fixed-window counters for functions/api/auth/request-link.ts; see src/lib/server/rateLimit.ts.
CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);
