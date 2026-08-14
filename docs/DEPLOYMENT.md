# Deployment

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Сервисы:

```text
web      Next.js standalone server
worker   tsx scripts/worker.ts
```

Оба используют named volume `/app/data` с одним SQLite-файлом. Конфигурация рассчитана на один worker.

## Переменные

Обязательные для полного сценария:

```text
OPENROUTER_API_KEY
CRON_SECRET
```

Guardian optional.

## Health

```text
GET /api/health
```

## Single VPS

Рекомендуется:

- reverse proxy с HTTPS;
- Docker restart policy;
- backup SQLite volume;
- OpenRouter workspace budget;
- log rotation.

GPU не нужен.

## Backup SQLite

Безопасные варианты:

- SQLite backup API;
- остановить web/worker и скопировать database;
- filesystem snapshot, который согласован с WAL.

Нельзя считать одиночное копирование `mood-news.db` во время активной записи гарантированно согласованным без backup procedure.

## Serverless

SQLite-файл не подходит для независимых ephemeral instances. Для Vercel/serverless web + external worker перейти на PostgreSQL.
