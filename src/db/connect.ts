import mongoose from "mongoose";
import { env } from "../config/env.js";

/**
 * Mongoose connection, cached across invocations.
 *
 * On a long-running server this simply runs once at boot. On a serverless host
 * every cold start would otherwise open a fresh connection and never close it,
 * which exhausts the Atlas connection limit under real traffic — so the
 * promise is stashed on `globalThis`, which survives warm invocations of the
 * same container.
 */
type ConnectionCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as typeof globalThis & {
  __omdMongoose?: ConnectionCache;
};

const cache: ConnectionCache = (globalForMongoose.__omdMongoose ??= {
  conn: null,
  promise: null,
});

export async function connectDb(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    mongoose.set("strictQuery", true);

    cache.promise = mongoose.connect(env.MONGODB_URI, {
      // Fail fast instead of hanging for 30s when Atlas is unreachable or the
      // caller's IP is not on the Network Access allowlist.
      serverSelectionTimeoutMS: 10_000,
      // Serverless containers are short-lived and numerous; a small pool per
      // container keeps the cluster-wide connection count sane.
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Clear the failed promise so the next request retries instead of
    // replaying the same rejection forever.
    cache.promise = null;
    throw err;
  }

  const { name, host } = mongoose.connection;
  console.log(`MongoDB connected: ${name} @ ${host}`);

  return cache.conn;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
  cache.conn = null;
  cache.promise = null;
}
