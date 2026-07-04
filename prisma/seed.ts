import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Create the admin login account only — catalog is managed via the admin portal. */
async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@srkcrackers.com";
  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`↷ Admin already exists: ${email}`);
    return;
  }
  const password = process.env.ADMIN_PASSWORD ?? "Srk@Admin2026";
  const name = process.env.ADMIN_NAME ?? "SRK Admin";
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.adminUser.create({
    data: { email, name, passwordHash, role: "ADMIN" },
  });
  console.log(`✓ Admin user created: ${email}`);
}

async function main() {
  console.log("Running SRK Crackers seed (admin account only)...");
  await seedAdmin();
  console.log("Seed complete — catalog is empty until you add products in admin.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
