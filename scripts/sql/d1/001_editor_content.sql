CREATE TABLE IF NOT EXISTS editor_content (
  key TEXT PRIMARY KEY,
  payload TEXT NOT NULL DEFAULT '{}',
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
