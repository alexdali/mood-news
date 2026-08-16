# Карта файлов Mood News Grid

Эта карта объясняет, где искать каждую часть логики. Репозиторий намеренно остаётся одним TypeScript-приложением, но разделён на слои и feature modules.

## Root

```text
README.md                    Основное описание и запуск
package.json                 Команды и зависимости
.env.example                 Полная конфигурация
Dockerfile                   Production web/worker image
docker-compose.yml           Web + worker + shared SQLite volume
next.config.ts               Next standalone + native SQLite package
tsconfig.json                Strict TypeScript и alias @/*
eslint.config.mjs            Next/TypeScript lint
vitest.config.ts             Unit/integration tests
playwright.config.ts         Desktop/mobile E2E
Makefile                     Короткие shell aliases
```

## Migrations

```text
migrations/0001_initial.sql
```

Создаёт:

- sources;
- ingestion runs;
- articles;
- protected facts;
- rewrites;
- validations;
- AI runs;
- job locks;
- events.

```text
migrations/0002_indexes.sql
```

Создаёт read/audit indexes.

```text
migrations/0003_article_snapshots.sql
```

Добавляет article version и immutable snapshots.

## `src/app` — страницы и API

```text
src/app/layout.tsx
```

Root metadata, global CSS и `AppShell`.

```text
src/app/page.tsx
```

Главный grid. Читает mood из query string и получает view models через `NewsQueryService`.

```text
src/app/news/[id]/page.tsx
```

Original/rewrite comparison, Fact Lock ledger и ручная генерация.

```text
src/app/ops/page.tsx
```

Operational evidence: imports, rewrites, validations, cost и model route.

```text
src/app/about/page.tsx
```

Пользовательское объяснение метода и ограничений.

```text
src/app/loading.tsx
src/app/error.tsx
src/app/not-found.tsx
```

Стандартные UI states.

### API

```text
src/app/api/health/route.ts
```

SQLite и configuration health.

```text
src/app/api/news/route.ts
src/app/api/news/[id]/route.ts
```

Read-only list/detail.

```text
src/app/api/news/[id]/rewrite/route.ts
```

Ручной rewrite с rate limit и budget guard.

```text
src/app/api/jobs/ingest/route.ts
src/app/api/jobs/rewrite-pending/route.ts
```

Защищённые scheduler endpoints.

```text
src/app/api/ops/summary/route.ts
```

Operational JSON summary.

## `src/components` — UI

```text
app-shell.tsx                 Общая оболочка
site-header.tsx               Навигация
mood-switcher.tsx             Client mood control
news-grid.tsx                 Grid container
news-card.tsx                 Карточка
article-comparison.tsx        Original/rewrite columns
protected-facts-list.tsx      Fact ledger
fact-lock-badge.tsx           Deterministic status
processing-status.tsx         Model/prompt metadata
rewrite-button.tsx            Manual generation
source-badge.tsx              Attribution link
time-stamp.tsx                Relative time
empty-state.tsx               First-run guidance
```

### Small UI primitives

```text
src/components/ui/badge.tsx
src/components/ui/button.tsx
```

### Ops components

```text
src/components/ops/stat-card.tsx
src/components/ops/source-table.tsx
```

## `src/config`

```text
src/config/env.ts
```

Zod validation и typed environment.

```text
src/config/moods.ts
```

UI labels, descriptions и prompt instructions.

```text
src/config/sources.ts
```

Простое представление настроенных sources.

```text
src/config/app.ts
```

Название и description.

## `src/core`

```text
errors.ts                     Typed application errors
hash.ts                       SHA-256/content hash
ids.ts                        UUID identifiers
json.ts                       Safe parse/stable stringify
number.ts                     Query integer bounds
result.ts                     Generic Result type
retry.ts                      Exponential retry helper
time.ts                       ISO/sleep/date helpers
stop-signal.ts                SIGTERM-aware cancellable waits
url.ts                        External URL safety/canonicalization
```

## `src/domain`

### News

```text
src/domain/news/article.ts
src/domain/news/rewrite.ts
src/domain/news/mood.ts
src/domain/news/source.ts
src/domain/news/snapshot.ts
```

### Fact Lock

```text
src/domain/fact-lock/fact.ts
src/domain/fact-lock/validation.ts
```

### AI и ingestion

```text
src/domain/ai/run.ts
src/domain/ingestion/run.ts
```

## `src/db`

```text
src/db/client.ts
```

SQLite singleton, WAL, foreign keys и automatic migrations.

```text
src/db/migrate.ts
```

Ordered SQL migration runner.

```text
src/db/schema.ts
src/db/row-mappers.ts
src/db/types.ts
```

Row types и domain mapping.

### Repositories

```text
source-repository.ts          Source registry
ingestion-repository.ts       Run/source counters
news-repository.ts            Article upsert/version/stale logic
snapshot-repository.ts        Immutable version history
fact-repository.ts            Fact ledger
rewrite-repository.ts         Accepted rewrites + validations
ai-run-repository.ts          Model audit/cost
job-lock-repository.ts        Expiring cross-process lock
metrics-repository.ts         Ops aggregations
event-repository.ts           Event log
```

## `src/modules/ingestion`

```text
source-adapter.ts             Adapter interface
source-registry.ts            Runtime source assembly
types.ts                      Raw/normalized contracts
text-cleaner.ts               HTML removal/truncation
normalize.ts                  URL/date/hash normalization
deduplicate.ts                Batch identity/canonical URL dedupe
ingest-service.ts             End-to-end import use case
```

### Sources

```text
sources/bbc-rss.ts            BBC RSS adapter
sources/guardian.ts           Guardian API adapter
```

Новый источник добавляется отдельным adapter-файлом без изменения Fact Lock или UI.

## `src/modules/fact-lock`

```text
patterns.ts                   Shared regex data
extractor.ts                  Extractor registry и overlap resolution
placeholder.ts                Ledger + protected text
restore.ts                    Exact value restoration
validator.ts                  Deterministic publish gate
confidence.ts                 UI wording from validation record
```

### Extractors

```text
extractors/base.ts            Interface/regex helper
extractors/urls.ts            URLs
extractors/quotes.ts          Direct quotes
extractors/numbers.ts         Money/percent/numbers
extractors/dates.ts           Dates/time
extractors/entities.ts        Conservative capitalized-entity heuristic
```

## `src/modules/ai`

```text
ai-types.ts                   OpenRouter/result contracts
schemas.ts                    Zod + JSON Schema
prompts.ts                    System/user prompt builders
json-repair.ts                Safe JSON object extraction
token-usage.ts                Usage/cost mapping
openrouter-request.ts         Reasoning-off, JSON Schema and provider routing request builder
openrouter-client.ts          HTTP client, structured output, retry
model-router.ts               DeepSeek → validation → Luna
rewrite-service.ts            Protection, budget, persistence
```

Главная демонстрационная логика fallback находится в `model-router.ts`, а не скрыта в gateway настройке.

## `src/modules/news`

```text
news-query-service.ts         Grid view models
news-detail-service.ts        Detail view model
rewrite-orchestrator.ts       Article lookup + rewrite use case
serializers.ts                API response shape
view-models.ts                UI contracts
```

## `src/modules/jobs`

```text
ingest-job.ts                 Locked ingestion entrypoint
rewrite-job.ts                Locked pending batch entrypoint
lock-policy.ts                TTL budget for primary/fallback/retry worst case
periodic-runner.ts            Independent ingestion/rewrite cadence
job-auth.ts                   Bearer/x-cron-secret check
```

## `src/modules/ops`

```text
summary-service.ts            Operational aggregate
cost.ts                       Human-friendly USD formatting
```

## `src/server`

```text
api-response.ts               Unified success/error envelope
http-client.ts                Fetch timeout/retry
logger.ts                     Pino + secret redaction
rate-limit.ts                 Prototype in-memory limiter + expired-bucket cleanup
request-id.ts                 Traceable request ID
secrets.ts                    Timing-safe secret comparison
```

## Scripts

```text
scripts/_bootstrap-env.ts     Load local .env
scripts/_console.ts           CLI output helpers
scripts/bootstrap.ts          Migrate + import + rewrite
scripts/worker.ts             Five-minute scheduler
scripts/ingest-once.ts        One import
scripts/rewrite-pending.ts    One pending batch
scripts/db-migrate.ts         Migration command
scripts/db-reset.ts           Guarded reset
scripts/inspect-db.ts         Database summary
scripts/seed-sources.ts       Source registry seed
scripts/verify-models.ts      OpenRouter model availability
scripts/benchmark-models.ts   Real DeepSeek/Luna comparison
scripts/export-demo-report.ts Audit report
scripts/export-demo-data.mjs  HTTP data export
scripts/smoke-test.mjs        Health/news/ops smoke
scripts/check-architecture.mjs Static module, secret and Markdown-link invariants
scripts/check-local-imports.mjs Resolve all relative TypeScript/JavaScript imports
scripts/check-syntax.mjs      Parse every TypeScript/TSX file for syntax diagnostics
scripts/bootstrap.sh          POSIX convenience setup
```

## Tests

### Unit

```text
src/test/unit/deduplicate.test.ts
src/test/unit/env.test.ts
src/test/unit/fact-extractor.test.ts
src/test/unit/fact-placeholder.test.ts
src/test/unit/fact-validator.test.ts
src/test/unit/json-repair.test.ts
src/test/unit/lock-policy.test.ts
src/test/unit/model-router.test.ts
src/test/unit/normalize.test.ts
src/test/unit/number.test.ts
src/test/unit/openrouter-request.test.ts
src/test/unit/periodic-runner.test.ts
src/test/unit/rate-limit.test.ts
src/test/unit/source-config.test.ts
src/test/unit/stop-signal.test.ts
```

### Integration

```text
src/test/integration/repositories.test.ts
```

### E2E

```text
src/test/e2e/home.spec.ts
```

### Fixtures

```text
src/test/fixtures/articles.ts
```

## Documentation

```text
docs/README.md                    Индекс и рекомендуемый порядок чтения
docs/FINAL_IMPLEMENTATION_PLAN.md Полная спецификация реализации
docs/THREE_DAY_PLAN.md            Почасовой план на три дня
docs/IMPLEMENTATION_CHECKLIST.md  Checklist разработки
docs/ARCHITECTURE.md              Слои, процессы и data flow
docs/DATA_MODEL.md                Таблицы, связи и инварианты
docs/AI_PIPELINE.md               DeepSeek → Fact Lock → Luna
docs/FACT_LOCK.md                 Проверка конкретных фактов
docs/NEWS_SOURCES.md              BBC/Guardian и частота импорта
docs/SOURCE_POLICY.md             Правила работы с source fragments
docs/OPERATIONS.md                Worker, budget, audit, backup и recovery
docs/TEST_STRATEGY.md             Стратегия качества и model benchmark
docs/API.md                       API reference
docs/openapi.yaml                 OpenAPI contract
docs/http/mood-news-grid.http     Ручные HTTP-запросы
docs/SECURITY.md                  Threat model и security checklist
docs/LIMITATIONS.md               Честные ограничения прототипа
docs/DEPLOYMENT.md                Local, Docker, VPS deployment
docs/POSTGRES_MIGRATION.md        Путь миграции persistence
docs/ACCEPTANCE_MATRIX.md         Матрица требований задания
docs/DEMO_SCRIPT.md               Demo на 90 секунд и 5–7 минут
docs/SCREENSHOTS.md               Галерея интерфейса
docs/SUBMISSION_CHECKLIST_RU.md   Checklist сдачи
docs/ROADMAP.md                   Следующие этапы
docs/VALIDATION_REPORT.md          Что проверено в этом архиве и что нужно прогнать локально
docs/decisions/*.md                Architecture Decision Records
```
