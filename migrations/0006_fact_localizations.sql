CREATE TABLE protected_fact_localizations (
  id TEXT PRIMARY KEY,
  fact_id TEXT NOT NULL REFERENCES protected_facts(id) ON DELETE CASCADE,
  locale TEXT NOT NULL CHECK (locale IN ('en', 'ru')),
  value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(fact_id, locale)
);

CREATE INDEX idx_fact_localizations_locale
  ON protected_fact_localizations(locale, fact_id);

INSERT INTO protected_fact_localizations(
  id, fact_id, locale, value, normalized_value, model, created_at, updated_at
)
SELECT
  'fact_locale_' || lower(hex(randomblob(16))),
  id,
  'en',
  value,
  normalized_value,
  'source',
  created_at,
  created_at
FROM protected_facts;
