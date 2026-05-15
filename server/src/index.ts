import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { drives } from "./routes/drives.js";
import { fs } from "./routes/fs.js";
import { auth } from "./routes/auth.js";
import { assertAuthConfiguration, requireAuth } from "./middleware/auth.js";

const app = new Hono();
assertAuthConfiguration();

app.use("*", logger());

const allowedOrigins = (process.env.EAGLE_EYE_ALLOWED_ORIGINS || [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
].join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use("*", cors({
  origin: (origin) => {
    if (!origin) return undefined;
    return allowedOrigins.includes(origin) ? origin : undefined;
  },
  credentials: true,
}));

app.use("*", async (c, next) => {
  await next();
  c.header("X-Content-Type-Options", "nosniff");
  c.header("X-Frame-Options", "DENY");
  c.header("Referrer-Policy", "no-referrer");
  c.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
});

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/auth", auth);
app.use("/api/fs", requireAuth);
app.use("/api/fs/*", requireAuth);
app.use("/api/drives", requireAuth);
app.use("/api/drives/*", requireAuth);
app.route("/api/drives", drives);
app.route("/api/fs", fs);

const port = Number(process.env.PORT) || 3924;

console.log(`Eagle Eye Companion API running on port ${port}`);

serve({ fetch: app.fetch, port });
