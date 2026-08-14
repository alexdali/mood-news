import { getEnv } from "@/config/env";
import { sha256 } from "@/core/hash";

export type SourceConfig = {
  id: string;
  kind: "rss" | "guardian";
  name: string;
  baseUrl: string;
  enabled: boolean;
};

export function describeBbcFeed(feedUrl: string): { id: string; name: string } {
  const lower = feedUrl.toLowerCase();
  const name = lower.includes("technology")
    ? "BBC Technology"
    : lower.includes("business")
      ? "BBC Business"
      : lower.includes("world")
        ? "BBC World"
        : "BBC Top Stories";

  // The source ID is derived from the URL rather than array order, so changing
  // the order in BBC_RSS_FEEDS never rewrites provenance for existing records.
  return {
    id: `bbc-rss-${sha256(feedUrl).slice(0, 12)}`,
    name,
  };
}

export function getConfiguredSources(): SourceConfig[] {
  const env = getEnv();
  const sources: SourceConfig[] = [];

  if (env.BBC_ENABLED) {
    env.BBC_RSS_FEEDS.forEach((url) => {
      const descriptor = describeBbcFeed(url);
      sources.push({
        id: descriptor.id,
        kind: "rss",
        name: descriptor.name,
        baseUrl: url,
        enabled: true,
      });
    });
  }

  if (env.GUARDIAN_ENABLED) {
    sources.push({
      id: "guardian-open-platform",
      kind: "guardian",
      name: "The Guardian Open Platform",
      baseUrl: "https://content.guardianapis.com/search",
      enabled: Boolean(env.GUARDIAN_API_KEY),
    });
  }

  return sources;
}
