# Путь миграции SQLite → PostgreSQL

Для трёхдневного прототипа используется SQLite: он сокращает инфраструктурный объём и оставляет время на данные, Fact Lock и проверку AI. Переход на PostgreSQL нужен, когда появляется хотя бы одно из условий:

- несколько web/worker-реплик;
- заметная параллельная запись;
- managed hosting без устойчивого общего диска;
- сложная аналитика или внешние BI-потребители;
- требования к резервному копированию и point-in-time recovery.

## Что уже облегчает перенос

1. SQL находится в migrations, а не внутри UI.
2. Доступ к данным изолирован в `src/db/repositories`.
3. Domain types не зависят от SQLite.
4. Бизнес-логика импортов, Fact Lock и model routing не выполняет SQL напрямую.
5. Идентификаторы генерируются приложением и не зависят от `AUTOINCREMENT`.
6. Времена хранятся как ISO 8601 UTC.

## Что заменить

```text
better-sqlite3                 → pg / postgres.js / Kysely
SQLite singleton              → connection pool
? и @named parameters         → параметры выбранного PostgreSQL client
WAL / busy_timeout            → настройки сервера и пула
job_locks table               → PostgreSQL advisory lock или SELECT ... FOR UPDATE
```

## Рекомендуемая последовательность

1. Добавить интерфейсы репозиториев для write-heavy модулей.
2. Реализовать PostgreSQL adapters параллельно SQLite.
3. Перевести migrations на PostgreSQL dialect.
4. Экспортировать таблицы в порядке зависимостей:
   `sources → ingestion_runs → news_articles → snapshots/facts/rewrites → validation_runs/ai_runs/events`.
5. Сверить counts, unique constraints и foreign keys.
6. Прогнать integration tests на временной PostgreSQL базе.
7. Переключить worker, затем web read path.
8. После периода двойной проверки удалить SQLite adapter.

## Изменения типов

- `INTEGER CHECK (0,1)` можно заменить на `BOOLEAN`.
- ISO строки можно заменить на `TIMESTAMPTZ`.
- JSON строки — на `JSONB`.
- `REAL` для денежных метрик лучше заменить на `NUMERIC`, если стоимость станет финансово значимой.

## Чего не делать

Не следует вводить PostgreSQL в тестовое только ради внешнего вида архитектуры. Он не улучшает демонстрацию сохранения фактов, но добавляет provisioning, secrets, network и migration surface. В README достаточно показать изоляцию persistence и реалистичный план перехода.
