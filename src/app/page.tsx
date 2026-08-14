import { getEnv } from "@/config/env";
import { isMood } from "@/domain/news/mood";
import { NewsQueryService } from "@/modules/news/news-query-service";
import { MoodSwitcher } from "@/components/mood-switcher";
import { NewsGrid } from "@/components/news-grid";
import { EmptyState } from "@/components/empty-state";
import { getLocale, uiCopy } from "@/i18n/ui";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ mood?: string; lang?: string }> }) {
  const params = await searchParams;
  const selectedMood = isMood(params.mood) ? params.mood : getEnv().DEFAULT_MOOD;
  const locale = getLocale(params.lang);
  const copy = uiCopy[locale];
  const items = new NewsQueryService().list({ mood: selectedMood, locale });

  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">{copy.home.eyebrow}</span>
          <h1>{copy.home.titleTop}<br />{copy.home.titleBottom}</h1>
          <p>{copy.home.intro}</p>
        </div>
        <div className="hero__control"><span>{copy.home.readAs}</span><MoodSwitcher selected={selectedMood} locale={locale} /></div>
      </section>
      {items.length ? <NewsGrid items={items} locale={locale} /> : <EmptyState locale={locale} />}
    </>
  );
}
