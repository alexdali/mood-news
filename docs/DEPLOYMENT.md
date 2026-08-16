# Deployment

## Docker Compose

```bash
cp .env.example .env
docker compose up --build
```

Публикуемый адрес настраивается без изменения Compose-файла:

```dotenv
COMPOSE_PROJECT_NAME=mood_news
WEB_BIND_ADDRESS=0.0.0.0
WEB_PORT=3001
APP_URL=http://SERVER_IP:3001
OPENROUTER_SITE_URL=http://SERVER_IP:3001
```

Production URL: `https://mood-news.testvps.click`. Общий `deploy/Caddyfile.vps` направляет этот host на `127.0.0.1:3001` и сохраняет соседний `moon-courier.testvps.click` на `127.0.0.1:3000`. Для закрытия прямого доступа по IP используется `WEB_BIND_ADDRESS=127.0.0.1`.

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
