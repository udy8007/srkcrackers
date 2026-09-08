/**
 * Upsert categories + products from seed-data into the connected DB.
 * Updates price / mrp / pack / description / imageUrl for existing products (by slug).
 * Deactivates products not in the new price list.
 *
 * Usage: npx tsx scripts/sync-catalog.ts
 */
import { createPrismaClient } from "../src/lib/create-prisma-client";
import { CATEGORIES, PRODUCTS } from "../prisma/seed-data";

const prisma = createPrismaClient();

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/3½/g, "3-5")
    .replace(/3¼/g, "3-25")
    .replace(/2¾/g, "2-75")
    .replace(/1½/g, "1-5")
    .replace(/½/g, "half")
    .replace(/¼/g, "quarter")
    .replace(/[″"']/g, "in")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log("Syncing catalog from seed-data (PDF price list)...");

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { key: category.key },
      update: { label: category.label, sortOrder: category.sortOrder, active: true },
      create: category,
    });
  }

  const categories = await prisma.category.findMany();
  const categoryByKey = new Map(categories.map((c) => [c.key, c.id]));

  const keepSlugs = new Set<string>();
  let order = 0;
  let created = 0;
  let updated = 0;

  for (const product of PRODUCTS) {
    order += 1;
    const slug = slugify(product.name);
    keepSlugs.add(slug);
    const categoryId = categoryByKey.get(product.cat);
    if (!categoryId) {
      console.warn(`! Skipping "${product.name}" — unknown category "${product.cat}"`);
      continue;
    }

    const existing = await prisma.product.findUnique({ where: { slug } });
    const data = {
      name: product.name,
      pack: product.pack,
      price: product.price,
      mrp: product.mrp,
      imageUrl: product.image,
      description: product.description,
      sortOrder: order,
      categoryId,
      active: true,
    };

    if (existing) {
      await prisma.product.update({ where: { slug }, data });
      updated += 1;
    } else {
      await prisma.product.create({ data: { ...data, slug } });
      created += 1;
    }
  }

  const deactivated = await prisma.product.updateMany({
    where: { slug: { notIn: [...keepSlugs] }, active: true },
    data: { active: false },
  });

  console.log(
    `✓ Sync complete — created ${created}, updated ${updated}, deactivated ${deactivated.count}`,
  );
}

main()
  .catch((error) => {
    console.error("Sync failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
