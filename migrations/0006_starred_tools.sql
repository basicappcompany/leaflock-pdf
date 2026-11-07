-- Starred (favourite) tools, so a signed-in visitor sees the same list in every browser.
--
-- A tool id (the registry id, such as 'merge') and its place in the list, and nothing else:
-- no file, no file name, no page text. Without an account the same list lives only in the
-- browser's localStorage (src/lib/starred.ts); this table exists only for the people who sign
-- in. It is replaced as a whole by PUT /api/starred, included in the account export and
-- deleted with the account (src/lib/server/db.ts).

CREATE TABLE starred_tools (
  user_id TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, tool_id)
);

CREATE INDEX idx_starred_tools_user ON starred_tools (user_id, position);
