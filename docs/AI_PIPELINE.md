# AI pipeline

## Модели

```dotenv
AI_PRIMARY_MODEL=deepseek/deepseek-v4-flash-0731
AI_FALLBACK_MODEL=openai/gpt-5.6-luna
AI_REWRITE_LOCALES=en,ru
```

Обе модели вызываются через OpenRouter. IDs вынесены в environment. Проверка для конкретного key:

```bash
npm run verify:models
```

## Один locale-batch — четыре moods

Worker обрабатывает настроенные языки независимо. Для `en` и `ru` выполняются отдельные вызовы, потому что каждый batch имеет собственный target-language prompt, Fact Lock verdict и строки хранения.

Ответ:

```json
{
  "variants": [
    { "mood": "neutral", "title": "...", "summary": "..." },
    { "mood": "hopeful", "title": "...", "summary": "..." },
    { "mood": "concerned", "title": "...", "summary": "..." },
    { "mood": "ironic", "title": "...", "summary": "..." }
  ]
}
```

Это дешевле и согласованнее четырёх отдельных запросов.

## Structured output

OpenRouter request содержит strict JSON Schema. После ответа Zod повторно проверяет:

- object shape;
- ровно 4 variants;
- все mood IDs;
- title/summary length.

После восстановления exact facts валидатор также проверяет, что свободная проза соответствует запрошенному языку. Placeholder-токены исключаются из языковой эвристики; для русской версии дополнительно распознаются новые именованные сущности на кириллице.

## Reasoning

```dotenv
AI_REASONING_ENABLED=false
AI_REASONING_EFFORT=low
```

По умолчанию reasoning явно отключён. `AI_REASONING_EFFORT` используется только при `AI_REASONING_ENABLED=true`; значение `low` совместимо с выбранными моделями и ограничивает лишние reasoning-токены. Критическое решение о публикации в любом случае принимает детерминированный код.

## Fallback conditions

Luna вызывается после:

- timeout/network error;
- 429/5xx после короткого retry;
- provider error;
- empty content;
- malformed JSON;
- schema mismatch;
- отсутствующего mood;
- Fact Lock rejection любого variant.

## Retry levels

1. HTTP client: один короткий retry transient error.
2. Model router: DeepSeek → Luna.
3. Worker: статья остаётся pending и попадает в следующий cycle.

## Cost accounting

`ai_runs` хранит:

- input/output/reasoning tokens;
- provider-reported cost;
- latency;
- status/error;
- request ID;
- primary/fallback role.

Перед новым batch применяется `MAX_DAILY_AI_COST_USD`.

## Fail-closed behavior

Ни primary, ни fallback не могут записать output напрямую. Сохранение выполняет `RewriteService` только после полного accepted batch. Cache и БД разделены по `(article, mood, locale, promptVersion)`.
