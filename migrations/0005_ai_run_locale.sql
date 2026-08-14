ALTER TABLE ai_runs
  ADD COLUMN locale TEXT NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ru'));

CREATE INDEX idx_ai_runs_locale_created
  ON ai_runs(locale, created_at);
