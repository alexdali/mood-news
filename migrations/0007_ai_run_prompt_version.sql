ALTER TABLE ai_runs
  ADD COLUMN prompt_version TEXT NOT NULL DEFAULT 'mood-v1';

CREATE INDEX idx_ai_runs_prompt_locale_article
  ON ai_runs(prompt_version, locale, article_id, created_at);
