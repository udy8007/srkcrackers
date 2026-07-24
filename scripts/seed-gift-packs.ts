/**
 * Upsert Festival Gift Packs category + 3 products (20% off MRP).
 * Usage: npx tsx scripts/seed-gift-packs.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PACKS = [
  {
    slug: "amazing-gift-pack",
    name: "Amazing Gift Pack",
    pack: "30 Items Gift Pack",
    mrp: 1500,
    price: 1200, // 20% off
    imageUrl: "/products/gift-packs/amazing-gift-pack.png",
    sortOrder: 1,
    description:
      "Festival gift pack with 30 items including Gold Lakshmi, Bijili, Flower Pot Big, Disco Wheel, Sparklers, Ground Chakra Big, and more.",
  },
  {
    slug: "golden-gift-pack",
    name: "Golden Pack",
    pack: "40 Items Gift Pack",
    mrp: 1800,
    price: 1440, // 20% off
    imageUrl: "/products/gift-packs/golden-gift-pack.png",
    sortOrder: 2,
    description:
      "Festival gift pack with 40 items including Bijili, Gold Lakshmi, Lakshmi crackers, Sparklers, Flower Pot Big, Ground Chakra Big, and more.",
  },
  {
    slug: "mayur-gift-box",
    name: "Mayur Gift Box",
    pack: "30 Items Gift Box",
    mrp: 1500,
    price: 1200, // 20% off
    imageUrl: "/products/gift-packs/mayur-gift-box.png",
    sortOrder: 3,
    description:
      "Festival gift box with 30 items including Bijili, Flower Pot Big, Ground Chakra Big, Disco Wheel, Sparklers, and more.",
  },
] as const;

async function main() {
  const category = await prisma.category.upsert({
    where: { key: "gift-packs" },
    create: {
      key: "gift-packs",
      label: "Festival Gift Packs",
      sortOrder: 0,
      active: true,
    },
    update: {
      label: "Festival Gift Packs",
      sortOrder: 0,
      active: true,
    },
  });

  for (const pack of PACKS) {
    await prisma.product.upsert({
      where: { slug: pack.slug },
      create: {
        name: pack.name,
        slug: pack.slug,
        pack: pack.pack,
        price: pack.price,
        mrp: pack.mrp,
        imageUrl: pack.imageUrl,
        description: pack.description,
        active: true,
        sortOrder: pack.sortOrder,
        categoryId: category.id,
      },
      update: {
        name: pack.name,
        pack: pack.pack,
        price: pack.price,
        mrp: pack.mrp,
        imageUrl: pack.imageUrl,
        description: pack.description,
        active: true,
        sortOrder: pack.sortOrder,
        categoryId: category.id,
      },
    });
    console.log(`✓ ${pack.name} — MRP ₹${pack.mrp} → ₹${pack.price}`);
  }

  console.log(`\nCategory: ${category.label} (${category.key})`);
  console.log("Done. Gift packs are live in the catalog.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
