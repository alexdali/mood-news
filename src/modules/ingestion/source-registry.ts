import { getEnv } from "@/config/env";
import { describeBbcFeed } from "@/config/sources";
import type { NewsSourceAdapter } from "@/modules/ingestion/source-adapter";
import { BbcRssSource } from "@/modules/ingestion/sources/bbc-rss";
import { GuardianSource } from "@/modules/ingestion/sources/guardian";

export function buildSourceRegistry(): NewsSourceAdapter[] {
  const env = getEnv();
  const sources: NewsSourceAdapter[] = [];
  if (env.BBC_ENABLED) {
    env.BBC_RSS_FEEDS.forEach((feedUrl) => {
      const descriptor = describeBbcFeed(feedUrl);
      sources.push(new BbcRssSource({
        id: descriptor.id,
        name: descriptor.name,
        feedUrl,
      }));
    });
  }
  if (env.GUARDIAN_ENABLED && env.GUARDIAN_API_KEY) sources.push(new GuardianSource());
  return sources;
}
