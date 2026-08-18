/**
 * Prints the production environment for this API, ready to paste into
 * Vercel -> Project Settings -> Environment Variables -> Import .env.
 *
 * Values come from the local `.env`, which is gitignored; the handful that
 * differ in production (origins, revalidate URL) are overridden here so the
 * two environments cannot silently drift apart.
 *
 * Writes to stdout only. Redirect it if you want a file, and delete that file
 * afterwards — it contains credentials.
 *
 *   node scripts/vercel-env.mjs
 *   node scripts/vercel-env.mjs --site https://optimalmd-demo.vercel.app
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const arg = (name, fallback) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? (process.argv[index + 1] ?? fallback) : fallback;
};

const site = arg("site", "https://optimalmd-demo.vercel.app").replace(/\/$/, "");

/** Reads .env without expanding or validating — this is a transcription job. */
function readEnv() {
  let text;
  try {
    text = readFileSync(join(root, ".env"), "utf8");
  } catch {
    console.error("No .env found. Copy .env.example to .env and fill it in first.");
    process.exit(1);
  }

  const values = {};
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    values[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
  return values;
}

const local = readEnv();

/**
 * NODE_ENV is deliberately absent: Vercel sets it to "production" itself, and
 * declaring it by hand is rejected as a reserved name. PORT is absent because
 * nothing listens on a port here — the function is invoked per request.
 */
const production = {
  MONGODB_URI: local.MONGODB_URI,
  JWT_SECRET: local.JWT_SECRET,
  JWT_EXPIRES_IN: local.JWT_EXPIRES_IN || "7d",
  CORS_ORIGINS: site,
  REVALIDATE_URL: `${site}/api/revalidate`,
  REVALIDATE_SECRET: local.REVALIDATE_SECRET,
};

const missing = Object.entries(production)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}

for (const [key, value] of Object.entries(production)) {
  console.log(`${key}=${value}`);
}

console.error(
  [
    "",
    "Paste the above into Vercel -> optimal-md-backend -> Settings ->",
    "Environment Variables -> Import .env, scoped to Production, then redeploy.",
    "",
    `CORS_ORIGINS and REVALIDATE_URL were set from ${site}.`,
    "Pass --site to point them elsewhere.",
  ].join("\n"),
);
