// src/app/api/auth/me/route.js
import pool, { ensureAuthDatabase } from "../../../../lib/db";
import { parseCookieHeader, verifyToken, COOKIE_NAME } from "../../../../lib/auth";

export async function GET(req) {
  try {
    await ensureAuthDatabase();

    const cookieHeader = req.headers.get("cookie");
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];

    if (!token) return new Response(JSON.stringify({ user: null }), { status: 200 });

    const payload = verifyToken(token);
    if (!payload) return new Response(JSON.stringify({ user: null }), { status: 200 });

    const client = await pool.connect();
    try {
      const res = await client.query("SELECT id, email, name FROM users WHERE id = $1", [payload.id]);
      return new Response(JSON.stringify({ user: res.rows[0] || null }), { status: 200 });
    } finally {
      client.release();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

