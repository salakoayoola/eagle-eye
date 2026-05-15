import { Hono } from "hono";
import {
  checkLoginThrottle,
  clearSession,
  createSession,
  getSessionUser,
  recordFailedLogin,
  recordSuccessfulLogin,
  validateCredentials,
} from "../middleware/auth.js";

export const auth = new Hono();

auth.get("/me", (c) => {
  const user = getSessionUser(c);
  if (!user) {
    return c.json({ authenticated: false }, 401);
  }

  return c.json({ authenticated: true, username: user });
});

auth.post("/login", async (c) => {
  const throttle = checkLoginThrottle(c);
  if (throttle.blocked) {
    if (throttle.retryAfterSec) {
      c.header("Retry-After", String(throttle.retryAfterSec));
    }
    return c.json({ error: "Too many failed attempts. Try again later." }, 429);
  }

  let body: { username?: string; password?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const username = body.username?.trim() || "";
  const password = body.password || "";

  if (!validateCredentials(username, password)) {
    recordFailedLogin(c);
    return c.json({ error: "Invalid username or password" }, 401);
  }

  recordSuccessfulLogin(c);
  createSession(c, username);
  return c.json({ authenticated: true, username });
});

auth.post("/logout", (c) => {
  clearSession(c);
  return c.json({ success: true });
});
