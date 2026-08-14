# Ограничения

## Source fragment, не полная статья

BBC RSS и Guardian `trailText` обычно дают headline/summary. UI и README не называют их полным текстом статьи.

## Fact Lock не проверяет истинность источника

Он сохраняет факты, присутствующие в imported fragment. Ложный source останется ложным.

## Формальная защита не равна semantic equivalence

Могут остаться незамеченными:

- `rose` ↔ `fell`;
- отрицание;
- причинность;
- степень уверенности;
- pronoun attribution;
- неявное добавленное суждение.

## Entity extraction эвристическая

Ориентирована на English news fragments. Возможны false positives/false negatives.

## Ирония

Prompt ограничивает иронию, но production должен автоматически выключать её для смерти, насилия, катастроф и чувствительных тем.

## Pending retry

MVP повторно находит статью в следующем rewrite cycle (`REWRITE_INTERVAL_MS`). Нет отдельной durable queue с bounded attempts/backoff по статье.

## SQLite

Подходит для одного host/worker. Несколько независимых hosts требуют PostgreSQL.

## AI nondeterminism

Accepted result кэшируется, но повторная генерация другой model/prompt version может отличаться.

## Model IDs, prices, feeds

Могут измениться. Поэтому models и source URLs вынесены в конфигурацию, а доступность моделей проверяется командой.

## Graceful degradation

Без OpenRouter key real originals импортируются и отображаются, но emotional rewrites не создаются.
