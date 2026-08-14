# Implementation checklist

## Repository

- [ ] `.env.example` копируется без ошибок.
- [ ] Нет secrets в Git.
- [ ] `npm install` проходит на Node 22.
- [ ] `npm run typecheck` проходит.
- [ ] `npm run lint` проходит.
- [ ] `npm test` проходит.
- [ ] `npm run build` проходит.

## Data

- [ ] Migrations применяются на пустой SQLite.
- [ ] BBC import возвращает реальные records.
- [ ] Есть минимум 10 active articles.
- [ ] Duplicate poll не создаёт duplicates.
- [ ] Changed content увеличивает version.
- [ ] Snapshot создаётся только для changed version.
- [ ] Source errors видны в ingestion audit.

## AI

- [ ] Model IDs проверены `npm run verify:models`.
- [ ] DeepSeek создаёт 4 moods.
- [ ] Luna вызывается после provider failure.
- [ ] Luna вызывается после Fact Lock failure.
- [ ] Missing placeholder отклоняется.
- [ ] Added number отклоняется.
- [ ] Invalid JSON отклоняется.
- [ ] Cost/tokens/latency записываются.
- [ ] Daily cost cap проверен.

## UI

- [ ] Grid responsive.
- [ ] Mood сохраняется в URL.
- [ ] Source links открываются.
- [ ] Original остаётся при pending/failure.
- [ ] Comparison работает.
- [ ] Fact ledger читаем.
- [ ] Ops data не падает на пустой БД.
- [ ] Mobile no horizontal overflow.

## Operations

- [ ] Worker запускает ingestion сразу.
- [ ] Ingestion cadence равен 5 минутам.
- [ ] Rewrite cadence независим и по умолчанию равен 1 минуте.
- [ ] Долгий AI batch не задерживает source poll.
- [ ] Два ingest cycles и два rewrite cycles не накладываются.
- [ ] SIGTERM очищает timers и завершает worker.
- [ ] Health endpoint green.
- [ ] `npm run smoke` green.
- [ ] Docker Compose запускает web + worker.

## Submission

- [ ] README проверен с чистой машины.
- [ ] Архитектура совпадает с кодом.
- [ ] 5–6 screenshots готовы.
- [ ] Benchmark/report приложен.
- [ ] Limitations описаны.
- [ ] Demo занимает не более 7 минут.
