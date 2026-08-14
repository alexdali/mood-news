import { describe, expect, it } from "vitest";
import { describeBbcFeed } from "@/config/sources";

describe("BBC source descriptors", () => {
  it("derives a stable source ID from the feed URL rather than list position", () => {
    const url = "https://feeds.bbci.co.uk/news/technology/rss.xml";
    expect(describeBbcFeed(url)).toEqual(describeBbcFeed(url));
    expect(describeBbcFeed(url).id).toMatch(/^bbc-rss-[a-f0-9]{12}$/);
  });

  it("keeps separate feeds distinct and human-readable", () => {
    const world = describeBbcFeed("https://feeds.bbci.co.uk/news/world/rss.xml");
    const business = describeBbcFeed("https://feeds.bbci.co.uk/news/business/rss.xml");
    expect(world.id).not.toBe(business.id);
    expect(world.name).toBe("BBC World");
    expect(business.name).toBe("BBC Business");
  });
});
