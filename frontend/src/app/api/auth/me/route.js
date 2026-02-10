// src/app/api/auth/me/route.js
import pool from "../../../../lib/db";
<<<<<<< HEAD
import { parseCookieHeader, verifyToken } from "../../../../lib/auth";

export async function GET(req) {
  const cookieHeader = req.headers.get("cookie");
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies[process.env.COOKIE_NAME || "mh_session"];
  if (!token) return new Response(JSON.stringify({ user: null }), { status: 200 });

  const payload = verifyToken(token);
  if (!payload) return new Response(JSON.stringify({ user: null }), { status: 200 });

  const client = await pool.connect();
  const res = await client.query("SELECT id,email,name FROM users WHERE id=$1", [payload.id]);
  client.release();

  return new Response(JSON.stringify({ user: res.rows[0] || null }), { status: 200 });
=======
import { parseCookieHeader, verifyToken, COOKIE_NAME } from "../../../../lib/auth";

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get("cookie");
    const cookies = parseCookieHeader(cookieHeader);
    const token = cookies[COOKIE_NAME];

    if (!token) return new Response(JSON.stringify({ user: null }), { status: 200 });

    const payload = verifyToken(token);
    if (!payload) return new Response(JSON.stringify({ user: null }), { status: 200 });

    const client = await pool.connect();
    const res = await client.query("SELECT id, email, name FROM users WHERE id = $1", [payload.id]);
    client.release();

    return new Response(JSON.stringify({ user: res.rows[0] || null }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
>>>>>>> 30c3065ea6832ff6649924cec74bd1d78f58eff5
}
