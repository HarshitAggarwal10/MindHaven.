// src/app/api/auth/login/route.js

import pool, { ensureAuthDatabase } from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { signToken, makeCookie } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });

    await ensureAuthDatabase();

    const client = await pool.connect();
    try {
      const result = await client.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);

      if (result.rowCount === 0) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return new Response(JSON.stringify({ error: "Invalid password" }), { status: 400 });
      }

      const token = signToken({ id: user.id, email: user.email });
      const cookie = makeCookie(token);

      return new Response(JSON.stringify({ ok: true, token, user: { id: user.id, email: user.email } }), {
        status: 200,
        headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
