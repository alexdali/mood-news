#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const root = process.cwd();
const ignoredDirectories = new Set(["node_modules", ".next", "coverage", "playwright-report", "test-results"]);

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) return [];
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

const files = walk(root).filter((file) => /\.(?:ts|tsx)$/.test(file));
const failures = [];
for (const file of files) {
  const source = fs.readFileSync(file, "utf8");
  const scriptKind = file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, scriptKind);
  for (const diagnostic of sourceFile.parseDiagnostics) {
    const position = diagnostic.start === undefined
      ? ""
      : sourceFile.getLineAndCharacterOfPosition(diagnostic.start);
    const location = position === "" ? "" : `:${position.line + 1}:${position.character + 1}`;
    failures.push(`${path.relative(root, file)}${location} ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
  }
}

if (failures.length) {
  console.error("TypeScript syntax check failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`TypeScript syntax check passed: ${files.length} files parsed.`);
