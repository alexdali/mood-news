# Отчёт о выполненных проверках

Дата последней проверки: 2026-08-15.

Отчёт описывает фактическое состояние реализованного репозитория. Секреты из локального `.env` не выводились и в Git не добавлялись.

## Итог

| Проверка | Результат |
|---|---|
| `npm install` | PASS: lockfile создан, 461 package, 0 vulnerabilities |
| `npm run check` | PASS |
| Unit/integration | PASS: 48/48 |
| `npm run build` | PASS |
| Existing SQLite migration | PASS: `0004_rewrite_locales.sql` применена поверх рабочей базы |
| Docker image build | PASS |
| Docker Compose health | PASS: web healthy, worker running |
| Реальный BBC import | PASS: последний cycle 133 fetched, 0 errors; 115 active records в проверенном volume |
| Playwright desktop/mobile | PASS: 12/12 |
| RU/EN UI и URL state | PASS |
| AI locale persistence | PASS: EN и RU batches сосуществуют, 8 rows на статью в integration test |
| Live AI generation | NOT RUN: `OPENROUTER_API_KEY` в локальной среде не задан |

## Полный quality gate

Команда:

```bash
npm run check
```

Фактический результат:

```text
Architecture check: 162 TypeScript/JavaScript files, 36 Markdown files, 5 migrations
Local imports: 442 resolved
Syntax: 156 TypeScript files parsed
TypeScript: PASS
ESLint: PASS
Vitest: 16 files passed, 48 tests passed
```

Проверки включают Fact Lock, fallback routing, Unicode/Cyrillic entities, отклонение результата на неверном языке, idempotent ingestion, snapshots, job locks и независимое хранение `en`/`ru` rewrites.

## Production build и migrations

`npm run build` прошёл для Next.js 16.3.1. Все dynamic/static routes собраны. Тот же build прошёл внутри multi-stage Dockerfile через воспроизводимый `npm ci`.

Миграция `0004_rewrite_locales.sql` проверена двумя путями:

1. на чистых in-memory базах во всех integration tests;
2. поверх ранее существующей локальной базы с migrations `0001`–`0003`.

Старые rewrites переносятся как `locale='en'`; validation history сохраняется. Новая уникальность — `(article_id, mood, locale, prompt_version)`.

## Docker/VPS-equivalent smoke

Команда:

```bash
docker compose up -d --build
```

Проверено:

- `web` слушает `0.0.0.0:3000` и проходит healthcheck;
- `worker` использует общий persistent SQLite volume;
- повторный BBC poll корректно обработал 131 unchanged, 1 new и 1 changed record;
- без OpenRouter key rewrite runner отключается явно, ingestion продолжает работать;
- `/api/health` сообщает `database=connected` и не раскрывает секреты;
- `/api/news?mood=neutral&lang=ru` возвращает `locale=ru`;
- source URLs очищены от BBC tracking-параметров.

## Browser acceptance

Playwright запущен в проектах Desktop Chrome и Pixel 7:

```text
12 passed
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

Дополнительная ручная проверка in-app browser подтвердила:

- 24 карточки на русской главной;
- активные `RU` и `Тревожно`/`С надеждой` состояния;
- 7 защищённых occurrences на проверенной detail page;
- 0 px overflow на desktop и mobile;
- локализованные `/ops` и `/about`.

Скриншоты лежат в `docs/screenshots/`.

## AI: проверено и не проверено

Через официальный OpenRouter models endpoint подтверждено наличие настроенных model IDs:

```text
deepseek/deepseek-v4-flash-0731
openai/gpt-5.6-luna
```

Статически и тестами подтверждено:

- target locale входит в prompt и validator;
- один вызов возвращает четыре moods на одном языке;
- primary и fallback проходят одинаковый Fact Lock;
- неверный язык отклоняется;
- английские и русские results не перезаписывают друг друга;
- worker обрабатывает `AI_REWRITE_LOCALES=en,ru`;
- original всегда остаётся доступен при fail-closed поведении.

Live AI-запрос не выполнялся, потому что ключ отсутствует. Поэтому `0 validated rewrites` в приложенных ops evidence — честное текущее состояние, а не успешный AI benchmark. Для завершения live acceptance владелец должен локально добавить `OPENROUTER_API_KEY` в `.env` и выполнить:

```bash
npm run rewrite -- --limit=3
npm run evaluate:ai -- --limit=3
```

Ключ не нужно передавать в чат или коммитить.

## Артефакты

- `docs/screenshots/01-home-grid-ru-desktop.png`
- `docs/screenshots/02-article-fact-lock-ru.png`
- `docs/screenshots/03-operations-ru.png`
- `docs/screenshots/04-method-ru.png`
- `docs/screenshots/05-home-grid-ru-mobile.png`
