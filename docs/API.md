# HTTP API

Все ответы имеют envelope:

```json
{ "ok": true, "data": {} }
```

или:

```json
{
  "ok": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Readable message",
    "requestId": "request_..."
  }
}
```

## `GET /api/health`

Проверяет SQLite и показывает, настроены ли AI/Guardian без раскрытия ключей.

## `GET /api/news`

Query:

- `mood`: `neutral|hopeful|concerned|ironic`;
- `lang`: `en|ru` (default `en`), язык выбранного AI rewrite;
- `limit`: 1–100;
- `offset`: 0–100000.

Response содержит original, selected display text, source, rewrite metadata и validation.

## `GET /api/news/:id`

Query: `mood`, `lang=en|ru`.

Дополнительно возвращает available moods и fact ledger выбранного языка. У каждого факта есть локализованное `value`, исходное `sourceValue`, `locale` и `localizationModel`; при отсутствии AI-версии API безопасно возвращает source value.

## `POST /api/news/:id/rewrite`

Query: `lang=en|ru`. Создаёт все четыре moods на выбранном языке. Используется для ручного demo. Ограничен memory rate limiter и daily AI budget.

## `GET /api/ops/summary`

Query:

- `aiPage`: страница журнала AI-запросов;
- `validationPage`: страница отклонений Fact Lock.

Возвращает articles, rewrites, latest ingestion, AI 24h, validation summary, source counts, model route, расходы за всё время/по UTC-дням, постраничный журнал AI-запросов и постраничные подробности отклонений Fact Lock.

## Job auth

```http
Authorization: Bearer <CRON_SECRET>
```

или:

```http
x-cron-secret: <CRON_SECRET>
```

## `POST /api/jobs/ingest`

Запускает один locked ingestion cycle.

## `POST /api/jobs/rewrite-pending?limit=20`

Обрабатывает pending batch. `limit` ограничивается диапазоном 1–100.

Пример `data`:

```json
{
  "requestId": "request_...",
  "acquired": true,
  "selected": 20,
  "processed": 7,
  "succeeded": 6,
  "failed": 1,
  "budgetBlocked": true,
  "errors": ["article_.../ru: Daily AI budget exceeded"]
}
```

Смысл полей:

- `selected` — сколько pending пар `статья/locale` выбрано в начале цикла;
- `processed` — сколько статей фактически начали обрабатывать;
- `succeeded` — сколько получили полный accepted batch из четырёх moods;
- `failed` — сколько обработанных статей завершились ошибкой в этом цикле;
- `budgetBlocked` — worker остановил оставшуюся часть batch после достижения дневного лимита;
- `acquired=false` — другой процесс уже держит job lock.
