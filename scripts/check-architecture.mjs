#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];
const notes = [];
const ignoredDirectories = new Set([".git", ".next", "coverage", "node_modules", "playwright-report", "test-results"]);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function fail(message) {
  failures.push(message);
}

function assertFile(file) {
  if (!fs.existsSync(path.join(root, file))) fail(`Missing required file: ${file}`);
}

const requiredFiles = [
  "README.md",
  ".env.example",
  "migrations/0001_initial.sql",
  "migrations/0002_indexes.sql",
  "migrations/0003_article_snapshots.sql",
  "migrations/0004_rewrite_locales.sql",
  "migrations/0005_ai_run_locale.sql",
  "src/i18n/ui.ts",
  "src/modules/ingestion/ingest-service.ts",
  "src/modules/fact-lock/validator.ts",
  "src/modules/ai/model-router.ts",
  "src/modules/ai/openrouter-client.ts",
  "src/modules/ai/openrouter-request.ts",
  "src/modules/ai/rewrite-service.ts",
  "src/modules/jobs/lock-policy.ts",
  "src/modules/jobs/periodic-runner.ts",
  "src/modules/jobs/rewrite-job.ts",
  "src/core/stop-signal.ts",
  "src/db/repositories/ai-run-repository.ts",
  "scripts/worker.ts",
  "docs/ACCEPTANCE_MATRIX.md",
  "docs/FINAL_IMPLEMENTATION_PLAN.md",
  "docs/FILE_MAP.md",
  "docs/VALIDATION_REPORT.md",
  "src/test/unit/lock-policy.test.ts",
  "src/test/unit/periodic-runner.test.ts",
  "src/test/unit/stop-signal.test.ts",
  "src/test/unit/openrouter-request.test.ts",
];
requiredFiles.forEach(assertFile);

const files = walk(root).filter((file) => !file.includes(`${path.sep}node_modules${path.sep}`));
const sourceFiles = files.filter((file) => /\.(?:ts|tsx|mjs)$/.test(file));
const textFiles = files.filter((file) => /\.(?:ts|tsx|mjs|md|sql|yml|yaml|json)$/.test(file));

for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (file.endsWith(".tsx") && text.includes("dangerouslySetInnerHTML")) {
    fail(`Unsafe React HTML sink found: ${rel(file)}`);
  }
  if (text.startsWith('"use client"') || text.startsWith("'use client'")) {
    for (const forbidden of ["@/db/", "@/modules/ai/openrouter-client", "@/config/env"]) {
      if (text.includes(forbidden)) fail(`Client module imports server-only code (${forbidden}): ${rel(file)}`);
    }
  }
}

const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");
for (const expected of [
  "AI_PRIMARY_MODEL=deepseek/deepseek-v4-flash-0731",
  "AI_FALLBACK_MODEL=openai/gpt-5.6-luna",
  "AI_REASONING_ENABLED=false",
  "AI_REASONING_EFFORT=low",
  "INGEST_INTERVAL_MS=300000",
  "REWRITE_INTERVAL_MS=60000",
]) {
  if (!envExample.includes(expected)) fail(`Missing expected environment default: ${expected}`);
}

const migration3 = fs.readFileSync(path.join(root, "migrations/0003_article_snapshots.sql"), "utf8");
if (!migration3.includes("ADD COLUMN version")) fail("Snapshot migration does not add article version");
if (!migration3.includes("CREATE TABLE IF NOT EXISTS article_snapshots")) fail("Snapshot migration does not create article_snapshots");

const markdownFiles = files.filter((file) => file.endsWith(".md"));
const markdownLinkPattern = /\[[^\]]*\]\(([^)]+)\)/g;
for (const file of markdownFiles) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(markdownLinkPattern)) {
    const target = match[1].split("#", 1)[0];
    if (!target || /^(?:https?:|mailto:)/.test(target) || target.startsWith("#")) continue;
    const resolved = path.resolve(path.dirname(file), target);
    if (!fs.existsSync(resolved)) fail(`Broken local Markdown link in ${rel(file)}: ${match[1]}`);
  }
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!packageJson.scripts?.worker) fail("package.json has no worker script");
if (!packageJson.scripts?.["verify:models"]) fail("package.json has no verify:models script");
if (!packageJson.scripts?.benchmark) fail("package.json has no benchmark script");

const forbiddenPatterns = [
  { regex: /OPENROUTER_API_KEY\s*=\s*['\"][^'\"]+['\"]/, label: "hard-coded OpenRouter key" },
  { regex: /GUARDIAN_API_KEY\s*=\s*['\"][^'\"]+['\"]/, label: "hard-coded Guardian key" },
];
for (const file of textFiles) {
  if (rel(file) === ".env.example") continue;
  const text = fs.readFileSync(file, "utf8");
  for (const pattern of forbiddenPatterns) {
    if (pattern.regex.test(text)) fail(`${pattern.label} found in ${rel(file)}`);
  }
}

notes.push(`${sourceFiles.length} TypeScript/JavaScript source files scanned`);
notes.push(`${markdownFiles.length} Markdown files checked for local links`);
notes.push(`${files.filter((file) => file.endsWith(".sql")).length} SQL migration files found`);

if (failures.length > 0) {
  console.error("Architecture check failed:\n");
  failures.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}

console.log("Architecture check passed.");
notes.forEach((note) => console.log(`- ${note}`));
