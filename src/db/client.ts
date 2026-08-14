import BetterSqlite3 from "better-sqlite3";
import type { SqliteDatabase } from "@/db/types";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/config/env";
import { migrateDatabase } from "@/db/migrate";

const globalForDb = globalThis as unknown as {
  moodNewsDb?: SqliteDatabase;
  moodNewsDbPath?: string;
};

export function createDatabase(databasePath: string): SqliteDatabase {
  if (databasePath !== ":memory:") {
    fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  }
  const db = new BetterSqlite3(databasePath);
  db.pragma("foreign_keys = ON");
  db.pragma("journal_mode = WAL");
  db.pragma("synchronous = NORMAL");
  db.pragma("busy_timeout = 5000");
  migrateDatabase(db);
  return db;
}

export function getDatabase(): SqliteDatabase {
  const databasePath = getEnv().DATABASE_PATH;
  if (!globalForDb.moodNewsDb || globalForDb.moodNewsDbPath !== databasePath) {
    globalForDb.moodNewsDb?.close();
    globalForDb.moodNewsDb = createDatabase(databasePath);
    globalForDb.moodNewsDbPath = databasePath;
  }
  return globalForDb.moodNewsDb;
}

export function closeDatabase(): void {
  globalForDb.moodNewsDb?.close();
  globalForDb.moodNewsDb = undefined;
  globalForDb.moodNewsDbPath = undefined;
}
