-- Feature requests and feedback sent from the forms at the bottom of the sidebar.
--
-- What a person chose to write, and nothing the browser knew without being told. A message and
-- the kind (feature request or general feedback); an email address only if they typed one in to
-- be replied to; the page path they were on (for example '/split-pdf', no query string, no
-- file). No IP address, raw or hashed: the hash is used only to count submissions for rate
-- limiting, in rate_limits, and is never written here. No account id, so a message cannot be
-- tied to an account unless the person put their email in it.
--
-- Not removed with an account (it is not linked to one). Anyone can ask for their message and
-- its email to be deleted; see privacy.md. Read from the owner's side with
--   wrangler d1 execute leaflock-pdf --remote --command "SELECT * FROM feedback ORDER BY created_at DESC"

CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('feature', 'feedback')),
  message TEXT NOT NULL,
  email TEXT,
  page TEXT
);

CREATE INDEX idx_feedback_created ON feedback (created_at);
