import type { NewsDetailView } from "@/modules/news/view-models";
import { FactLockBadge } from "@/components/fact-lock-badge";
import { ProcessingStatus } from "@/components/processing-status";

export function ArticleComparison({ view }: { view: NewsDetailView }) {
  return (
    <section className="comparison-grid">
      <article className="comparison-panel comparison-panel--source">
        <header><span>Original source fragment</span><small>Immutable reference</small></header>
        <h2>{view.article.title}</h2>
        <p>{view.article.summary}</p>
      </article>
      <article className="comparison-panel comparison-panel--rewrite">
        <header>
          <span>{view.selectedMood} version</span>
          <FactLockBadge validation={view.validation} rewritten={Boolean(view.rewrite)} />
        </header>
        <h2>{view.displayTitle}</h2>
        <p>{view.displaySummary}</p>
        <footer><ProcessingStatus model={view.rewrite?.model} promptVersion={view.rewrite?.promptVersion} /></footer>
      </article>
    </section>
  );
}
