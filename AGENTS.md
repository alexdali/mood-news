# Agent guide

Read `README.md` and `docs/ARCHITECTURE.md` before editing. Preserve these invariants:

1. Source text and AI text are stored separately.
2. Concrete facts are protected before generation.
3. Every AI result is validated before it becomes visible.
4. A validation failure must never silently fall back to unverified output.
5. DeepSeek is primary; Luna is the application-level fallback.
6. Tests may use fixtures, but production UI may only show imported real news.

Run `npm run check` after changes.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
