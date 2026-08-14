#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirectories = new Set(["node_modules", ".next", "coverage", "playwright-report", "test-results"]);
const sourceExtensions = [".ts", ".tsx", ".mjs", ".js", ".json", ".css"];

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function candidatePaths(base) {
  return [
    base,
    ...sourceExtensions.map((extension) => `${base}${extension}`),
    ...sourceExtensions.map((extension) => path.join(base, `index${extension}`)),
  ];
}

function resolveLocalSpecifier(specifier, importer) {
  if (specifier.startsWith("@/")) return path.join(root, "src", specifier.slice(2));
  if (specifier.startsWith(".")) return path.resolve(path.dirname(importer), specifier);
  return null;
}

const files = walk(root).filter((file) => /\.(?:ts|tsx|mjs|js)$/.test(file));
const importPattern = /(?:from\s*|import\s*\(|import\s*)["']([^"']+)["']/g;
const failures = [];
let checked = 0;

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  for (const match of source.matchAll(importPattern)) {
    const specifier = match[1];
    const base = resolveLocalSpecifier(specifier, file);
    if (!base) continue;
    checked += 1;
    if (!candidatePaths(base).some((candidate) => fs.existsSync(candidate))) {
      failures.push(`${path.relative(root, file)} -> ${specifier}`);
    }
  }
}

if (failures.length) {
  console.error("Unresolved local imports:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Local import check passed: ${checked} imports resolved.`);
