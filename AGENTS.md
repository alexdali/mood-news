# Agent guide

Read `README.md` and `docs/ARCHITECTURE.md` before editing. Preserve these invariants:

1. Source text and AI text are stored separately.
2. Concrete facts are protected before generation.
3. Every AI result is validated before it becomes visible.
4. A validation failure must never silently fall back to unverified output.
5. DeepSeek is primary; Luna is the application-level fallback.
6. Tests may use fixtures, but production UI may only show imported real news.

Run `npm run check` after changes.
