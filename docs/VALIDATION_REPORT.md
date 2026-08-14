# Отчёт о проверке стартового репозитория

Дата проверки: 2026-08-14.

Этот файл разделяет **фактически выполненные проверки** и команды, которые необходимо повторить после установки npm-зависимостей на машине с доступом к реестру.

## Выполнено в текущем окружении

### 1. Архитектурные инварианты

Команда:

```bash
node scripts/check-architecture.mjs
```

Проверяет:

- наличие обязательных файлов и SQL migrations;
- отсутствие server-only импортов в client components;
- отсутствие `dangerouslySetInnerHTML`;
- актуальные model IDs;
- пятиминутный ingestion interval и отдельный rewrite interval;
- наличие application-level DeepSeek → Luna fallback;
- наличие динамической lock policy и независимого scheduler;
- отсутствие очевидно захардкоженных API keys;
- локальные Markdown-ссылки;
- обязательные package scripts и test scaffolds.

Результат: **пройдено**.

```text
159 TypeScript/JavaScript source files scanned
36 Markdown files checked for local links
3 SQL migration files found
```

### 2. Разрешение локальных импортов

Команда:

```bash
node scripts/check-local-imports.mjs
```

Проверяет статические локальные импорты `@/…` и `./…` для TypeScript, JavaScript, JSON и CSS.

Результат: **пройдено: 389 импортов разрешены, неразрешённых локальных импортов нет**.

### 3. Синтаксис TypeScript/TSX

Команда после установки зависимостей:

```bash
node scripts/check-syntax.mjs
```

В текущем окружении этот же скрипт запущен с глобально установленным TypeScript parser API.

Результат: **пройдено: 153 `.ts`/`.tsx` файла разобраны без синтаксических diagnostics**.

### 4. Приближённая проверка внутреннего type graph

Дополнительно выполнен `tsc --noEmit` с временными декларациями только для внешних npm-модулей. Это проверяет внутренние связи типов, strict nullability и локальные сигнатуры, но **не заменяет** настоящий typecheck с реальными типами Next.js, React, Zod, Vitest и остальных зависимостей.

Результат: **пройдено без diagnostics**.

### 5. SQLite migrations

Все SQL-файлы применены по порядку к чистой временной SQLite-базе:

```text
0001_initial.sql
0002_indexes.sql
0003_article_snapshots.sql
```

Проверено:

- создано 11 прикладных таблиц;
- существует `news_articles.version`;
- существует внешний ключ `article_snapshots.article_id → news_articles.id`;
- `PRAGMA foreign_key_check` не возвращает ошибок.

Результат: **пройдено**.

### 6. JSON и YAML

Успешно разобраны:

- `package.json`;
- `tsconfig.json`;
- `.prettierrc.json`;
- `docker-compose.yml`;
- `docs/openapi.yaml`;
- `.github/workflows/ci.yml`;
- `.github/workflows/e2e.yml`.

Результат: **пройдено**.

### 7. Конфигурация DeepSeek → Luna

Статически проверено:

- primary: `deepseek/deepseek-v4-flash-0731`;
- fallback: `openai/gpt-5.6-luna`;
- reasoning по умолчанию явно выключен;
- запрос использует strict JSON Schema;
- provider routing требует поддержку переданных параметров;
- fallback выполняется после API-, parse- и Fact Lock-ошибок;
- Luna проходит тот же deterministic gate;
- model, role, tokens, reasoning tokens, latency, cost и ошибки сохраняются в `ai_runs`;
- длинный AI batch не задерживает пятиминутный source poll.

Live-вызовы моделей не выполнялись: в поставляемом архиве нет пользовательского OpenRouter API key.

## Что не удалось честно выполнить в песочнице

В контейнере не было рабочего DNS-доступа к npm registry. Попытка создать lock-файл через registry завершилась по timeout. Поэтому в этом окружении **не были фактически выполнены**:

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Это ограничение среды, а не утверждение об успешности этих команд. В архив намеренно не добавлен фиктивный `package-lock.json`.

## Обязательная проверка на локальной машине

После распаковки:

```bash
cp .env.example .env
npm install
npm run check
npm run build
```

После первого успешного `npm install` нужно закоммитить созданный `package-lock.json`, затем заменить `npm install` на `npm ci` в CI и Dockerfile для полностью воспроизводимой установки.

Проверка реальных OpenRouter capabilities:

```bash
npm run verify:models
```

Проверка качества моделей на одном наборе реальных новостей:

```bash
npm run ingest
npm run evaluate:ai -- --limit=10
```

## Критерий готовности перед сдачей

Репозиторий можно считать готовым к демонстрации после одновременного выполнения:

```text
npm run check          PASS
npm run build          PASS
npm run smoke          PASS при запущенном web
минимум 10 real-source articles в БД
минимум 4 validated moods для демонстрационной статьи
скриншоты grid / comparison / Fact Lock / ops
```
