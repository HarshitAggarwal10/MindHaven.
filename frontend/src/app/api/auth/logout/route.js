// src/app/api/auth/logout/route.js
import { clearCookie } from "../../../../lib/auth";

export async function POST() {
  const cookie = clearCookie();
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Set-Cookie": cookie, "Content-Type": "application/json" },
  });
}
