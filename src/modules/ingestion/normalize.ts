import { articleContentHash } from "@/core/hash";
import { canonicalizeUrl, safeExternalUrl } from "@/core/url";
import { nowIso, toIso } from "@/core/time";
import { getEnv } from "@/config/env";
import { cleanSourceText, truncateText } from "@/modules/ingestion/text-cleaner";
import type { NormalizedNewsItem, RawNewsItem } from "@/modules/ingestion/types";

export function normalizeNewsItem(raw: RawNewsItem, fetchedAt = nowIso()): NormalizedNewsItem | null {
  const title = cleanSourceText(raw.title);
  const summary = truncateText(cleanSourceText(raw.summary), getEnv().MAX_ARTICLE_SUMMARY_CHARS);
  const safeUrl = safeExternalUrl(raw.canonicalUrl);
  if (!title || !summary || !safeUrl) return null;

  const publishedAt = toIso(raw.publishedAt, fetchedAt);
  const canonicalUrl = canonicalizeUrl(safeUrl);
  const normalized: NormalizedNewsItem = {
    ...raw,
    canonicalUrl,
    title,
    summary,
    imageUrl: safeExternalUrl(raw.imageUrl),
    byline: cleanSourceText(raw.byline) || null,
    publishedAt,
    fetchedAt,
    contentHash: articleContentHash({ title, summary, publishedAt }),
  };
  return normalized;
}
