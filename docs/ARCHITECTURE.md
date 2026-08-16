# Архитектура

## Цели

1. Получать реальные source fragments с poll interval 5 минут.
2. Не блокировать web импортом или AI.
3. Хранить original, versions, provenance и AI audit.
4. Не публиковать output до детерминированной проверки.
5. Реально закончить проект одним разработчиком за 3 дня.

## Процессы

### Web

Next.js отвечает за:

- grid;
- detail comparison;
- ops/about screens;
- read API;
- ручной rewrite action;
- защищённые job endpoints.

Web читает уже сохранённые данные. Он не выполняет регулярный import сам.

### Worker

`scripts/worker.ts`:

- выполняет ingestion сразу после запуска;
- запускает ingestion под SQLite lock каждые `INGEST_INTERVAL_MS`;
- запускает pending rewrite под отдельным lock каждые `REWRITE_INTERVAL_MS`;
- держит два независимых periodic runner, поэтому медленный AI batch не сдвигает пятиминутный source poll;
- очищает таймеры и завершает текущую работу по `SIGINT/SIGTERM`.

### SQLite

SQLite выполняет роли:

- system of record;
- version history;
- audit store;
- inexpensive job coordination;
- metrics source.

Для одной web-инстанции и одного worker это проще, чем отдельные PostgreSQL/Redis. WAL включён, `busy_timeout` задан.

## Слои

```text
src/app + src/components
        ↓
src/modules/news, jobs, ops
        ↓
src/domain
        ↓
src/db, ingestion sources, OpenRouter, server adapters
```

## Поток импорта

```text
BBC/Guardian
→ adapter contract
→ sanitize
→ normalize URL/date
→ content hash
→ batch dedupe
→ article upsert
→ version snapshot on change
→ pending article
```

## Поток AI

```text
article
→ fact extraction
→ overlap resolution
→ placeholders
→ DeepSeek strict JSON: localized fact ledger + 4 variants
→ schema validation
→ locale fact validation
→ Fact Lock against localized baseline
→ accepted OR Luna
→ same checks
→ restore accepted locale values
→ save 4 validated rewrites
```

## Инварианты

- Source item определяется `(source_id, source_item_id)`; canonical URL также уникален.
- Неизменившийся content hash не создаёт новую version и не тратит AI.
- Changed content увеличивает `news_articles.version`.
- Snapshot уникален по `(article_id, version)`.
- Old rewrites после изменения получают `stale`.
- В UI выбираются только `validated` rewrites текущего prompt version.
- Canonical facts сохраняют source values и стабильные ID; языковые значения живут отдельно по `(fact_id, locale)`.
- Для English fact values должны совпадать с источником; для Russian переводимы только нечисловые факты, при этом все numeric tokens сохраняются.
- Любая модель проходит одинаковый deterministic gate.
- Failure не скрывает original.
- Model/prompt/cost/latency сохраняются.

## Почему application-level fallback

OpenRouter/provider failover не видит бизнес-ошибку внутри успешного JSON. Только приложение знает, что output удалил placeholder или добавил число. Поэтому Luna вызывается после локальной schema/Fact Lock проверки.

## Ограничение SQLite варианта

Текущий pending механизм — scan статей без полного набора rewrites, а не отдельная durable per-article queue. Ошибка обеих моделей приводит к повторной попытке в следующем cycle. Для одного worker это достаточно. Для нескольких workers и bounded backoff нужен PostgreSQL path из `POSTGRES_MIGRATION.md`.
