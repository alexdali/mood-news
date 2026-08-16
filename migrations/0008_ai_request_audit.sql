ALTER TABLE ai_runs ADD COLUMN cached_input_tokens INTEGER;
ALTER TABLE ai_runs ADD COLUMN cache_write_tokens INTEGER;
ALTER TABLE ai_runs ADD COLUMN cache_status TEXT;
ALTER TABLE ai_runs ADD COLUMN system_prompt TEXT;
ALTER TABLE ai_runs ADD COLUMN user_prompt TEXT;
ALTER TABLE ai_runs ADD COLUMN response_text TEXT;
ALTER TABLE ai_runs ADD COLUMN validation_details_json TEXT;

CREATE INDEX idx_ai_runs_status_created
  ON ai_runs(status, created_at DESC);
