import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../lib/db";

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@assetflow.local";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "ChangeMe123!";

  const existing = await db.employee.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin account already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.employee.create({
    data: {
      name: "AssetFlow Admin",
      email,
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Bootstrap admin created: ${email} / ${password}`);
  console.log("Log in and change this password, or set ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD before seeding.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
