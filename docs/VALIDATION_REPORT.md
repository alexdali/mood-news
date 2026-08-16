# Отчёт о выполненных проверках

Дата последней проверки: 2026-08-17.

Отчёт описывает фактическое состояние реализованного репозитория. Секреты из локального `.env` не выводились и в Git не добавлялись.

## Итог

| Проверка | Результат |
|---|---|
| `npm install` | PASS: lockfile создан, 461 package, 0 vulnerabilities |
| `npm run check` | PASS |
| Unit/integration | PASS: 57/57 |
| `npm run build` | PASS |
| Existing SQLite migrations | PASS: `0006` и `0007` применены поверх production-базы после backup |
| Docker image build | PASS |
| Docker Compose health | PASS: web healthy, worker running |
| Реальный BBC import | PASS: последний cycle 133 fetched, 0 errors; 115 active records в проверенном volume |
| Playwright desktop/mobile | PASS: 12/12 |
| RU/EN UI и URL state | PASS |
| AI locale persistence | PASS: EN и RU batches сосуществуют, 8 rows на статью в integration test |
| Live AI generation | PASS на VPS: OpenRouter, DeepSeek primary, Luna fallback, отдельные EN/RU fact ledgers |

## Полный quality gate

Команда:

```bash
npm run check
```

Фактический результат:

```text
Architecture check: 164 TypeScript/JavaScript files, 36 Markdown files, 7 migrations
Local imports: 456 resolved
Syntax: 158 TypeScript files parsed
TypeScript: PASS
ESLint: PASS
Vitest: 17 files passed, 57 tests passed
```

Проверки включают Fact Lock, locale-specific fact ledger, exact numeric validation, стабильные fact IDs, fallback routing, Unicode/Cyrillic entities, отклонение результата на неверном языке, idempotent ingestion, snapshots, job locks, независимое хранение `en`/`ru` rewrites и защиту очереди от starvation после повторных ошибок.

## Production build и migrations

`npm run build` прошёл для Next.js 16.3.1. Все dynamic/static routes собраны. Тот же build прошёл внутри multi-stage Dockerfile через воспроизводимый `npm ci`.

Все migrations `0001`–`0007` проверены на чистых in-memory базах. На VPS поверх рабочей SQLite-базы применены:

1. `0006_fact_localizations.sql` — locale values фактов с уникальностью `(fact_id, locale)`;
2. `0007_ai_run_prompt_version.sql` — prompt-aware история AI-попыток и индекс очереди.

До миграции создана согласованная резервная копия production SQLite с правами `600` и SHA-256 checksum. Существующие rewrites и validation history сохранены.

## Docker/VPS smoke

Команда:

```bash
docker compose up -d --build
```

На VPS проверено:

- `web` слушает публичный `0.0.0.0:3001` и проходит healthcheck;
- `worker` использует общий persistent SQLite volume;
- повторный BBC poll обработал 131 source item без ошибок;
- `/api/health` сообщает `database=connected` и не раскрывает секреты;
- `/api/news?mood=neutral&lang=ru` возвращает только validated RU content, source отдельно остаётся в `original`;
- source URLs очищены от BBC tracking-параметров.
- соседний проект на порту `80` продолжает отвечать `200`.

На момент проверки база содержала 117 active articles, 30 EN и 17 RU статей с полными batches по четыре mood текущего prompt, 232 EN и 68 RU locale fact rows. Затраты OpenRouter за день составили `$0.049332` при лимите `$1.00`.

## Browser acceptance

Playwright на свежей временной базе запущен в проектах Desktop Chrome и Pixel 7:

```text
10 passed, 2 skipped because the isolated database had no imported articles
```

Покрыто:

- grid и mood controls;
- health endpoint;
- mood state в URL;
- переключение `RU / EN` с сохранением mood;
- `html[lang]`;
- русские UI labels;
- отсутствие горизонтального overflow;
- реальная detail page, comparison и Fact Lock preview;
- locale-aware back link.

Дополнительная browser-проверка публичного VPS подтвердила:

- только русские validated-карточки на русской главной;
- активные `RU` и `Тревожно` состояния с `mood=concerned&lang=ru` в URL;
- 5/5 защищённых фактов на проверенной detail page;
- локализованные значения `Пять`, `в воскресенье`, `в графстве Килдэр` рядом с исходными `Five`, `Sunday`, `County Kildare`;
- 0 px overflow в публичном desktop browser; mobile overflow отдельно покрыт Playwright;
- переключение обратно на EN с `html[lang=en]` и английским заголовком страницы сравнения.

Скриншоты лежат в `docs/screenshots/`.

## AI

Через официальный OpenRouter models endpoint подтверждено наличие настроенных model IDs:

```text
deepseek/deepseek-v4-flash-0731
openai/gpt-5.6-luna
```

Live production и тестами подтверждено:

- один structured-output вызов возвращает locale fact ledger и четыре moods на одном языке;
- primary и fallback проходят одинаковый Fact Lock;
- неверный язык отклоняется;
- числа, URL, деньги, проценты и время нельзя изменить при переводе фактов;
- английские и русские results не перезаписывают друг друга;
- worker обрабатывает `AI_REWRITE_LOCALES=en,ru`;
- original всегда остаётся доступен при fail-closed поведении.

В production DeepSeek успешно создаёт batches как primary. При schema- или Fact Lock-ошибке приложение вызывает Luna; отклонённые обеими моделями варианты не публикуются. Ограниченный backfill обработал 40 пар: 33 accepted, 7 fail-closed, budget не был достигнут.

## Артефакты

- `docs/screenshots/01-home-grid-ru-desktop.png`
- `docs/screenshots/02-article-fact-lock-ru.png`
- `docs/screenshots/03-operations-ru.png`
- `docs/screenshots/04-method-ru.png`
- `docs/screenshots/05-home-grid-ru-mobile.png`
