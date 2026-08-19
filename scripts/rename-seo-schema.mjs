/**
 * Renames `seo.schema` to `seo.structuredData` on every page.
 *
 * `schema` is a reserved Mongoose document property. Having a path by that
 * name meant that applying defaults to the seo subdocument overwrote the
 * subdocument's own `.schema` reference, after which the next array default
 * read `undefined.indexedPaths()` and threw. That made creating a page
 * impossible — the failure only ever showed up on insert, so it lay dormant
 * while pages could only be seeded with a fully-populated object.
 *
 * Safe to run more than once: documents already renamed are not matched.
 *
 *   node scripts/rename-seo-schema.mjs
 */

import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set.");
  process.exit(1);
}

await mongoose.connect(uri);
const pages = mongoose.connection.collection("pages");

const pending = await pages.countDocuments({ "seo.schema": { $exists: true } });
console.log(`${pending} page(s) to rename.`);

if (pending > 0) {
  const result = await pages.updateMany(
    { "seo.schema": { $exists: true } },
    { $rename: { "seo.schema": "seo.structuredData" } },
  );
  console.log(`renamed on ${result.modifiedCount} page(s).`);
}

const left = await pages.countDocuments({ "seo.schema": { $exists: true } });
const done = await pages.countDocuments({ "seo.structuredData": { $exists: true } });
console.log(`now: ${done} with structuredData, ${left} still with schema.`);

await mongoose.disconnect();
