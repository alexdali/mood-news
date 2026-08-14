# ADR 0002: SQLite в WAL-режиме

- Status: accepted
- Date: 2026-08-14

## Context

Нужно реальное структурированное хранение, audit tables и максимально простой reviewer setup.

## Decision

Использовать `better-sqlite3`, foreign keys, WAL, short transactions и application job locks.

## Consequences

Плюсы:

- нет внешней БД;
- миграции и SQL видимы;
- легко сделать backup/demo;
- web reads и worker writes приемлемы для малой нагрузки.

Минусы:

- не подходит для distributed replicas;
- native dependency;
- serverless filesystem caveat;
- migration path на PostgreSQL при росте.
