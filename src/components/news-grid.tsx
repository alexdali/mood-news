import type { NewsCardView } from "@/modules/news/view-models";
import { NewsCard } from "@/components/news-card";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function NewsGrid({ items, locale }: { items: NewsCardView[]; locale: Locale }) {
  return <section className="news-grid" aria-label={uiCopy[locale].home.latest}>{items.map((item) => <NewsCard key={item.article.id} item={item} locale={locale} />)}</section>;
}
