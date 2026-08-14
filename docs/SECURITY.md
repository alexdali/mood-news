# Security notes

## Реализовано

- API keys только server-side.
- `.env` исключён из Git.
- Pino redact для authorization/secrets.
- Job endpoints защищены secret; production startup отклоняет development/example `CRON_SECRET`.
- Source URLs задаются registry, не пользователем.
- External URL допускает только `http/https`.
- Source HTML удаляется.
- React рендерит AI/source text как text.
- External links используют `noopener noreferrer`.
- Manual rewrite имеет rate limit.
- Daily AI budget cap.
- DB reset требует `--yes`.
- Import/rewrite cycles имеют expiring locks.

## Threat: prompt injection в source

Source fragment может содержать инструкцию. Mitigation:

- system prompt объявляет source data;
- output shape ограничен;
- placeholders;
- deterministic validation;
- fail closed.

Это снижает риск, но не является полной sandbox guarantee.

## Threat: runaway cost

- changed-only processing;
- one request/four moods;
- bounded output;
- short retry;
- one fallback;
- batch limit;
- daily budget;
- actual cost audit.

## Перед production

- managed secret store;
- distributed rate limit;
- CSP;
- auth для rewrite actions;
- dependency/container scanning;
- source licensing review;
- sensitivity classifier;
- backup/restore drill;
- PostgreSQL network isolation после миграции.
