# Источники и policy

## BBC RSS

Стартовые feeds:

```text
https://feeds.bbci.co.uk/news/rss.xml
https://feeds.bbci.co.uk/news/world/rss.xml
https://feeds.bbci.co.uk/news/technology/rss.xml
https://feeds.bbci.co.uk/news/business/rss.xml
```

Приложение хранит headline/description, publication time и canonical URL. Оно не загружает полный текст и не обходит paywall.

## Guardian Open Platform

Включается только при `GUARDIAN_API_KEY`.

```text
https://content.guardianapis.com/search
```

Параметры MVP:

```text
order-by=newest
page-size=<1..50>
show-fields=headline,trailText,thumbnail,byline,publication
```

`bodyText` не используется. Developer access требует отдельной проверки условий перед коммерческой эксплуатацией.

## Cadence

Независимый ingestion runner делает попытку poll каждые `INGEST_INTERVAL_MS=300000`; AI rewrite работает по отдельному `REWRITE_INTERVAL_MS=60000`. Это гарантирует частоту проверки, но не гарантирует, что издатель публикует новую статью каждые 5 минут.

## Attribution

Каждая карточка должна иметь:

- source name;
- publication time;
- canonical URL;
- original comparison.

## Failure policy

- один source не останавливает остальные;
- run может быть `partial`;
- сохранённые статьи остаются доступны;
- unchanged content не отправляется в AI;
- raw payload и counters остаются в audit.

## Добавление источника

1. Реализовать `NewsSourceAdapter`.
2. Выбрать стабильный `sourceItemId`.
3. Нормализовать title/summary/date/URL.
4. Проверить rate limit и лицензию.
5. Добавить adapter в registry.
6. Добавить contract fixture.
