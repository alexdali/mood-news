import type { NewsCardView, NewsDetailView } from "@/modules/news/view-models";

export function serializeNewsCard(view: NewsCardView) {
  return {
    id: view.article.id,
    source: { id: view.article.sourceId, name: view.article.sourceName, url: view.article.canonicalUrl },
    original: { title: view.article.title, summary: view.article.summary },
    display: { title: view.displayTitle, summary: view.displaySummary, mood: view.selectedMood },
    publishedAt: view.article.publishedAt,
    fetchedAt: view.article.fetchedAt,
    imageUrl: view.article.imageUrl,
    section: view.article.section,
    rewrite: view.rewrite ? {
      model: view.rewrite.model,
      promptVersion: view.rewrite.promptVersion,
      status: view.rewrite.status,
    } : null,
    validation: view.validation,
  };
}

export function serializeNewsDetail(view: NewsDetailView) {
  return {
    ...serializeNewsCard(view),
    facts: view.facts.map((fact) => ({
      type: fact.factType,
      value: fact.value,
      placeholder: fact.placeholder,
      field: fact.sourceField,
      extractor: fact.extractor,
    })),
    availableMoods: view.availableMoods,
  };
}
