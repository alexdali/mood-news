# Окончательный план реализации Mood News Grid

## 0. Цель

За три дня получить не макет и не набор отдельных экспериментов, а работающий vertical slice:

```text
реальный источник
→ импорт
→ нормализация
→ сохранение
→ защита фактов
→ DeepSeek
→ детерминированная проверка
→ Luna fallback
→ сохранение результата
→ grid
→ original/rewrite comparison
→ audit и доказательства качества
```

Критерий успеха: проверяющий за 5–7 минут понимает, как устроена система, видит реальные данные, может проследить происхождение новости, увидеть AI-результат, механизм отказа и объективные проверки.

---

# 1. Product scope

## 1.1 Обязательный пользовательский сценарий

1. Пользователь открывает главную страницу.
2. Видит минимум 10 реальных новостей.
3. Видит источник и дату каждой новости.
4. Выбирает один из четырёх moods.
5. Весь grid показывает тот же набор статей в выбранном тоне.
6. Пользователь открывает карточку.
7. Видит original и rewrite рядом.
8. Видит ссылку на оригинальный материал.
9. Видит Fact Lock status и точные защищённые факты.
10. Если rewrite не готов или отклонён, видит original, а не сомнительный AI-текст.

## 1.2 Обязательный технический сценарий

1. Независимый ingestion runner проверяет источники каждые 5 минут, даже если AI batch ещё выполняется.
2. Неизменившиеся записи не отправляются в AI повторно.
3. Изменившаяся запись получает новую version и snapshot.
4. Конкретные факты заменяются placeholders.
5. DeepSeek возвращает четыре mood variants в strict JSON.
6. Код проверяет schema и Fact Lock.
7. При провале вызывается Luna.
8. Если Luna тоже не прошла, результат не публикуется.
9. Все AI attempts и validation verdicts записываются.
10. UI читает только accepted data.

## 1.3 Moods

| ID | Пользовательская идея | Ограничение |
|---|---|---|
| `neutral` | Спокойный newsroom tone | Не сокращать смысл до сухого заголовка |
| `hopeful` | Конструктивная подача | Не обещать успех и положительный исход |
| `concerned` | Осторожная подача | Не создавать новые угрозы и последствия |
| `ironic` | Лёгкая ситуационная ирония | Не высмеивать жертв, людей и трагедии |

Четырёх режимов достаточно. Пятый режим даст мало демонстрационной ценности и увеличит число failure cases.

---

# 2. Scope control

## 2.1 В MVP входит

- BBC RSS;
- optional Guardian API;
- headline + source excerpt;
- SQLite;
- history snapshots;
- web + worker;
- DeepSeek primary;
- Luna fallback;
- Fact Lock;
- audit/cost;
- responsive desktop/mobile UI;
- tests и документация.

## 2.2 В MVP не входит

- scraping полного текста;
- paywall обход;
- аккаунты;
- персональные ленты;
- перевод языков;
- full semantic fact checker;
- RAG;
- vector DB;
- Kafka/Redis;
- сложная админка;
- production moderation;
- production licensing automation.

## 2.3 Правило остановки

Нельзя начинать декоративную функцию, пока не проходят следующие gates:

```text
Gate A: 10+ real source records stored
Gate B: original grid works without AI
Gate C: Fact Lock tests pass
Gate D: 4 accepted moods exist for 10+ articles
Gate E: clean start instructions work
```

---

# 3. Стек

## 3.1 Runtime

- Node.js 22;
- TypeScript 5.9;
- npm.

## 3.2 Web

- Next.js App Router;
- React;
- server components для чтения;
- client components только для интерактивных controls;
- CSS без тяжёлой UI-библиотеки;
- Lucide icons.

## 3.3 Persistence

- SQLite;
- `better-sqlite3`;
- SQL migrations;
- WAL mode;
- repositories без тяжёлого ORM.

## 3.4 Sources

- `rss-parser` для BBC;
- Guardian REST API через native `fetch`;
- `sanitize-html` для source fragments;
- Zod для Guardian response contract.

## 3.5 AI

- OpenRouter Chat Completions;
- primary `deepseek/deepseek-v4-flash-0731`;
- fallback `openai/gpt-5.6-luna`;
- strict JSON Schema;
- Zod second validation;
- reasoning явно отключён через `enabled=false`;
- при экспериментальном включении используется effort `low`;
- один запрос на четыре moods.

## 3.6 Testing

- Vitest;
- Playwright;
- real-model benchmark как отдельная ручная команда.

## 3.7 Delivery

- Dockerfile;
- Docker Compose;
- GitHub Actions;
- Markdown docs;
- screenshots plan.

---

# 4. Архитектурные слои

## 4.1 UI и routes

Отвечают только за:

- чтение query params;
- вызов application services;
- отображение view models;
- HTTP serialization;
- пользовательские states.

UI не должен:

- вызывать OpenRouter напрямую;
- писать SQL;
- парсить RSS;
- определять факты;
- решать fallback.

## 4.2 Domain

Содержит типы:

- `NewsArticle`;
- `NewsRewrite`;
- `Mood`;
- `ProtectedFact`;
- `FactValidationResult`;
- `AiUsage`;
- ingestion summaries.

Domain не зависит от Next.js или SQLite.

## 4.3 Application modules

Use cases:

- импортировать источники;
- найти pending статьи;
- защитить текст;
- выполнить model routing;
- сохранить accepted batch;
- собрать UI view model;
- собрать ops summary.

## 4.4 Adapters

- BBC RSS;
- Guardian API;
- OpenRouter;
- SQLite repositories;
- logger;
- HTTP retry.

---

# 5. Данные

## 5.1 `sources`

Назначение: registry источников.

Основные поля:

```text
id
kind
name
base_url
enabled
config_json
created_at
updated_at
```

Инвариант: source URL задаётся конфигурацией приложения, не вводом пользователя.

## 5.2 `ingestion_runs`

Один row на общий цикл.

```text
trigger_type
status
started_at
finished_at
fetched_count
inserted_count
updated_count
skipped_count
error_count
errors_json
```

## 5.3 `ingestion_source_runs`

Нужна для partial success. Если Guardian упал, BBC всё равно сохраняется.

## 5.4 `news_articles`

Текущая materialized projection.

```text
source_id
source_item_id
canonical_url
title
summary
section
language
image_url
byline
published_at
fetched_at
content_hash
raw_payload_json
version
status
```

## 5.5 `article_snapshots`

Immutable evidence каждой changed version:

```text
article_id
version
content_hash
normalized_payload_json
raw_payload_json
fetched_at
created_at
```

## 5.6 `protected_facts`

```text
article_id
fact_type
value
normalized_value
placeholder
source_field
start_index
end_index
extractor
```

## 5.7 `rewrites`

```text
article_id
mood
title
summary
model
prompt_version
status
```

Unique:

```text
(article_id, mood, prompt_version)
```

## 5.8 `validation_runs`

```text
rewrite_id
passed
score
expected_count
preserved_count
missing_json
duplicate_json
unknown_json
added_facts_json
details_json
```

## 5.9 `ai_runs`

```text
article_id
model
model_role
status
latency_ms
input_tokens
output_tokens
reasoning_tokens
cost_usd
provider_request_id
error_code
error_message
```

## 5.10 `job_locks`

Глобальные locks:

```text
ingest
rewrite-pending
```

Они предотвращают наложение одинаковых циклов между web job endpoint и worker.

## 5.11 `app_events`

Лёгкий журнал значимых операций:

```text
ingestion.completed
rewrite.validated
```

---

# 6. Source ingestion

## 6.1 Adapter contract

Каждый источник реализует:

```ts
interface NewsSourceAdapter {
  readonly metadata: SourceUpsertInput;
  fetchLatest(): Promise<SourceFetchResult>;
}
```

## 6.2 BBC

Подключить четыре feeds:

```text
Top Stories
World
Technology
Business
```

Из RSS использовать:

```text
guid
link
title
contentSnippet/content/summary
isoDate/pubDate
enclosure
creator
```

## 6.3 Guardian

Включать только при наличии key.

Поля:

```text
id
webPublicationDate
webTitle
webUrl
sectionName
fields.headline
fields.trailText
fields.thumbnail
fields.byline
fields.publication
```

Не загружать `bodyText` в MVP.

## 6.4 Normalization

Порядок:

1. удалить HTML;
2. нормализовать пробелы;
3. ограничить summary;
4. проверить external URL;
5. удалить tracking query params;
6. привести дату к ISO;
7. вычислить hash;
8. отбросить запись без title/summary/URL.

## 6.5 Deduplication

В пределах batch:

1. `sourceId + sourceItemId`;
2. canonical URL;
3. оставить более свежую запись.

В БД:

```text
UNIQUE(source_id, source_item_id)
UNIQUE(canonical_url)
```

## 6.6 Update logic

### Новая запись

```text
insert article version 1
insert snapshot version 1
outcome = inserted
```

### Неизменившаяся

```text
update fetched_at/raw payload
не вызывать AI
outcome = skipped
```

### Изменившаяся

```text
version + 1
update current article
insert snapshot
remove old fact ledger
mark old rewrites stale
outcome = updated
```

## 6.7 Failure policy

- timeout и 5xx повторяются один раз;
- ошибка одного источника не прерывает остальные;
- run получает `partial`, если часть sources успешна;
- сохранённый grid продолжает работать;
- ошибка записывается в ingestion audit.

---

# 7. Fact Lock

## 7.1 Цель

Не просить модель «пожалуйста, не меняй факты» и надеяться. Превратить наиболее проверяемые факты в immutable tokens.

## 7.2 Extractors и priority

| Extractor | Priority | Пример |
|---|---:|---|
| URL | 100 | `https://...` |
| Quote | 95 | `“We will proceed.”` |
| Money | 92 | `$12.5 million` |
| Percentage | 88 | `18.4%` |
| Date | 84 | `August 14, 2026` |
| Time | 82 | `14:30 UTC` |
| Number | 70 | `24` |
| Entity heuristic | 50 | `NASA`, `Jane Smith`, `Paris` |

Priority нужен для overlaps: `$12.5 million` должен стать одним money fact, а не отдельными number fragments.

## 7.3 Placeholder format

```text
[[FACT_001]]
[[FACT_002]]
```

Порядок стабилен:

1. title left-to-right;
2. summary left-to-right.

## 7.4 Field invariant

Факт из title должен остаться в title. Это упрощает сравнение и не позволяет модели спрятать headline fact в summary.

## 7.5 Deterministic checks

### Placeholder completeness

```text
expected == actual unique set
```

### Occurrence count

Каждый expected placeholder — ровно один раз.

### Unknown placeholders

Ни один новый `[[FACT_999]]` не допускается.

### Field preservation

Title placeholders не допускаются в summary и наоборот.

### Added concrete facts

После restore текст снова сканируется. Новые concrete tokens сравниваются с original multiset.

### Length ratio

```text
MIN_REWRITE_LENGTH_RATIO <= rewritten/original <= MAX_REWRITE_LENGTH_RATIO
```

### Meta response

Фразы вида `As an AI` отклоняются.

## 7.6 Batch policy

Если один из четырёх moods не прошёл, весь batch отклоняется. Это проще, предсказуемее и исключает частично обработанную статью.

## 7.7 Confidence wording

Не использовать неподтверждённый «AI confidence 98%».

Показывать:

```text
8/8 protected facts preserved
```

и отдельный validation score, рассчитанный кодом.

---

# 8. AI pipeline

## 8.1 Primary

```text
deepseek/deepseek-v4-flash-0731
```

Роль: дешёвая массовая constrained transformation.

## 8.2 Fallback

```text
openai/gpt-5.6-luna
```

Роль: резерв после конкретного измеримого отказа primary.

## 8.3 Почему один запрос

В одном запросе:

- system prompt отправляется один раз;
- original protected text отправляется один раз;
- возвращаются четыре variants;
- проще обеспечить один prompt version;
- ниже стоимость и latency, чем четыре отдельных запроса.

## 8.4 Prompt composition

### System

Содержит:

- роль copy editor;
- запрет на reporting/analysis/completion;
- immutable placeholder rules;
- запрет новых facts;
- safety для irony;
- strict JSON instruction.

### User

Содержит:

- source metadata как context-only;
- mood-specific instructions;
- protected title;
- protected summary;
- требование ровно четырёх moods.

## 8.5 Response contract

1. OpenRouter `response_format=json_schema`.
2. `strict=true`.
3. Zod parse на стороне приложения.
4. Проверка всех mood IDs.
5. Fact Lock.

## 8.6 Reasoning

```json
{ "reasoning": { "enabled": false, "exclude": true } }
```

Reasoning не должен заменять deterministic validation и увеличивать output cost для простой constrained задачи. Если его понадобится включить в benchmark, приложение отправит `enabled=true`, `effort=low`, `exclude=true`.

## 8.7 Fallback algorithm

```text
for attempt in [DeepSeek, Luna]:
  call model
  parse JSON
  validate schema
  validate each mood
  if all pass:
    record completed
    return
  else:
    record validation_error

throw last error
```

## 8.8 Retry hierarchy

### Transport retry

Один короткий retry для:

- 429;
- 5xx;
- timeout;
- network TypeError.

### Model fallback

Luna после provider/parse/validation error.

### Worker retry

Если обе модели не прошли, article остаётся pending и будет найден в следующем rewrite cycle.

## 8.9 Cost guard

Перед новым batch:

1. суммировать `cost_usd` completed AI runs с 00:00 UTC;
2. сравнить с `MAX_DAILY_AI_COST_USD`;
3. при превышении записать `budget_blocked`;
4. не вызывать API.

## 8.10 Audit

Сохранять даже неуспешные attempts:

- primary/fallback role;
- requested/returned model;
- request ID;
- latency;
- token usage;
- cost;
- parse/validation error.

---

# 9. Web UI

## 9.1 Главная

### Hero

- короткий product promise;
- mood switcher;
- объяснение fail-closed подхода.

### Grid card

- image optional;
- mood label;
- source;
- publication time;
- selected title/summary;
- Fact Lock badge;
- Compare link.

### States

- no data;
- original pending;
- validated rewrite;
- loading;
- application error.

## 9.2 Detail

- back link с сохранением mood;
- source/published/fetched metadata;
- two-column comparison;
- model/prompt version;
- manual generate button при pending;
- protected fact table.

## 9.3 Ops

Показать:

```text
active articles
validated rewrites
AI requests 24h
AI failures 24h
AI cost 24h
average latency
validation pass rate
latest ingestion
source counts
primary/fallback models
```

## 9.4 About

Объяснить:

- что проверяет система;
- чего она не проверяет;
- почему AI не является судьёй собственного ответа.

## 9.5 Responsive

Контрольные widths:

```text
1440 desktop
1024 tablet
768 narrow tablet
390 mobile
```

---

# 10. HTTP API

## 10.1 Read

### `GET /api/health`

Проверяет SQLite и возвращает config status без secrets.

### `GET /api/news`

Query:

```text
mood
limit
offset
```

### `GET /api/news/:id`

Query:

```text
mood
```

### `GET /api/ops/summary`

Operational summary.

## 10.2 Actions

### `POST /api/news/:id/rewrite`

Для ручной демонстрации. Защита:

- memory rate limiter;
- daily cost cap;
- server-side key only.

### `POST /api/jobs/ingest`

Bearer или `x-cron-secret`.

### `POST /api/jobs/rewrite-pending`

Bearer или `x-cron-secret`, optional `limit`.

## 10.3 Error envelope

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Readable message",
    "requestId": "request_..."
  }
}
```

Stack trace наружу не отдавать.

---

# 11. Worker

## 11.1 Startup

1. загрузить `.env`;
2. validate environment;
3. открыть SQLite;
4. применить migrations;
5. выполнить ingestion сразу; rewrite runner запускается независимо.

## 11.2 Независимые periodic runners

```text
startup:
  run ingest job once

in parallel:
  ingestion runner:
    wait INGEST_INTERVAL_MS
    run locked ingest job

  rewrite runner:
    run locked pending batch
    wait max(1s, REWRITE_INTERVAL_MS - batch duration)
```

Значения по умолчанию:

```dotenv
INGEST_INTERVAL_MS=300000
REWRITE_INTERVAL_MS=60000
REWRITE_BATCH_SIZE=20
```

Это важно для требования свежести: даже если DeepSeek → Luna batch выполняется долго, следующий RSS/API poll не откладывается.

## 11.3 Shutdown

На `SIGINT/SIGTERM`:

- отменить ожидающие timers;
- закончить уже начатые source/model requests;
- закрыть SQLite;
- выйти без повреждения WAL.

## 11.4 Run once

```bash
npm run worker:once
```

Нужен для CI/manual demo и внешнего scheduler.

---

# 12. Observability

## 12.1 Structured logs

Pino fields:

```text
service
sourceId
articleId
model
role
latency
error
```

Secrets redacted.

## 12.2 Database evidence

Operational proof хранится не только в logs:

- ingestion runs;
- source runs;
- AI runs;
- validations;
- events;
- snapshots.

## 12.3 Generated report

```bash
npm run report
```

Создаёт `reports/demo-evidence.md` из текущих audit tables.

## 12.4 Model report

```bash
npm run evaluate:ai -- --limit=10
```

Создаёт JSON + Markdown в `reports/`.

---

# 13. Testing plan

## 13.1 Unit tests

### Core

- bounded integer;
- URL normalization;
- hash stability;
- retry delay.

### Ingestion

- HTML cleaning;
- truncation;
- normalization;
- duplicate source item;
- duplicate canonical URL.

### Fact Lock

- each extractor;
- overlaps;
- placeholder order;
- restore;
- missing;
- duplicate;
- unknown;
- moved field;
- added number;
- abnormal length.

### AI

- JSON object extraction;
- schema complete moods;
- primary provider failure → fallback;
- primary Fact Lock failure → fallback;
- successful primary → no fallback.

## 13.2 Integration tests

In-memory SQLite:

- migrations apply;
- source upsert;
- article insert;
- identical article skip;
- changed article version increment;
- two snapshots;
- stale rewrite marking;
- lock acquire/release/expiry.

## 13.3 Contract fixtures

Добавить fixtures для:

- BBC RSS XML;
- Guardian JSON;
- valid OpenRouter JSON;
- invalid OpenRouter JSON.

## 13.4 E2E

- home loads;
- empty state;
- health responds;
- mood param persists;
- mobile no horizontal overflow.

## 13.5 Real AI evaluation

Набор минимум 10 real excerpts, включая:

- много чисел;
- прямую цитату;
- несколько имён;
- дату и деньги;
- короткий headline;
- трагическую тему для irony safety review.

Метрики:

```text
schema pass rate
Fact Lock pass rate
fallback rate
latency p50/p95
tokens
cost/article
human tone distinction score
```

---

# 14. Security and cost

## 14.1 Secrets

- только server-side environment;
- `.env` игнорируется Git;
- не печатать keys;
- logger redact.

## 14.2 Source safety

- URLs из static registry;
- только `http/https`;
- HTML strip;
- React text rendering;
- no `dangerouslySetInnerHTML`.

## 14.3 AI safety

- source fragment считается data, не instruction;
- strict output;
- Fact Lock;
- fail closed;
- irony policy.

## 14.4 Cost safety

- AI только changed records;
- четыре moods одним request;
- max output tokens;
- one transport retry;
- one fallback;
- batch limit;
- daily budget cap;
- persisted actual cost.

## 14.5 Public rewrite action

Для production:

- auth или CAPTCHA;
- distributed rate limit;
- per-user quota.

В тестовом memory limiter + global budget достаточны.

---

# 15. Deployment

## 15.1 Docker Compose

```text
web
worker
named SQLite volume
reports volume
```

## 15.2 Single VPS

Минимум:

```text
1 vCPU
1–2 GB RAM
Docker
reverse proxy/HTTPS
```

AI выполняется в облаке, поэтому GPU не нужен.

## 15.3 Backup

Для SQLite:

- copy через SQLite backup API или остановленный process;
- хранить database + migrations;
- не копировать только `-wal` без основного файла.

## 15.4 Production migration trigger

Переходить на PostgreSQL, когда нужен хотя бы один пункт:

- несколько worker replicas;
- serverless web и отдельный worker;
- высокая write concurrency;
- shared database между hosts;
- строгая durable queue;
- централизованные backups/monitoring.

---

# 16. Почасовой план на три дня

## День 1 — реальные данные

### 09:00–09:45 — skeleton

- repository;
- TypeScript;
- Next.js;
- env schema;
- lint/test configs;
- base layout.

### 09:45–11:00 — persistence

- SQLite client;
- migrations;
- sources;
- ingestion audit;
- articles;
- snapshots;
- indexes.

### 11:00–13:00 — BBC

- adapter interface;
- BBC adapter;
- HTTP retry;
- text cleaner;
- URL/date normalization;
- deduplication.

### 14:00–15:30 — ingestion use case

- source registry;
- run/source counters;
- upsert outcomes;
- partial failure;
- one-shot CLI.

### 15:30–17:30 — grid

- query service;
- cards;
- source link;
- date;
- responsive layout;
- empty state.

### 17:30–18:30 — worker

- immediate ingestion;
- independent five-minute ingestion runner;
- independent one-minute rewrite runner;
- separate locks;
- graceful shutdown with timer cancellation.

### 18:30–19:00 — Gate A/B

Проверить:

- 10+ real rows;
- restart сохраняет данные;
- source links открываются;
- UI работает без AI.

## День 2 — AI

### 09:00–11:00 — Fact Lock

- fact domain;
- regex extractors;
- entity heuristic;
- overlap resolution;
- placeholders;
- restore;
- unit tests.

### 11:00–12:30 — OpenRouter

- client;
- timeout/retry;
- strict schema;
- usage mapping;
- no reasoning;
- prompt.

### 12:30–14:00 — deterministic validator

- occurrence checks;
- field check;
- added concrete facts;
- length ratio;
- validation score.

### 15:00–16:00 — model routing

- DeepSeek primary;
- Luna fallback;
- error classification;
- audit records;
- fake-client tests.

### 16:00–17:00 — persistence

- facts repository;
- rewrites;
- validations;
- stale behavior;
- cost cap.

### 17:00–18:30 — comparison UI

- two columns;
- mood switch;
- model metadata;
- protected facts;
- manual generation.

### 18:30–19:00 — Gate C/D

Проверить:

- tests green;
- 10+ articles × 4 moods;
- added number rejected;
- fallback demonstrated.

## День 3 — доказательства

### 09:00–10:30 — ops

- summary queries;
- cost;
- validation rate;
- source counts;
- latest ingestion.

### 10:30–11:30 — API

- health;
- news list/detail;
- protected job routes;
- error envelope;
- request IDs.

### 11:30–13:00 — evaluation

- real-model benchmark;
- reports;
- compare pass/latency/cost;
- tune prompt only from failures.

### 14:00–15:00 — Docker

- clean image;
- web/worker compose;
- volume;
- healthcheck.

### 15:00–16:00 — CI and smoke

- typecheck;
- lint;
- unit/integration;
- build;
- smoke.

### 16:00–17:00 — docs

- README;
- architecture;
- data model;
- Fact Lock;
- AI route;
- limitations.

### 17:00–18:00 — screenshots

- desktop neutral;
- mood contrast;
- comparison;
- fact ledger;
- mobile;
- test/report proof.

### 18:00–19:00 — buffer

Только blockers:

- startup failure;
- missing data;
- broken links;
- AI response instability;
- layout overflow;
- README mismatch.

---

# 17. Risk matrix

| Риск | Вероятность | Влияние | Mitigation |
|---|---:|---:|---|
| RSS временно недоступен | Средняя | Среднее | Кэшированные записи, partial run, retry |
| Guardian key/лимит | Средняя | Низкое | Guardian optional, BBC primary |
| AI возвращает invalid JSON | Средняя | Среднее | Strict schema, Zod, Luna fallback |
| AI меняет факты | Высокая без защиты | Высокое | Placeholders, deterministic gate, fail closed |
| Heuristic NER false positive | Средняя | Среднее | Benchmark, conservative prompt, fallback |
| Ирония неуместна | Средняя | Высокое | Mild prompt, explicit limitation, future classifier |
| Стоимость runaway | Низкая | Среднее | Changed-only, batch, max tokens, daily cap |
| SQLite lock | Низкая при 1 worker | Среднее | WAL, one worker, job locks, Postgres path |
| Не хватает времени | Средняя | Высокое | Gates, optional Guardian, no full scraping |
| README расходится с кодом | Средняя | Высокое | Commands smoke, final checklist |

---

# 18. Definition of done

## Product

- [ ] 10+ реальных статей.
- [ ] 4 moods.
- [ ] Grid desktop/mobile.
- [ ] Original/rewrite comparison.
- [ ] Source links.
- [ ] Original остаётся при AI failure.

## Data

- [ ] SQLite сохраняется после restart.
- [ ] Raw payload сохранён.
- [ ] Current normalized record сохранён.
- [ ] Changed record создаёт snapshot/version.
- [ ] Ingestion counters видны.

## AI

- [ ] DeepSeek primary.
- [ ] Luna fallback.
- [ ] Strict schema.
- [ ] Fact Lock.
- [ ] Added number test.
- [ ] Model/cost audit.
- [ ] Daily budget cap.

## Engineering

- [ ] Typecheck.
- [ ] Lint.
- [ ] Unit/integration tests.
- [ ] Build.
- [ ] Docker clean start.
- [ ] Health endpoint.
- [ ] `.env.example` complete.

## Submission

- [ ] Git repository.
- [ ] README from clean machine.
- [ ] 5–6 screenshots.
- [ ] Demo report.
- [ ] Limitations described honestly.
- [ ] 5–7 minute demo rehearsed.

---

# 19. Demo narrative

Главная мысль защиты:

> Я не делал ещё один UI поверх LLM. Я построил маленький контролируемый data pipeline, где AI отвечает только за стиль, а программа решает, можно ли публиковать результат.

Последовательность:

1. real source;
2. stored record;
3. mood switch;
4. side-by-side;
5. exact fact ledger;
6. rejection test;
7. fallback code;
8. ops/cost;
9. limitations and next step.

---

# 20. Следующий этап после тестового

## P0

- sensitivity classifier;
- production source licensing review;
- persistent per-article job queue;
- semantic entailment evaluator;
- PostgreSQL.

## P1

- multilingual NER;
- prompt/model canary;
- source health alerts;
- admin review queue;
- accepted/rejected diff viewer.

## P2

- personalized moods;
- more sources;
- full-text licensed feeds;
- user collections;
- analytics on framing changes.

---

# 21. Финальное решение

Для трёхдневного задания оптимальная конфигурация:

```text
Next.js + TypeScript
SQLite + immutable snapshots
BBC RSS + optional Guardian
separate worker с независимыми ingestion/rewrite cadence
DeepSeek V4 Flash primary
GPT-5.6 Luna fallback
strict structured output
application-level Fact Lock
fail-closed UI
```

Она достаточно сложная, чтобы показать архитектуру, AI, данные и проверку, но достаточно ограниченная, чтобы довести продукт до убедительного состояния за три дня.
