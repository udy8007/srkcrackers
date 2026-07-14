import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORIES, PRODUCTS } from "./seed-data";

const prisma = new PrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[″"']/g, "in")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Create missing categories only — never overwrite admin edits. */
async function seedCategories() {
  let created = 0;
  for (const category of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { key: category.key } });
    if (existing) continue;
    await prisma.category.create({ data: category });
    created += 1;
  }
  if (created === 0) {
    console.log(`↷ Categories already present (${CATEGORIES.length} in seed list)`);
  } else {
    console.log(`✓ Created ${created} categorie(s)`);
  }
}

/**
 * Create missing products only — never update or delete existing rows.
 * Safe for empty Supabase bring-up and safe to re-run without wiping catalog.
 */
async function seedProducts() {
  const categories = await prisma.category.findMany();
  const categoryByKey = new Map(categories.map((c) => [c.key, c.id]));

  let created = 0;
  let skipped = 0;
  let order = 0;
  for (const product of PRODUCTS) {
    order += 1;
    const slug = slugify(product.name);
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (existing) {
      skipped += 1;
      continue;
    }
    const categoryId = categoryByKey.get(product.cat);
    if (!categoryId) {
      console.warn(`! Skipping "${product.name}" — unknown category "${product.cat}"`);
      continue;
    }
    await prisma.product.create({
      data: {
        name: product.name,
        slug,
        pack: product.pack,
        price: product.price,
        mrp: product.mrp,
        imageUrl: product.image,
        description: product.description,
        sortOrder: order,
        categoryId,
      },
    });
    created += 1;
  }
  console.log(`✓ Products: created ${created}, skipped existing ${skipped}`);
}

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

async function seedEmailSettings() {
  const host = process.env.EMAIL_SMTP_HOST ?? "smtp.hostinger.com";
  const port = Number(process.env.EMAIL_SMTP_PORT ?? 465);
  const username = process.env.EMAIL_SMTP_USERNAME ?? "admin@srkcrackers.in";
  const password = process.env.EMAIL_SMTP_PASSWORD ?? "";
  const adminNotifyEmail = process.env.EMAIL_ADMIN_NOTIFY ?? username;

  await prisma.emailSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      enabled: false,
      host,
      port,
      enableSsl: true,
      username,
      password,
      fromEmail: username,
      fromName: "SRK Crackers",
      adminNotifyEmail,
    },
  });
  console.log(`✓ Email settings present (host: ${host})`);
}

async function main() {
  console.log("Seeding Supabase (create-only — no product overwrite)...");
  await seedCategories();
  await seedProducts();
  await seedAdmin();
  await seedEmailSettings();
  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
