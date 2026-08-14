CREATE INDEX IF NOT EXISTS idx_news_published_at ON news_articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_source_status ON news_articles(source_id, status);
CREATE INDEX IF NOT EXISTS idx_rewrites_article_mood ON rewrites(article_id, mood, prompt_version);
CREATE INDEX IF NOT EXISTS idx_rewrites_status ON rewrites(status);
CREATE INDEX IF NOT EXISTS idx_facts_article ON protected_facts(article_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_created_at ON ai_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_runs_article ON ai_runs(article_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON ingestion_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON app_events(created_at DESC);
