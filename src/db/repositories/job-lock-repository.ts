import type { SqliteDatabase } from "@/db/types";
import { getDatabase } from "@/db/client";
import { addMilliseconds, nowIso } from "@/core/time";

export class JobLockRepository {
  constructor(private readonly db: SqliteDatabase = getDatabase()) {}

  acquire(name: string, ownerId: string, ttlMs: number): boolean {
    const now = nowIso();
    const expiresAt = addMilliseconds(now, ttlMs);
    const result = this.db.prepare(`
      INSERT INTO job_locks(name, owner_id, expires_at, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(name) DO UPDATE SET
        owner_id = excluded.owner_id,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
      WHERE job_locks.expires_at < excluded.updated_at
         OR job_locks.owner_id = excluded.owner_id
    `).run(name, ownerId, expiresAt, now);
    return result.changes === 1;
  }

  release(name: string, ownerId: string): void {
    this.db.prepare("DELETE FROM job_locks WHERE name = ? AND owner_id = ?").run(name, ownerId);
  }
}
