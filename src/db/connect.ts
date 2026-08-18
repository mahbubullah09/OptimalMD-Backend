import mongoose from "mongoose";
import { env } from "../config/env.js";

/** Opens the shared Mongoose connection. Safe to call once at boot. */
export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);

  await mongoose.connect(env.MONGODB_URI, {
    // Fail fast instead of hanging for 30s when Atlas is unreachable or the
    // caller's IP is not on the Network Access allowlist.
    serverSelectionTimeoutMS: 10_000,
  });

  const { name, host } = mongoose.connection;
  console.log(`MongoDB connected: ${name} @ ${host}`);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
