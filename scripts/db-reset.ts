import "./_bootstrap-env";
import fs from "node:fs";
import path from "node:path";
import { getEnv } from "@/config/env";
import { closeDatabase, getDatabase } from "@/db/client";
import { heading } from "./_console";

if (!process.argv.includes("--yes")) {
  console.error("Refusing to delete the database without --yes. Run: npm run db:reset -- --yes");
  process.exit(2);
}

const databasePath = path.resolve(getEnv().DATABASE_PATH);
heading(`Reset database: ${databasePath}`);
closeDatabase();
for (const suffix of ["", "-wal", "-shm"]) {
  const file = `${databasePath}${suffix}`;
  if (fs.existsSync(file)) fs.unlinkSync(file);
}
getDatabase();
console.log("Database recreated and migrations applied.");
