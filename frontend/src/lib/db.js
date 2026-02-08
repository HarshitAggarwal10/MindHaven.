// src/lib/db.js
import { Pool } from "pg";

let pool;

if (!global.__pgPool) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  global.__pgPool = pool;
} else {
  pool = global.__pgPool;
}

export default pool;
