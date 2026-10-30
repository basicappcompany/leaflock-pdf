-- Paid plans, sold through Dodo Payments as merchant of record.
-- We store only what's needed to know which plan an account is on: no card details,
-- no billing address, no invoice contents — those stay with the payment provider.

ALTER TABLE users ADD COLUMN dodo_customer_id TEXT;
ALTER TABLE users ADD COLUMN subscription_id TEXT;

-- none | active | past_due | cancelled | expired.
-- "cancelled" still grants the plan until current_period_end, as terms.md §5 promises.
ALTER TABLE users ADD COLUMN plan_status TEXT NOT NULL DEFAULT 'none';

-- When the paid period runs out. NULL means it doesn't (the lifetime plan).
ALTER TABLE users ADD COLUMN current_period_end INTEGER;

CREATE INDEX idx_users_subscription ON users (subscription_id);

-- Webhooks are retried, so every delivery is recorded and replayed ones ignored.
CREATE TABLE webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  received_at INTEGER NOT NULL
);
