ALTER TABLE news_articles
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS article_snapshots (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version >= 1),
  content_hash TEXT NOT NULL,
  normalized_payload_json TEXT NOT NULL,
  raw_payload_json TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE(article_id, version)
);

CREATE INDEX IF NOT EXISTS idx_article_snapshots_article_version
  ON article_snapshots(article_id, version DESC);
