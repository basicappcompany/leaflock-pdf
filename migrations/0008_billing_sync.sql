-- Dodo is the source of truth for who has paid; these columns let the copy we keep be checked and repaired.
-- They hold times and one payment id: nothing about the card, the invoice or the customer.

-- When the newest billing event applied to this account happened (Dodo's own timestamp, in ms). An older
-- event arriving later is ignored, because Dodo may deliver events out of order.
ALTER TABLE users ADD COLUMN billing_event_at INTEGER;

-- When we last read this account's subscription or payment from Dodo's API. The re-check goes
-- stalest first and skips accounts read recently.
ALTER TABLE users ADD COLUMN billing_synced_at INTEGER;

-- The one-off ten-year payment, so a refund or a lost dispute on it can be found. NULL for subscriptions.
ALTER TABLE users ADD COLUMN dodo_payment_id TEXT;

CREATE INDEX idx_users_billing_synced ON users (billing_synced_at) WHERE plan != 'free' OR subscription_id IS NOT NULL;
