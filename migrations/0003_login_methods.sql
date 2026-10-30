-- Two more ways into the same account, alongside the magic link from 0001.
--
-- An account is still identified by its email address, so signing in with Google lands
-- on the same account as a link sent to that address. Both columns are optional: an
-- account can have any combination of the three methods.

-- PBKDF2 hash, as "pbkdf2$<iterations>$<salt>$<hash>". Never the password itself.
ALTER TABLE users ADD COLUMN password_hash TEXT;

-- Google's stable account id ("sub"). Kept so a changed Google email still signs in.
ALTER TABLE users ADD COLUMN google_sub TEXT;

CREATE UNIQUE INDEX idx_users_google_sub ON users (google_sub) WHERE google_sub IS NOT NULL;
