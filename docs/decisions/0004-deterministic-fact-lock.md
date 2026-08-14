# ADR 0004: Deterministic Fact Lock перед semantic confidence

- Status: accepted
- Date: 2026-08-14

## Context

LLM self-rating не является надёжным доказательством сохранения фактов.

## Decision

Защищать concrete occurrences placeholders и применять deterministic checks до persistence. UI confidence отражает validation result, не субъективный score модели.

## Consequences

Плюсы:

- reproducible tests;
- explainable rejection;
- низкая стоимость;
- простой visual audit.

Минусы:

- regex/heuristic coverage неполна;
- semantic implications могут пройти;
- требуется последующий NLI/claim layer для production.
