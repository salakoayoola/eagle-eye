import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";
import { drives } from "./routes/drives.js";

const app = new Hono();

app.use("*", logger());
app.use("*", cors());

app.get("/health", (c) => c.json({ status: "ok" }));
app.route("/api/drives", drives);

const port = Number(process.env.PORT) || 3924;

console.log(`Eagle Eye Companion API running on port ${port}`);

serve({ fetch: app.fetch, port });
