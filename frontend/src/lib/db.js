
// src/lib/db.js
// import { Pool } from "pg";

// let pool;

// if (!global.__pgPool) {
//   pool = new Pool({
//     connectionString: process.env.DATABASE_URL,
//   });
//   global.__pgPool = pool;
// } else {
//   pool = global.__pgPool;
// }

import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  host: process.env.PGHOST,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  port: process.env.PGPORT,
});

export default pool;
