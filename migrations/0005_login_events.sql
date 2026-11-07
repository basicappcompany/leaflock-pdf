-- One row per successful sign-in, so there is a history and not only the latest time.
--
-- users.last_login_at keeps being updated as before; this adds who, when, how, and from
-- which browser family. Like sessions.browser it holds the family and major version only
-- ("Chrome 141"). No IP address, raw or hashed, and nothing about files. Deleted with the
-- account (src/lib/server/db.ts deleteAccount) and included in the account export.

CREATE TABLE login_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  at INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('link', 'password', 'google')),
  browser TEXT
);

CREATE INDEX idx_login_events_user ON login_events (user_id, at);
