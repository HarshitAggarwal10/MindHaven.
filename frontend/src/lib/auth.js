// src/lib/auth.js
import jwt from "jsonwebtoken";
import * as cookie from "cookie";

const COOKIE_NAME = process.env.COOKIE_NAME || "mh_session";
const JWT_SECRET = process.env.JWT_SECRET;

export function signToken(payload, options = {}) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: options.expiresIn || "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function parseCookieHeader(cookieHeader) {
  return cookie.parse(cookieHeader || "");
}

export function makeCookie(token) {
  const maxAge = Number(process.env.COOKIE_MAX_AGE) || 60 * 60 * 24 * 7; // 7 days
  return cookie.serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearCookie() {
  return cookie.serialize(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
