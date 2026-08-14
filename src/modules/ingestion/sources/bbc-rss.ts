import Parser from "rss-parser";
import { sha256 } from "@/core/hash";
import { ExternalServiceError } from "@/core/errors";
import type { NewsSourceAdapter } from "@/modules/ingestion/source-adapter";
import type { SourceFetchResult } from "@/modules/ingestion/types";
import { fetchWithRetry } from "@/server/http-client";

const parser = new Parser({ timeout: 15_000 });

type BbcRssSourceInput = {
  id: string;
  name: string;
  feedUrl: string;
};

export class BbcRssSource implements NewsSourceAdapter {
  readonly metadata;

  constructor(private readonly input: BbcRssSourceInput) {
    this.metadata = {
      id: input.id,
      kind: "rss" as const,
      name: input.name,
      baseUrl: input.feedUrl,
      enabled: true,
      config: { feedUrl: input.feedUrl },
    };
  }

  async fetchLatest(): Promise<SourceFetchResult> {
    try {
      const response = await fetchWithRetry(this.input.feedUrl, {
        headers: { "user-agent": "MoodNewsGrid/0.1 (+educational prototype)" },
        cache: "no-store",
      }, { timeoutMs: 15_000, maxRetries: 1 });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const feed = await parser.parseString(await response.text());
      const items = feed.items.flatMap((item) => {
        const link = item.link?.trim();
        const title = item.title?.trim();
        const summary = item.contentSnippet ?? item.content ?? item.summary;
        if (!link || !title || !summary) return [];
        const publishedAt = item.isoDate ?? item.pubDate ?? new Date().toISOString();
        const sourceItemId = item.guid ?? link ?? sha256(`${title}:${publishedAt}`);
        const enclosure = item.enclosure as { url?: string } | undefined;
        return [{
          sourceId: this.metadata.id,
          sourceItemId,
          sourceName: feed.title ?? this.input.name,
          canonicalUrl: link,
          title,
          summary,
          section: null,
          language: "en",
          imageUrl: enclosure?.url ?? null,
          byline: (item as typeof item & { creator?: string }).creator ?? null,
          publishedAt,
          rawPayload: {
            guid: item.guid,
            title: item.title,
            link: item.link,
            pubDate: item.pubDate,
            isoDate: item.isoDate,
            contentSnippet: item.contentSnippet,
          },
        }];
      });
      return { sourceId: this.metadata.id, items };
    } catch (error) {
      throw new ExternalServiceError("BBC RSS", error instanceof Error ? error.message : String(error), {
        feedUrl: this.input.feedUrl,
      });
    }
  }
}
