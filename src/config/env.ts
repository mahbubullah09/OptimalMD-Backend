import "dotenv/config";
import { z } from "zod";
import { EnvError } from "./envError.js";

/**
 * Treats an empty string as "not set", so a variable's default still applies.
 *
 * Hosts inject blanks for variables they consider standard — Vercel supplies
 * PORT="" to every function — and an empty string is not `undefined`, so zod
 * skips the default and validates the blank instead. For PORT that meant
 * coercion to 0, a failed `.positive()`, and a deployment refusing to boot
 * over a variable nothing here even uses.
 */
const blankAsUnset = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => (value === "" ? undefined : value), schema);

/**
 * Environment is validated once at boot. A missing or malformed value fails
 * loudly here rather than surfacing as a confusing runtime error later.
 */
const schema = z.object({
  NODE_ENV: blankAsUnset(z.enum(["development", "test", "production"]).default("development")),
  PORT: blankAsUnset(z.coerce.number().int().positive().default(4000)),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  JWT_EXPIRES_IN: blankAsUnset(z.string().default("7d")),

  CORS_ORIGINS: blankAsUnset(z.string().default("http://localhost:3000")),

  REVALIDATE_URL: z.string().url().optional().or(z.literal("")),
  REVALIDATE_SECRET: z.string().optional().or(z.literal("")),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  const message = `Invalid environment configuration:\n${issues}\n\nSee .env.example.`;

  // Throw rather than process.exit: on a serverless host, exiting kills the
  // invocation with an opaque FUNCTION_INVOCATION_FAILED and nothing useful in
  // the logs, whereas a thrown error surfaces this message.
  // Typed so the serverless entry point can turn this into a readable
  // response: a deploy whose variables were never set should say so, rather
  // than crashing before any handler exists.
  console.error(message);
  throw new EnvError(
    [...new Set(parsed.error.issues.map((i) => String(i.path[0] ?? "(root)")))],
    message,
  );
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  corsOrigins: raw.CORS_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean),
};

export type Env = typeof env;
