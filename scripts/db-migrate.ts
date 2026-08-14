import "./_bootstrap-env";
import { getDatabase } from "@/db/client";
import { heading } from "./_console";

heading("Database migration");
const db = getDatabase();
const migrations = db.prepare("SELECT filename, applied_at FROM schema_migrations ORDER BY filename").all();
console.table(migrations);
console.log("Database is ready.");
