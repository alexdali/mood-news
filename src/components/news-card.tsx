import Link from "next/link";
import { ArrowUpRight, Layers3 } from "lucide-react";
import type { NewsCardView } from "@/modules/news/view-models";
import { SourceBadge } from "@/components/source-badge";
import { TimeStamp } from "@/components/time-stamp";
import { FactLockBadge } from "@/components/fact-lock-badge";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function NewsCard({ item, locale }: { item: NewsCardView; locale: Locale }) {
  const href = `/news/${item.article.id}?mood=${item.selectedMood}&lang=${locale}`;
  return (
    <article className="news-card">
      <div
        className="news-card__visual"
        style={item.article.imageUrl ? { backgroundImage: `linear-gradient(180deg, transparent, rgba(5, 10, 14, .65)), url(${JSON.stringify(item.article.imageUrl)})` } : undefined}
      >
        <span className="news-card__mood"><Layers3 size={14} /> {uiCopy[locale].moods[item.selectedMood]}</span>
      </div>
      <div className="news-card__body">
        <div className="news-card__meta">
          <SourceBadge name={item.article.sourceName} url={item.article.canonicalUrl} />
          <TimeStamp date={item.article.publishedAt} locale={locale} />
        </div>
        <h2><Link href={href}>{item.displayTitle}</Link></h2>
        <p>{item.displaySummary}</p>
        <div className="news-card__footer">
          <FactLockBadge validation={item.validation} rewritten={Boolean(item.rewrite)} locale={locale} />
          <Link className="detail-link" href={href}>{uiCopy[locale].card.compare} <ArrowUpRight size={15} /></Link>
        </div>
      </div>
    </article>
  );
}
