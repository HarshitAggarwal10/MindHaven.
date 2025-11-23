import jwt from "jsonwebtoken";
import { serialize } from "cookie";

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}

export function makeCookie(token) {
  return serialize("token", token, {
    httpOnly: true,
    secure: false, // set true in production
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
}
