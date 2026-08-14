PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sources (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  base_url TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  config_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingestion_runs (
  id TEXT PRIMARY KEY,
  trigger_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'partial', 'failed')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS ingestion_source_runs (
  id TEXT PRIMARY KEY,
  ingestion_run_id TEXT NOT NULL REFERENCES ingestion_runs(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL REFERENCES sources(id),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'skipped')),
  started_at TEXT NOT NULL,
  finished_at TEXT,
  fetched_count INTEGER NOT NULL DEFAULT 0,
  inserted_count INTEGER NOT NULL DEFAULT 0,
  updated_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS news_articles (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES sources(id),
  source_item_id TEXT NOT NULL,
  canonical_url TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  section TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  image_url TEXT,
  byline TEXT,
  published_at TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'stale', 'hidden')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(source_id, source_item_id),
  UNIQUE(canonical_url)
);

CREATE TABLE IF NOT EXISTS protected_facts (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  fact_type TEXT NOT NULL,
  value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  placeholder TEXT NOT NULL,
  source_field TEXT NOT NULL CHECK (source_field IN ('title', 'summary')),
  start_index INTEGER NOT NULL,
  end_index INTEGER NOT NULL,
  extractor TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(article_id, placeholder)
);

CREATE TABLE IF NOT EXISTS rewrites (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('validated', 'rejected', 'stale')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(article_id, mood, prompt_version)
);

CREATE TABLE IF NOT EXISTS validation_runs (
  id TEXT PRIMARY KEY,
  rewrite_id TEXT NOT NULL REFERENCES rewrites(id) ON DELETE CASCADE,
  passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
  score REAL NOT NULL,
  expected_count INTEGER NOT NULL,
  preserved_count INTEGER NOT NULL,
  missing_json TEXT NOT NULL DEFAULT '[]',
  duplicate_json TEXT NOT NULL DEFAULT '[]',
  unknown_json TEXT NOT NULL DEFAULT '[]',
  added_facts_json TEXT NOT NULL DEFAULT '[]',
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_runs (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  model_role TEXT NOT NULL CHECK (model_role IN ('primary', 'fallback', 'benchmark')),
  status TEXT NOT NULL CHECK (status IN ('completed', 'api_error', 'parse_error', 'validation_error', 'budget_blocked')),
  latency_ms INTEGER NOT NULL DEFAULT 0,
  input_tokens INTEGER,
  output_tokens INTEGER,
  reasoning_tokens INTEGER,
  cost_usd REAL,
  provider_request_id TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS job_locks (
  name TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);
