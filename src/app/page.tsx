import { getEnv } from "@/config/env";
import { isMood } from "@/domain/news/mood";
import { NewsQueryService } from "@/modules/news/news-query-service";
import { MoodSwitcher } from "@/components/mood-switcher";
import { NewsGrid } from "@/components/news-grid";
import { EmptyState } from "@/components/empty-state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mood?: string }> }) {
  const params = await searchParams;
  const selectedMood = isMood(params.mood) ? params.mood : getEnv().DEFAULT_MOOD;
  const items = new NewsQueryService().list({ mood: selectedMood });

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">One dataset · four readings</span>
          <h1>Change the emotional lens.<br />Keep every concrete fact fixed.</h1>
          <p>Fresh source fragments are rewritten by AI, then blocked from display unless deterministic checks preserve names, numbers, dates, places and quotations.</p>
        </div>
        <div className="hero__control"><span>Read the grid as</span><MoodSwitcher selected={selectedMood} /></div>
      </section>
      {items.length ? <NewsGrid items={items} /> : <EmptyState />}
    </>
  );
}
