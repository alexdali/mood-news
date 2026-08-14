# Матрица соответствия тестовому заданию

| Требование | Реализация | Файл/экран | Доказательство |
|---|---|---|---|
| Минимум 10 реальных новостей | BBC/Guardian ingestion | `src/modules/ingestion/` | `npm run ingest`, `/ops` |
| Сохранить новости | SQLite repositories | `migrations/`, `src/db/` | `npm run db:inspect` |
| Показать гридом | Responsive grid | `/`, `news-grid.tsx` | desktop/mobile UI |
| Переключатель настроения | Global query-param mood switch | `mood-switcher.tsx` | четыре кнопки |
| Двуязычный UI и контент | Global `RU / EN`, locale-aware AI batches | `locale-switcher.tsx`, `rewrite-service.ts` | desktop/mobile E2E + locale persistence test |
| Original и rewrite рядом | Comparison screen | `/news/:id` | две колонки |
| Ссылка на оригинал | Source badge/link | card/detail | внешний URL |
| Нельзя заранее вручную написать mood news | AI pipeline по импортированным records | `rewrite-service.ts` | AI/validation audit |
| Сохранить имена, даты, числа, места, цитаты | Fact Lock | `modules/fact-lock` | unit tests + facts table |
| Понятно происхождение | source ID/name/URL/raw payload | DB + UI | `/ops`, detail |
| Объяснить контроль фактов | README + docs | `README.md`, `FACT_LOCK.md` | документация |
| Как запустить | bootstrap/Docker | README | clean-start steps |
| Где данные | schema/data model | `DATA_MODEL.md` | tables/migrations |
| Что использовали из AI | DeepSeek + Luna via OpenRouter | env/ops/README | AI run rows |
| Показать подход и проверку | benchmark/evidence/tests | scripts/tests/reports | report artifacts |

## Дополнительные демонстрационные функции

- независимый пятиминутный ingestion runner;
- independent source failures;
- application-level fallback;
- cost guard;
- exact prompt version;
- stale rewrite invalidation;
- operations dashboard;
- model benchmark;
- Docker/systemd examples.

## Перед сдачей

- [x] минимум 10 actual DB records (115 active в проверенном Docker volume 2026-08-15);
- [ ] минимум 3 articles с validated четырьмя moods;
- [ ] все source URLs открываются;
- [ ] один article содержит число/дату/имя для визуального Fact Lock;
- [x] tests проходят (48 unit/integration + 12 desktop/mobile E2E);
- [x] build проходит локально и внутри Docker;
- [x] screenshots добавлены;
- [ ] README проверен на чистой машине;
- [ ] API keys отсутствуют в Git;
- [ ] benchmark/report приложены или упомянуты.
