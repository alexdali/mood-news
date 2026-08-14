export type SourceRow = {
  id: string;
  kind: "rss" | "guardian";
  name: string;
  base_url: string;
  enabled: 0 | 1;
  config_json: string;
  created_at: string;
  updated_at: string;
};

export type NewsArticleRow = {
  id: string;
  source_id: string;
  source_name?: string;
  source_item_id: string;
  canonical_url: string;
  title: string;
  summary: string;
  section: string | null;
  language: string;
  image_url: string | null;
  byline: string | null;
  published_at: string;
  fetched_at: string;
  content_hash: string;
  version: number;
  raw_payload_json: string;
  status: "active" | "stale" | "hidden";
  created_at: string;
  updated_at: string;
};

export type ProtectedFactRow = {
  id: string;
  article_id: string;
  fact_type: string;
  value: string;
  normalized_value: string;
  placeholder: string;
  source_field: "title" | "summary";
  start_index: number;
  end_index: number;
  extractor: string;
  created_at: string;
};

export type RewriteRow = {
  id: string;
  article_id: string;
  mood: string;
  title: string;
  summary: string;
  model: string;
  prompt_version: string;
  status: "validated" | "rejected" | "stale";
  created_at: string;
  updated_at: string;
};

export type ValidationRunRow = {
  id: string;
  rewrite_id: string;
  passed: 0 | 1;
  score: number;
  expected_count: number;
  preserved_count: number;
  missing_json: string;
  duplicate_json: string;
  unknown_json: string;
  added_facts_json: string;
  details_json: string;
  created_at: string;
};
