import type { NewsDetailView } from "@/modules/news/view-models";
import { FactLockBadge } from "@/components/fact-lock-badge";
import { ProcessingStatus } from "@/components/processing-status";
import type { Locale } from "@/i18n/ui";
import { uiCopy } from "@/i18n/ui";

export function ArticleComparison({ view, locale }: { view: NewsDetailView; locale: Locale }) {
  const copy = uiCopy[locale];
  return (
    <section className="comparison-grid">
      <article className="comparison-panel comparison-panel--source">
        <header><span>{copy.detail.original}</span><small>{copy.detail.immutable}</small></header>
        <h2>{view.article.title}</h2>
        <p>{view.article.summary}</p>
      </article>
      <article className="comparison-panel comparison-panel--rewrite">
        <header>
          <span>{copy.moods[view.selectedMood]} · {copy.detail.version}</span>
          <FactLockBadge validation={view.validation} rewritten={Boolean(view.rewrite)} locale={locale} />
        </header>
        <h2>{view.displayTitle}</h2>
        <p>{view.displaySummary}</p>
        <footer><ProcessingStatus model={view.rewrite?.model} promptVersion={view.rewrite?.promptVersion} locale={locale} /></footer>
      </article>
    </section>
  );
}
