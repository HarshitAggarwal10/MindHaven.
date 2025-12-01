// src/lib/auth.js
import jwt from "jsonwebtoken";
import { serialize, parse as parseCookie } from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-jwt-secret";
const COOKIE_NAME = process.env.COOKIE_NAME || "mh_session";
const COOKIE_MAXAGE = 7 * 24 * 60 * 60; // 7 days

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function makeCookie(token) {
  // httpOnly cookie — secure should be true in production (HTTPS)
  return serialize(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAXAGE,
    path: "/",
  });
}

// parseCookieHeader: returns object map of cookieName -> cookieValue
export function parseCookieHeader(header) {
  if (!header) return {};
  try {
    return parseCookie(header);
  } catch (err) {
    // fallback simple parse
    const cookies = {};
    header.split(";").forEach((c) => {
      const [k, ...v] = c.trim().split("=");
      cookies[k] = v.join("=");
    });
    return cookies;
  }
}

export { COOKIE_NAME };
