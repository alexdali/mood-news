import type { SqliteDatabase } from "@/db/types";
import fs from "node:fs";
import path from "node:path";
import { nowIso } from "@/core/time";

export function migrateDatabase(db: SqliteDatabase, migrationsDir = path.join(process.cwd(), "migrations")): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory not found: ${migrationsDir}`);
  }

  const applied = new Set(
    db.prepare("SELECT filename FROM schema_migrations ORDER BY filename").all()
      .map((row) => (row as { filename: string }).filename),
  );

  const files = fs.readdirSync(migrationsDir)
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  const apply = db.transaction((filename: string, sql: string) => {
    db.exec(sql);
    db.prepare("INSERT INTO schema_migrations(filename, applied_at) VALUES (?, ?)")
      .run(filename, nowIso());
  });

  for (const filename of files) {
    if (applied.has(filename)) continue;
    apply(filename, fs.readFileSync(path.join(migrationsDir, filename), "utf8"));
  }
}
