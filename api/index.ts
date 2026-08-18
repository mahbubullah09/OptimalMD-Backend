import type { IncomingMessage, ServerResponse } from "node:http";
import { EnvError } from "../src/config/envError.js";

/**
 * Serverless entry point.
 *
 * Vercel never runs `src/index.ts` — there is no long-lived process to call
 * `app.listen()`. Instead each request invokes this handler, so the Express app
 * is created once per container and the database connection is reused from the
 * cache in `connectDb`.
 *
 * The app is imported *inside* the handler rather than at module scope. Loading
 * it validates the environment, which throws when a variable is missing, and a
 * throw at module scope kills the invocation as FUNCTION_INVOCATION_FAILED —
 * an opaque crash whose only clue lives in the platform logs. Deferring the
 * import lets a misconfigured deployment answer with what is actually wrong.
 */

type NodeHandler = (req: IncomingMessage, res: ServerResponse) => unknown;

/** Resolved once per container and reused; cleared so a failure can retry. */
let booting: Promise<NodeHandler> | null = null;

async function boot(): Promise<NodeHandler> {
  const [{ createApp }, { connectDb }] = await Promise.all([
    import("../src/app.js"),
    import("../src/db/connect.js"),
  ]);

  const app = createApp() as unknown as NodeHandler;
  await connectDb();
  return app;
}

function fail(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    booting ??= boot();
    const app = await booting;
    return app(req, res);
  } catch (err) {
    // A failed boot must not stay cached, or one bad cold start would poison
    // the container for every later request.
    booting = null;

    if (err instanceof EnvError) {
      console.error("Configuration error:", err.message);
      // Names only — they are already public in .env.example, and knowing
      // which variable is unset is the difference between a five-minute fix
      // and an afternoon of guessing.
      return fail(res, 503, {
        error: "Server configuration incomplete",
        missing: err.missing,
        hint: "Set these in Vercel -> Project Settings -> Environment Variables, then redeploy.",
      });
    }

    // Anything else at boot is the database. Without this the request would
    // hang until the platform timed it out, which is much harder to diagnose.
    console.error("Startup failed:", err);
    return fail(res, 503, { error: "Database unavailable" });
  }
}
