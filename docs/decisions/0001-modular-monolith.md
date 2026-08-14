# ADR 0001: Модульный монолит

- Status: accepted
- Date: 2026-08-14

## Context

Тестовый проект должен быть завершён за три дня, легко запускаться и при этом показывать архитектурное мышление.

## Decision

Один Next.js repository, один web process и один worker process. Бизнес-логика разделена на domain/modules/repositories, но не вынесена в отдельные network services.

## Consequences

Плюсы:

- простой local/Docker launch;
- единые types;
- меньше инфраструктуры;
- ясные модульные границы.

Минусы:

- independent scaling ограничен;
- shared deployment artifact;
- при росте worker потребует queue/service extraction.
