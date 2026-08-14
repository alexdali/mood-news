import fs from "node:fs";

if (fs.existsSync(".env") && typeof process.loadEnvFile === "function") {
  process.loadEnvFile(".env");
}
