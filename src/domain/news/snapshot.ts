export type ArticleSnapshot = {
  id: string;
  articleId: string;
  version: number;
  contentHash: string;
  normalizedPayload: Record<string, unknown>;
  rawPayload: unknown;
  fetchedAt: string;
  createdAt: string;
};
