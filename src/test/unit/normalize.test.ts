import { beforeEach, describe, expect, it } from "vitest";
import { resetEnvForTests } from "@/config/env";
import { normalizeNewsItem } from "@/modules/ingestion/normalize";

beforeEach(() => resetEnvForTests());

describe("news normalization", () => {
  it("sanitizes markup and canonicalizes tracking URLs", () => {
    const item = normalizeNewsItem({
      sourceId: "source",
      sourceItemId: "1",
      sourceName: "Source",
      canonicalUrl: "https://example.com/story/?utm_source=rss#section",
      title: "<b>Real</b> headline",
      summary: "<p>Useful&nbsp;summary</p>",
      section: null,
      language: "en",
      imageUrl: "javascript:alert(1)",
      byline: null,
      publishedAt: "2026-08-14T10:00:00Z",
      rawPayload: {},
    }, "2026-08-14T10:01:00Z");

    expect(item).not.toBeNull();
    expect(item?.title).toBe("Real headline");
    expect(item?.summary).toBe("Useful summary");
    expect(item?.canonicalUrl).toBe("https://example.com/story/");
    expect(item?.imageUrl).toBeNull();
  });

  it("drops incomplete or unsafe source items", () => {
    const base = {
      sourceId: "source", sourceItemId: "1", sourceName: "Source", title: "Title",
      summary: "Summary", section: null, language: "en", imageUrl: null, byline: null,
      publishedAt: "2026-08-14T10:00:00Z", rawPayload: {},
    };
    expect(normalizeNewsItem({ ...base, canonicalUrl: "file:///etc/passwd" })).toBeNull();
    expect(normalizeNewsItem({ ...base, canonicalUrl: "https://example.com", summary: "" })).toBeNull();
  });
});
