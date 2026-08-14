# Стратегия тестирования

## Unit

- cleaning/normalization;
- deduplication;
- fact extraction;
- overlap resolution;
- placeholders/restore;
- deterministic rejection;
- JSON extraction;
- application fallback;
- query integer bounds.

## Integration

In-memory SQLite:

- migrations;
- source upsert;
- article insert/skip/update;
- version increment;
- immutable snapshots;
- expiring job lock.

## Contract fixtures — следующий приоритет

- BBC XML fixture;
- Guardian JSON fixture;
- valid/invalid OpenRouter payloads.

## E2E

Playwright desktop/mobile:

- home page;
- health endpoint;
- basic layout.

E2E не должен обращаться к AI. Для стабильного полного E2E следует подготовить отдельную database fixture, не смешиваемую с production screenshots.

## Real AI evaluation

```bash
npm run ingest
npm run evaluate:ai -- --limit=10
```

Не запускается в CI. Сравнивает DeepSeek и Luna по:

- Fact Lock pass rate;
- average score;
- latency;
- tokens;
- actual cost;
- issue codes.

## Acceptance scenarios

1. После import есть 10+ real articles.
2. Есть 4 validated moods.
3. Новое `99%` отклоняется.
4. Пропавший placeholder отклоняется.
5. Provider failure вызывает Luna.
6. Fact Lock failure primary вызывает Luna.
7. Обе модели fail — original остаётся.
8. Source unavailable — старый grid работает.
9. Changed source создаёт version/snapshot.
10. Model/cost видны в audit.

## Definition of done

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

После запуска web:

```bash
npm run smoke
```
