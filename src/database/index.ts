import { Pool } from "pg";
import dotenv from "dotenv";
import logger from "../config/winston.config";
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  logger.error("DATABASE_URL is not defined in the environment variables.");
}

const pool = new Pool({
  connectionString,
});

pool.on("connect", () => {
  logger.info("Connected to the database");
});

pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err);
  process.exit(-1);
});

export default pool;

export const checkDBHealth = async (): Promise<{
  ok: boolean;
  error?: string;
}> => {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error(`Database health check failed: ${message}`);
    return { ok: false, error: message };
  }
};
