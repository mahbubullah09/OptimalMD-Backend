import type { IncomingMessage, ServerResponse } from "node:http";
import { createApp } from "../src/app.js";
import { connectDb } from "../src/db/connect.js";

/**
 * Serverless entry point.
 *
 * Vercel never runs `src/index.ts` — there is no long-lived process to call
 * `app.listen()`. Instead each request invokes this handler, so the Express
 * app is created once per container and the database connection is reused
 * from the cache in `connectDb`.
 */
const app = createApp();

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    await connectDb();
  } catch (err) {
    // Without this the request would hang until the platform times it out,
    // which is much harder to diagnose than an explicit 503.
    console.error("Database connection failed:", err);
    res.statusCode = 503;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ error: "Database unavailable" }));
    return;
  }

  return app(req, res);
}
