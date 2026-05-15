import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";

const SESSION_COOKIE_NAME = "eagle_eye_session";
const SESSION_USER = process.env.EAGLE_EYE_AUTH_USER || "";
const SESSION_PASSWORD = process.env.EAGLE_EYE_AUTH_PASSWORD || "";
const SESSION_SECRET = process.env.EAGLE_EYE_SESSION_SECRET || "";

const sessionTtlHoursRaw = Number(process.env.EAGLE_EYE_SESSION_TTL_HOURS ?? "12");
const SESSION_TTL_HOURS = Number.isFinite(sessionTtlHoursRaw) && sessionTtlHoursRaw > 0
  ? sessionTtlHoursRaw
  : 12;
const SESSION_TTL_SECONDS = Math.floor(SESSION_TTL_HOURS * 3600);

const secureCookieEnv = process.env.EAGLE_EYE_SECURE_COOKIE;
const SESSION_COOKIE_SECURE = secureCookieEnv === "true"
  || (process.env.NODE_ENV === "production" && secureCookieEnv !== "false");

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;

type SessionPayload = {
  sub: string;
  exp: number;
  iat: number;
  nonce: string;
};

type LoginAttempt = {
  count: number;
  firstAttemptAt: number;
  blockedUntil?: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

function base64UrlEncode(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", SESSION_SECRET).update(encodedPayload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function createToken(username: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: username,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    nonce: randomBytes(16).toString("hex"),
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseToken(token: string): SessionPayload | null {
  const [encodedPayload, providedSig] = token.split(".");
  if (!encodedPayload || !providedSig) return null;

  const expectedSig = sign(encodedPayload);
  if (!safeEqual(providedSig, expectedSig)) return null;

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (!parsed?.sub || typeof parsed.exp !== "number") return null;

    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) return null;

    if (!safeEqual(parsed.sub, SESSION_USER)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function getClientKey(c: Context): string {
  const fwd = c.req.header("x-forwarded-for");
  if (fwd) {
    const first = fwd.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = c.req.header("x-real-ip");
  if (real) return real;
  return "unknown";
}

function getLoginState(clientKey: string): LoginAttempt {
  const now = Date.now();
  const existing = loginAttempts.get(clientKey);

  if (!existing) {
    const initial = { count: 0, firstAttemptAt: now };
    loginAttempts.set(clientKey, initial);
    return initial;
  }

  if (existing.blockedUntil && existing.blockedUntil <= now) {
    const reset = { count: 0, firstAttemptAt: now };
    loginAttempts.set(clientKey, reset);
    return reset;
  }

  if (now - existing.firstAttemptAt > LOGIN_WINDOW_MS) {
    const reset = { count: 0, firstAttemptAt: now };
    loginAttempts.set(clientKey, reset);
    return reset;
  }

  return existing;
}

export function assertAuthConfiguration(): void {
  const missing: string[] = [];
  if (!SESSION_USER) missing.push("EAGLE_EYE_AUTH_USER");
  if (!SESSION_PASSWORD) missing.push("EAGLE_EYE_AUTH_PASSWORD");
  if (!SESSION_SECRET) missing.push("EAGLE_EYE_SESSION_SECRET");

  if (missing.length > 0) {
    throw new Error(`Missing required auth env vars: ${missing.join(", ")}`);
  }

  if (SESSION_PASSWORD === "change-me-now") {
    throw new Error("EAGLE_EYE_AUTH_PASSWORD must be changed from default placeholder");
  }

  if (SESSION_SECRET === "replace-with-long-random-secret" || SESSION_SECRET.length < 32) {
    throw new Error("EAGLE_EYE_SESSION_SECRET must be a strong random value (32+ chars)");
  }
}

export function createSession(c: Context, username: string): void {
  const token = createToken(username);
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: SESSION_COOKIE_SECURE,
    sameSite: "Strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearSession(c: Context): void {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: "/" });
}

export function getSessionUser(c: Context): string | null {
  const token = getCookie(c, SESSION_COOKIE_NAME);
  if (!token) return null;

  const session = parseToken(token);
  if (!session) return null;
  return session.sub;
}

export function validateCredentials(username: string, password: string): boolean {
  if (!username || !password) return false;
  return safeEqual(username, SESSION_USER) && safeEqual(password, SESSION_PASSWORD);
}

export function checkLoginThrottle(c: Context): { blocked: boolean; retryAfterSec?: number } {
  const state = getLoginState(getClientKey(c));
  const now = Date.now();

  if (state.blockedUntil && state.blockedUntil > now) {
    return {
      blocked: true,
      retryAfterSec: Math.max(1, Math.ceil((state.blockedUntil - now) / 1000)),
    };
  }

  return { blocked: false };
}

export function recordFailedLogin(c: Context): void {
  const key = getClientKey(c);
  const state = getLoginState(key);
  state.count += 1;

  if (state.count >= LOGIN_MAX_ATTEMPTS) {
    state.blockedUntil = Date.now() + LOGIN_LOCKOUT_MS;
  }

  loginAttempts.set(key, state);
}

export function recordSuccessfulLogin(c: Context): void {
  loginAttempts.delete(getClientKey(c));
}

export const requireAuth = createMiddleware(async (c, next) => {
  if (c.req.method === "OPTIONS") {
    await next();
    return;
  }

  const user = getSessionUser(c);
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
