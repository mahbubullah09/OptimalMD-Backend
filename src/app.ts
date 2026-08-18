import cors from "cors";
import express, { type RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import * as helmetModule from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { router } from "./routes/index.js";

/**
 * helmet exposes its middleware only as a default export, and hosts disagree
 * about how that default should be handed back: Vercel's build type-checks
 * with its own compiler options and resolved it to the module namespace,
 * which is not callable, while the identical local build resolved it fine.
 *
 * Reading the default off the namespace works under every interop setting,
 * because nothing here relies on the default import itself being callable.
 */
const helmet = ((helmetModule as { default?: unknown }).default ??
  helmetModule) as () => RequestHandler;

export function createApp() {
  const app = express();

  // Behind a proxy in production, so rate limiting and req.ip see the real
  // client address rather than the load balancer's.
  if (env.isProduction) app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and server-to-server calls arrive with no Origin header.
        if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);

        // Refuse by withholding the headers, not by throwing: an unlisted
        // origin is a policy decision, and throwing turns it into a 500 that
        // looks like a server fault.
        console.warn(`Blocked cross-origin request from ${origin}`);
        callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.isProduction ? "combined" : "dev"));

  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      limit: 300,
      standardHeaders: "draft-7",
      legacyHeaders: false,
    }),
  );

  // The root is not part of the API surface, but it is the first URL anyone
  // opens. Answering here beats a 404 that reads like an outage.
  app.get("/", (_req, res) => {
    res.json({ name: "OptimalMD API", health: "/api/health" });
  });

  app.use("/api", router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
