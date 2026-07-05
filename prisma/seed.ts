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

async function seedCategories() {
  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { key: category.key },
      update: { label: category.label, sortOrder: category.sortOrder, active: true },
      create: category,
    });
  }
  await prisma.category.updateMany({
    where: { key: { notIn: CATEGORIES.map((c) => c.key) } },
    data: { active: false },
  });
  console.log(`✓ Synced ${CATEGORIES.length} categories`);
}

async function seedProducts() {
  const categories = await prisma.category.findMany();
  const categoryByKey = new Map(categories.map((c) => [c.key, c.id]));
  const newSlugs = PRODUCTS.map((p) => slugify(p.name));

  const removed = await prisma.product.deleteMany({
    where: { slug: { notIn: newSlugs } },
  });
  if (removed.count > 0) {
    console.log(`✓ Removed ${removed.count} obsolete products`);
  }

  let order = 0;
  for (const product of PRODUCTS) {
    const categoryId = categoryByKey.get(product.cat);
    if (!categoryId) {
      console.warn(`! Skipping "${product.name}" — unknown category "${product.cat}"`);
      continue;
    }
    order += 1;
    const slug = slugify(product.name);
    await prisma.product.upsert({
      where: { slug },
      update: {
        name: product.name,
        pack: product.pack,
        price: product.price,
        mrp: product.mrp,
        description: product.description,
        sortOrder: order,
        categoryId,
        active: true,
      },
      create: {
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
  }
  console.log(`✓ Synced ${PRODUCTS.length} products`);
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

async function main() {
  console.log("Seeding SRK Crackers database...");
  await seedCategories();
  await seedProducts();
  await seedAdmin();
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
