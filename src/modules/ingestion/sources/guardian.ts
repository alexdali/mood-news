import { z } from "zod";
import { getEnv } from "@/config/env";
import { ExternalServiceError } from "@/core/errors";
import type { NewsSourceAdapter } from "@/modules/ingestion/source-adapter";
import type { SourceFetchResult } from "@/modules/ingestion/types";
import { fetchWithRetry } from "@/server/http-client";

const responseSchema = z.object({
  response: z.object({
    status: z.string(),
    results: z.array(z.object({
      id: z.string(),
      type: z.string().optional(),
      sectionId: z.string().optional(),
      sectionName: z.string().optional(),
      webPublicationDate: z.string(),
      webTitle: z.string(),
      webUrl: z.string().url(),
      fields: z.object({
        headline: z.string().optional(),
        trailText: z.string().optional(),
        thumbnail: z.string().url().optional(),
        byline: z.string().optional(),
        publication: z.string().optional(),
      }).optional(),
    })),
  }),
});

export class GuardianSource implements NewsSourceAdapter {
  readonly metadata = {
    id: "guardian-open-platform",
    kind: "guardian" as const,
    name: "The Guardian Open Platform",
    baseUrl: "https://content.guardianapis.com/search",
    enabled: true,
    config: { orderBy: "newest" },
  };

  async fetchLatest(): Promise<SourceFetchResult> {
    const env = getEnv();
    if (!env.GUARDIAN_API_KEY) return { sourceId: this.metadata.id, items: [] };

    const url = new URL(this.metadata.baseUrl);
    url.searchParams.set("api-key", env.GUARDIAN_API_KEY);
    url.searchParams.set("order-by", "newest");
    url.searchParams.set("page-size", String(env.GUARDIAN_PAGE_SIZE));
    url.searchParams.set("show-fields", "headline,trailText,thumbnail,byline,publication");

    try {
      const response = await fetchWithRetry(url, {
        headers: { "user-agent": "MoodNewsGrid/0.1 (+educational prototype)" },
        cache: "no-store",
      }, { timeoutMs: 15_000, maxRetries: 1 });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = responseSchema.parse(await response.json());
      if (parsed.response.status.toLowerCase() !== "ok") throw new Error(`Guardian response status: ${parsed.response.status}`);
      const items = parsed.response.results.flatMap((item) => {
        const summary = item.fields?.trailText;
        if (!summary) return [];
        return [{
          sourceId: this.metadata.id,
          sourceItemId: item.id,
          sourceName: item.fields?.publication ?? "The Guardian",
          canonicalUrl: item.webUrl,
          title: item.fields?.headline ?? item.webTitle,
          summary,
          section: item.sectionName ?? item.sectionId ?? null,
          language: "en",
          imageUrl: item.fields?.thumbnail ?? null,
          byline: item.fields?.byline ?? null,
          publishedAt: item.webPublicationDate,
          rawPayload: item,
        }];
      });
      return { sourceId: this.metadata.id, items };
    } catch (error) {
      throw new ExternalServiceError("Guardian Open Platform", error instanceof Error ? error.message : String(error));
    }
  }
}
