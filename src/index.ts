import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDb, disconnectDb } from "./db/connect.js";

async function main() {
  await connectDb();

  const server = createApp().listen(env.PORT, () => {
    console.log(`OMD API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  // Finish in-flight requests before closing the DB, so a deploy or Ctrl+C
  // never drops a half-written save.
  const shutdown = (signal: string) => {
    console.log(`\n${signal} received, shutting down.`);
    server.close(() => {
      void disconnectDb().then(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
