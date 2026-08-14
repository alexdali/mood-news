import type { NewsCardView } from "@/modules/news/view-models";
import { NewsCard } from "@/components/news-card";

export function NewsGrid({ items }: { items: NewsCardView[] }) {
  return <section className="news-grid" aria-label="Latest news">{items.map((item) => <NewsCard key={item.article.id} item={item} />)}</section>;
}
