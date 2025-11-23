import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { signToken, makeCookie } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const client = await pool.connect();

    const result = await client.query(
      "INSERT INTO users (email, password, name) VALUES ($1,$2,$3) RETURNING id,email,name",
      [email.toLowerCase(), hashedPassword, name]
    );

    client.release();

    const user = result.rows[0];
    const token = signToken({ id: user.id, email: user.email });
    const cookie = makeCookie(token);

    return new Response(JSON.stringify({ user }), {
      status: 201,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });

  } catch (err) {
    if (err.code === "23505") {
      return new Response(JSON.stringify({ error: "Email already in use" }), { status: 409 });
    }

    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
