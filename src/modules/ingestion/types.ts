export type RawNewsItem = {
  sourceId: string;
  sourceItemId: string;
  sourceName: string;
  canonicalUrl: string;
  title: string;
  summary: string;
  section: string | null;
  language: string;
  imageUrl: string | null;
  byline: string | null;
  publishedAt: string;
  rawPayload: unknown;
};

export type NormalizedNewsItem = RawNewsItem & {
  fetchedAt: string;
  contentHash: string;
};

export type SourceFetchResult = {
  sourceId: string;
  items: RawNewsItem[];
};
