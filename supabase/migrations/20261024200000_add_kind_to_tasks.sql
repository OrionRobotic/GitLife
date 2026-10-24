-- Tasks are either short or long; existing tasks become short.
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'short'
  CHECK (kind IN ('short', 'long'));
