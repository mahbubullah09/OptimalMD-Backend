import "dotenv/config";
import { connectDb, disconnectDb } from "../db/connect.js";
import { AdminUser, hashPassword } from "../models/AdminUser.js";

/**
 * Creates (or updates the password of) the first admin account.
 *
 * Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD in .env so they are
 * never written into the repository.
 *
 *   npm run seed:admin
 */
async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!email || !password) {
    console.error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD in OMD-Backend/.env before running this.",
    );
    process.exit(1);
  }

  if (password.length < 10) {
    console.error("ADMIN_PASSWORD must be at least 10 characters.");
    process.exit(1);
  }

  await connectDb();

  const passwordHash = await hashPassword(password);
  const existing = await AdminUser.findOne({ email });

  if (existing) {
    existing.passwordHash = passwordHash;
    existing.name = name;
    existing.isActive = true;
    await existing.save();
    console.log(`Updated existing admin: ${email}`);
  } else {
    await AdminUser.create({ email, name, passwordHash, role: "admin", isActive: true });
    console.log(`Created admin: ${email}`);
  }

  console.log("Now remove ADMIN_PASSWORD from .env — it is no longer needed.");
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
