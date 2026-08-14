# Operations runbook

## 1. Processes

### Web

```bash
npm run dev
# production
npm run build && npm start
```

### Worker

```bash
npm run worker
```

Worker использует два независимых periodic runners:

### Ingestion runner

1. acquire ingestion lock;
2. fetch active sources;
3. persist/dedupe;
4. release lock;
5. повторить через `INGEST_INTERVAL_MS` — по умолчанию 300000 мс.

### Rewrite runner

1. calculate rewrite-lock TTL from batch size, two-model fallback and provider retries;
2. acquire rewrite lock;
3. process pending batch; if the daily AI budget is reached, stop the remaining batch instead of creating repeated blocked attempts;
4. release lock;
5. повторить через `REWRITE_INTERVAL_MS` — по умолчанию 60000 мс.

Два runner выполняются независимо: медленный DeepSeek → Luna batch не откладывает очередной source poll.

`src/modules/jobs/lock-policy.ts` prevents the lock from expiring halfway through a slow DeepSeek → Luna batch.

## 2. Health

```bash
curl -s http://localhost:3000/api/health | jq
```

Проверить:

- `database=connected`;
- `aiConfigured=true` перед AI demo;
- `primaryModel` и `fallbackModel`;
- timestamp.

## 3. Evidence

UI:

```text
/ops
```

CLI:

```bash
npm run db:inspect
npm run report
```

## 4. Worker monitoring

Логи JSON через pino. Ключевые события:

- `Ingestion cycle complete`;
- `Rewrite cycle complete`;
- `Model output failed Fact Lock; trying fallback`;
- `AI attempt failed; trying next model`;
- `Ingestion cycle failed`;
- `Rewrite cycle failed`.

Секреты redacted.

## 5. Manual recovery

### Источники не загрузились

```bash
npm run ingest
npm run db:inspect
```

Проверить network, URLs и Guardian key.

### AI не создаёт варианты

```bash
npm run rewrite -- --limit=1
```

Проверить:

- OpenRouter key;
- model ID;
- account credits;
- AI run rows;
- prompt/schema compatibility;
- daily cost limit.

### Завис lock

Locks имеют TTL. Для локального emergency recovery:

```bash
sqlite3 data/mood-news.db "select * from job_locks;"
sqlite3 data/mood-news.db "delete from job_locks where expires_at < datetime('now');"
```

ISO comparison используется приложением; ручное удаление допустимо только после проверки отсутствия живого worker.

### Source article изменился

Новый hash обновляет original и помечает old rewrites `stale`. Запустить:

```bash
npm run rewrite -- --limit=20
```

## 6. Cost incident

1. установить `MAX_DAILY_AI_COST_USD=0`;
2. перезапустить worker;
3. проверить `ai_runs`;
4. убедиться, что нет внешнего cron, повторяющего запросы;
5. проверить batch size и cache status;
6. только затем вернуть лимит.

При достижении лимита `runRewritePendingJob` возвращает `budgetBlocked=true` и прекращает текущий batch. Поле `selected` при этом может быть больше `processed`: оставшиеся статьи не считаются ошибочными и будут рассмотрены в следующем цикле после восстановления бюджета.

## 7. Backup

```bash
mkdir -p backups
sqlite3 data/mood-news.db ".backup 'backups/mood-news-$(date +%F-%H%M).db'"
```

## 8. Restore

Остановить web/worker, заменить DB-файл, удалить stale `-wal/-shm`, запустить `npm run db:migrate`, затем процессы.

## 9. Deployment choices

### Самый простой

Docker Compose на одном VPS.

### Без Docker

Два systemd services + Nginx. Примеры в `deploy/`.

### Serverless caveat

Локальный SQLite не подходит для ephemeral/multiple serverless instances. Для Vercel-подобного deploy нужен hosted SQLite-compatible storage или PostgreSQL и внешний scheduler.
