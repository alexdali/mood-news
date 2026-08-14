# План на три дня

Полная декомпозиция находится в `FINAL_IMPLEMENTATION_PLAN.md`. Здесь — жёсткий execution order.

## День 1

1. Environment и SQLite migrations.
2. BBC adapters.
3. Clean/normalize/hash/dedupe.
4. Article upsert + snapshots.
5. One-shot import и worker.
6. Grid, source links, responsive UI.

**Gate:** 10+ real articles видны без AI.

## День 2

1. Fact extractors.
2. Placeholders/restore.
3. Deterministic validator и tests.
4. OpenRouter strict client.
5. DeepSeek primary.
6. Luna application fallback.
7. Rewrites/validations/AI audit.
8. Comparison page.

**Gate:** 10+ articles × 4 validated moods.

## День 3

1. Ops screen.
2. Model benchmark.
3. API/job auth/error handling.
4. Docker clean start.
5. CI/build/smoke.
6. README/docs.
7. Screenshots.
8. Demo rehearsal.

**Buffer:** последние 60 минут — только blockers.

## Приоритет при нехватке времени

1. Real source + original link.
2. Persistent data.
3. Four moods.
4. Fact Lock rejection.
5. Comparison.
6. README.
7. Fallback/audit.
8. Ops/benchmark.
9. Guardian.
