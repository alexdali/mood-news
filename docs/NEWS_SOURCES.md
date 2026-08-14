# Источники новостей

## 1. Требование к свежести

Независимый ingestion runner проверяет источники примерно каждые пять минут; rewrite runner не может задержать этот poll. Это означает:

- новая запись будет обнаружена при ближайшем успешном polling cycle;
- отсутствие новой статьи за пять минут не является ошибкой;
- фактическая задержка видна как разница `published_at` и `fetched_at`.

## 2. BBC RSS

### Почему основной

- официальный открытый RSS;
- не нужен API key;
- простой формат;
- несколько активных категорий;
- graceful degradation при недоступности одной ленты.

### По умолчанию

```dotenv
BBC_RSS_FEEDS=https://feeds.bbci.co.uk/news/rss.xml,https://feeds.bbci.co.uk/news/world/rss.xml,https://feeds.bbci.co.uk/news/technology/rss.xml,https://feeds.bbci.co.uk/news/business/rss.xml
```

### Получаемые поля

- guid;
- link;
- title;
- content/summary;
- pubDate/isoDate;
- enclosure image при наличии.

### Ограничение

RSS summary — не полный текст статьи. UI называет его `source fragment`, а не full article.

## 3. The Guardian Open Platform

### Почему второй

- структурированное API;
- stable article ID;
- section;
- trail text;
- image/byline;
- независимый от BBC source format.

### Запрос

```text
GET https://content.guardianapis.com/search
  ?api-key=...
  &order-by=newest
  &page-size=20
  &show-fields=headline,trailText,thumbnail,byline,publication
```

При polling каждые пять минут выполняется 288 search requests/day. Перед запуском нужно проверить актуальный quota и условия Developer access.

### Graceful behavior

Если `GUARDIAN_API_KEY` пуст:

- adapter не добавляется в active registry;
- BBC продолжает работать;
- health/ops показывают, что Guardian не настроен.

## 4. Почему не scraping full pages

За три дня scraping увеличивает риски:

- robots/terms;
- антибот;
- динамический HTML;
- нестабильные selectors;
- copyright scope;
- лишний parsing code;
- проблемы с полным текстом и token cost.

Для задания достаточно title + source-provided summary + canonical link.

## 5. Normalization

Каждая запись проходит:

1. HTML stripping;
2. whitespace normalization;
3. summary truncation;
4. URL protocol allowlist;
5. tracking parameter removal;
6. ISO timestamp normalization;
7. content hash;
8. batch deduplication;
9. DB upsert.

## 6. Deduplication

Уровни:

- внутри batch: `sourceId + sourceItemId`;
- внутри batch: canonical URL;
- в БД: unique source identity;
- в БД: unique canonical URL;
- unchanged content hash → `skipped`;
- changed hash → article update + stale rewrites.

## 7. Partial failures

Каждый source выполняется отдельно. Итоговый ingestion status:

- `completed` — все sources успешны;
- `partial` — часть sources упала;
- `failed` — все sources упали.

Ошибки сохраняются, а не только печатаются в console.

## 8. Добавление нового источника

1. создать adapter, реализующий `NewsSourceAdapter`;
2. вернуть `metadata` и `SourceFetchResult`;
3. зарегистрировать в `source-registry.ts`;
4. добавить env flags;
5. добавить normalization contract tests;
6. обновить source license/terms documentation.
