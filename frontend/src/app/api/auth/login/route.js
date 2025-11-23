import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";
import { signToken, makeCookie } from "../../../../lib/auth";

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    const client = await pool.connect();

    const result = await client.query(
      "SELECT * FROM users WHERE email=$1",
      [email.toLowerCase()]
    );

    client.release();

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

    return new Response(JSON.stringify({ user }), {
      status: 200,
      headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
