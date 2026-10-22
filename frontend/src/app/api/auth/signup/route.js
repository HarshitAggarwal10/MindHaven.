// src/app/api/auth/signup/route.js
import pool, { ensureAuthDatabase } from "../../../../lib/db";
import bcrypt from "bcryptjs";  // ✅ bcryptjs works in Next.js API routes
import { signToken, makeCookie } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "Email and password required" }),
        { status: 400 }
      );
    }

    await ensureAuthDatabase();

    const hashed = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    try {
      const insert = await client.query(
        `INSERT INTO users (email, password, name)
         VALUES ($1, $2, $3)
         RETURNING id, email, name, created_at`,
        [email.toLowerCase(), hashed, name || null]
      );

      const user = insert.rows[0];
      const token = signToken({ id: user.id, email: user.email });
      const cookie = makeCookie(token);

      return new Response(
        JSON.stringify({ ok: true, user }),
        {
          status: 201,
          headers: {
            "Set-Cookie": cookie,
            "Content-Type": "application/json",
          },
        }
      );
    } finally {
      client.release();
    }
  } catch (err) {
    // Unique constraint on users.email
    if (err.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Email already in use" }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
}
