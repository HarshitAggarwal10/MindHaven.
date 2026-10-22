
// src/lib/db.js
import pkg from "pg";
const { Pool } = pkg;

const poolConfig = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL }
  : {
      host: process.env.PGHOST ?? "localhost",
      user: process.env.PGUSER ?? "postgres",
      password: process.env.PGPASSWORD ?? "",
      database: process.env.PGDATABASE ?? "mindhaven",
      port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    };

const pool = new Pool(poolConfig);
let dbInitialized = false;

export async function ensureAuthDatabase() {
  if (dbInitialized) return;

  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    dbInitialized = true;
  } catch (err) {
    throw new Error(
      "Database initialization failed. Ensure Postgres is running and PGHOST, PGUSER, PGPASSWORD, PGDATABASE, PGPORT or DATABASE_URL are set. " +
        err.message
    );
  } finally {
    client.release();
  }
}

export default pool;
