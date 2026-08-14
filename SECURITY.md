# Security

Do not commit `.env`, API keys, database files, or news payload exports.

The public rewrite endpoint is rate-limited in memory and the job endpoints require `CRON_SECRET`, and production startup rejects the shipped placeholder secrets. For an internet-facing deployment, put the app behind a reverse proxy, add persistent rate limiting, rotate secrets, and restrict the operations page.

Report security issues privately to the repository owner.
