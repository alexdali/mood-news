# ADR 0003: Application-level DeepSeek → Luna fallback

- Status: accepted
- Date: 2026-08-14

## Context

Gateway fallback обычно покрывает provider availability, но не знает о domain validation.

## Decision

Приложение вызывает DeepSeek, затем самостоятельно парсит и валидирует output. Luna вызывается после transport, parsing или Fact Lock failure.

## Consequences

Плюсы:

- fallback реагирует на реальные product failures;
- причины переключения аудируются;
- обе модели benchmarkable;
- невалидный primary output не маскируется.

Минусы:

- больше application code;
- worst-case latency двух calls;
- retry/fallback policy нужно поддерживать.
