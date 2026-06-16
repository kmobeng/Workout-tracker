import fs from "fs";
import path from "path";
import pool from "./index";
import logger from "../config/winston.config";

async function migrate() {
  const migrationsDir = path.join(__dirname, "migrations");
  const files = fs.readdirSync(migrationsDir).sort(); 

  for (const file of files) {
    if (!file.endsWith(".sql")) continue;

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, "utf-8");

    logger.info(`[migrate] Running ${file}...`);
    await pool.query(sql);
    logger.info(`[migrate] ${file} done.`);
  }

  await pool.end();
  logger.info("[migrate] All migrations complete.");
}

migrate().catch((err) => {
  logger.error("[migrate] Migration failed:", err);
  process.exit(1);
});