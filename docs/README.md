# Индекс документации

## Начать здесь

1. [`../README.md`](../README.md) — запуск, возможности, команды и краткая архитектура.
2. [`FINAL_IMPLEMENTATION_PLAN.md`](FINAL_IMPLEMENTATION_PLAN.md) — максимально подробный план реализации и порядок работ.
3. [`FILE_MAP.md`](FILE_MAP.md) — карта модулей и точек входа.
4. [`ACCEPTANCE_MATRIX.md`](ACCEPTANCE_MATRIX.md) — соответствие каждому пункту тестового задания.
5. [`VALIDATION_REPORT.md`](VALIDATION_REPORT.md) — что реально проверено в текущем окружении и что требуется прогнать локально.

## Архитектура и данные

- [`ARCHITECTURE.md`](ARCHITECTURE.md) — процессы, границы слоёв и основные потоки.
- [`DATA_MODEL.md`](DATA_MODEL.md) — таблицы, связи и инварианты.
- [`decisions/`](decisions/) — Architecture Decision Records.
- [`POSTGRES_MIGRATION.md`](POSTGRES_MIGRATION.md) — путь от SQLite к PostgreSQL при росте нагрузки.

## AI и проверка фактов

- [`AI_PIPELINE.md`](AI_PIPELINE.md) — DeepSeek → детерминированный gate → Luna.
- [`FACT_LOCK.md`](FACT_LOCK.md) — извлечение фактов, placeholders, восстановление и ограничения.
- [`TEST_STRATEGY.md`](TEST_STRATEGY.md) — unit/integration/E2E/model benchmark.
- [`LIMITATIONS.md`](LIMITATIONS.md) — что прототип сознательно не гарантирует.

## Источники и эксплуатация

- [`NEWS_SOURCES.md`](NEWS_SOURCES.md) — BBC/Guardian, частота и поведение при сбоях.
- [`SOURCE_POLICY.md`](SOURCE_POLICY.md) — использование source-provided fragments вместо полного scraping.
- [`OPERATIONS.md`](OPERATIONS.md) — worker, locks, cost guard, audit, backup и recovery.
- [`DEPLOYMENT.md`](DEPLOYMENT.md) — local, Docker, VPS/systemd и Nginx.
- [`SECURITY.md`](SECURITY.md) — threat model и security checklist.

## API и проверка

- [`API.md`](API.md) — человекочитаемое описание endpoints.
- [`openapi.yaml`](openapi.yaml) — OpenAPI-контракт.
- [`http/mood-news-grid.http`](http/mood-news-grid.http) — ручные запросы IDE/HTTP Client.

## Реализация и сдача

- [`THREE_DAY_PLAN.md`](THREE_DAY_PLAN.md) — почасовой execution schedule.
- [`IMPLEMENTATION_CHECKLIST.md`](IMPLEMENTATION_CHECKLIST.md) — инженерный checklist.
- [`SUBMISSION_CHECKLIST_RU.md`](SUBMISSION_CHECKLIST_RU.md) — финальная проверка сдачи.
- [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) — сценарии демонстрации на 90 секунд и 5–7 минут.
- [`SCREENSHOT_PLAN.md`](SCREENSHOT_PLAN.md) — обязательные кадры.
- [`ROADMAP.md`](ROADMAP.md) — развитие после тестового.
