// src/app/api/auth/login/route.js
import pool from "../../../../lib/db";
import bcrypt from "bcrypt";
import { signToken, makeCookie } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password)
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });

    const client = await pool.connect();
    const res = await client.query("SELECT * FROM users WHERE email=$1", [email.toLowerCase()]);
    client.release();

    const user = res.rows[0];
    if (!user || !(await bcrypt.compare(password, user.password)))
      return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });

    const token = signToken({ id: user.id, email: user.email });
    const cookie = makeCookie(token);

    return new Response(JSON.stringify({ ok: true, user }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
