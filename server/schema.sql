-- Resources portal schema (Cloudflare D1 / SQLite). All tables are prefixed rp_ so they never clash with other tables in the same database.
CREATE TABLE IF NOT EXISTS rp_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  pass_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  status TEXT NOT NULL DEFAULT 'unverified',
  career_roles TEXT NOT NULL DEFAULT '[]',
  plan TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);
CREATE TABLE IF NOT EXISTS rp_sessions (
  token_hash TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS rp_idx_sessions_user ON rp_sessions(user_id);
CREATE TABLE IF NOT EXISTS rp_otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL COLLATE NOCASE,
  purpose TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rp_idx_otps_email ON rp_otps(email, purpose, created_at);
CREATE TABLE IF NOT EXISTS rp_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  career_roles TEXT NOT NULL DEFAULT '[]',
  ik_folder TEXT NOT NULL,
  pages INTEGER NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rp_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  career_roles TEXT NOT NULL DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rp_connect_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  kind TEXT NOT NULL DEFAULT 'interview',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  company TEXT NOT NULL DEFAULT '',
  career_role TEXT NOT NULL DEFAULT '',
  year INTEGER,
  difficulty TEXT NOT NULL DEFAULT '',
  links TEXT NOT NULL DEFAULT '[]',
  anonymous INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);
CREATE INDEX IF NOT EXISTS rp_idx_connect_status ON rp_connect_posts(status, created_at);
CREATE TABLE IF NOT EXISTS rp_progress (
  user_id INTEGER NOT NULL,
  item_id TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, item_id)
);
CREATE TABLE IF NOT EXISTS rp_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rp_rate (
  bucket TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  reset_at INTEGER NOT NULL
);
-- Web team members (admin CMS)
CREATE TABLE IF NOT EXISTS rp_team_members (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  role_title TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  linkedin TEXT NOT NULL DEFAULT '',
  github TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS rp_doc_pages (
  doc_id INTEGER NOT NULL,
  page INTEGER NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  boxes TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (doc_id, page)
);
-- User feedback and suggestions (triggers admin email & shows in admin CMS)
CREATE TABLE IF NOT EXISTS rp_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'suggestion',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_reply TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Curated high-value certifications (free & paid with links, manageable via admin CMS)
CREATE TABLE IF NOT EXISTS rp_certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  provider TEXT NOT NULL,
  tier TEXT NOT NULL DEFAULT 'free',
  cost TEXT NOT NULL DEFAULT 'Free',
  role TEXT NOT NULL DEFAULT 'sde',
  url TEXT NOT NULL DEFAULT '',
  resources_url TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  published INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
-- Site settings & legal content (editable via admin CMS)
CREATE TABLE IF NOT EXISTS rp_site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
