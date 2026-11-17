-- All tables are prefixed upsc_ so they never collide with anything else in the "resources" database.
CREATE TABLE IF NOT EXISTS upsc_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  salt TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS upsc_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_seen INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS upsc_progress (
  user_id INTEGER NOT NULL,
  topic_id TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, topic_id)
);
CREATE TABLE IF NOT EXISTS upsc_resources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  kind TEXT NOT NULL DEFAULT 'pdf',
  url TEXT NOT NULL,
  file_id TEXT,
  description TEXT DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 100,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS upsc_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
