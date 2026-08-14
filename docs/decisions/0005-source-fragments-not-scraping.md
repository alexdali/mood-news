# ADR 0005: Source-provided fragments вместо full-page scraping

- Status: accepted
- Date: 2026-08-14

## Context

Полнотекстовый scraping увеличивает legal, parsing и anti-bot risks, не являясь центральной частью задания.

## Decision

Использовать title и summary/trail text, предоставленные RSS/API, с canonical source link.

## Consequences

Плюсы:

- надёжнее за три дня;
- меньше token cost;
- ясное provenance;
- меньше copied content.

Минусы:

- меньше контекста;
- некоторые summaries очень короткие;
- UI обязан честно называть данные source fragment.
