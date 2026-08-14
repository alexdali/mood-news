import type { NormalizedNewsItem } from "@/modules/ingestion/types";

export function deduplicateItems(items: NormalizedNewsItem[]): NormalizedNewsItem[] {
  const byIdentity = new Map<string, NormalizedNewsItem>();
  for (const item of items) {
    const key = `${item.sourceId}:${item.sourceItemId}`;
    const previous = byIdentity.get(key);
    if (!previous || item.publishedAt > previous.publishedAt) byIdentity.set(key, item);
  }

  const seenUrls = new Set<string>();
  return [...byIdentity.values()]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .filter((item) => {
      if (seenUrls.has(item.canonicalUrl)) return false;
      seenUrls.add(item.canonicalUrl);
      return true;
    });
}
