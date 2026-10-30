-- The Practice tier (roadmap 4.9, priced 30 October 2026): a fourth value the plan column
-- has to accept. Pro, Practice and Business now sell different sets of tools, so the plan
-- stored here decides which, and src/lib/proAccess.ts ranks them.
--
-- The plan column carries a CHECK constraint from 0001, and SQLite cannot alter one in
-- place: a column constraint lives in the stored schema text, with no ALTER for it. So the
-- table is rebuilt, which is the documented SQLite recipe for exactly this change.
--
-- Note what is NOT renamed here. 'lifetime' is now sold as "Pro, ten years" for $120, but
-- the stored value keeps its original name: renaming it would mean a second rebuild plus a
-- data update, and nothing reads it as a word — src/lib/pricing.ts holds the term and the
-- price, and src/lib/proAccess.ts ranks 'lifetime' with Pro.

PRAGMA foreign_keys = OFF;

CREATE TABLE users_new (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  last_login_at INTEGER,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'lifetime', 'practice', 'business')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  dodo_customer_id TEXT,
  subscription_id TEXT,
  plan_status TEXT NOT NULL DEFAULT 'none',
  current_period_end INTEGER,
  password_hash TEXT,
  google_sub TEXT
);

INSERT INTO users_new (
  id, email, created_at, last_login_at, plan, status,
  dodo_customer_id, subscription_id, plan_status, current_period_end,
  password_hash, google_sub
)
SELECT
  id, email, created_at, last_login_at, plan, status,
  dodo_customer_id, subscription_id, plan_status, current_period_end,
  password_hash, google_sub
FROM users;

DROP TABLE users;

ALTER TABLE users_new RENAME TO users;

-- Rebuilt with the table: both indexes on users were dropped with it.
CREATE INDEX idx_users_subscription ON users (subscription_id);
CREATE UNIQUE INDEX idx_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL;

PRAGMA foreign_keys = ON;
