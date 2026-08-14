ALTER TABLE validation_runs RENAME TO validation_runs_legacy;
ALTER TABLE rewrites RENAME TO rewrites_legacy;

CREATE TABLE rewrites (
  id TEXT PRIMARY KEY,
  article_id TEXT NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ru')),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('validated', 'rejected', 'stale')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(article_id, mood, locale, prompt_version)
);

CREATE TABLE validation_runs (
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

INSERT INTO rewrites(
  id, article_id, mood, locale, title, summary, model, prompt_version,
  status, created_at, updated_at
)
SELECT
  id, article_id, mood, 'en', title, summary, model, prompt_version,
  status, created_at, updated_at
FROM rewrites_legacy;

INSERT INTO validation_runs(
  id, rewrite_id, passed, score, expected_count, preserved_count,
  missing_json, duplicate_json, unknown_json, added_facts_json,
  details_json, created_at
)
SELECT
  id, rewrite_id, passed, score, expected_count, preserved_count,
  missing_json, duplicate_json, unknown_json, added_facts_json,
  details_json, created_at
FROM validation_runs_legacy;

DROP TABLE validation_runs_legacy;
DROP TABLE rewrites_legacy;

CREATE INDEX idx_rewrites_article_mood
  ON rewrites(article_id, mood, locale, prompt_version);
CREATE INDEX idx_rewrites_status ON rewrites(status);
