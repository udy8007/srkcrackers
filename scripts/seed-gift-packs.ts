/**
 * Upsert Festival Gift Packs category + 4 products.
 * Usage: npx tsx scripts/seed-gift-packs.ts
 */
import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

const PACKS = [
  {
    slug: "16-items-gift-pack",
    name: "16 Items Gift Pack",
    pack: "16 Items Gift Pack",
    mrp: 1500,
    price: 240,
    imageUrl: "/products/gift-packs/16-items-gift-pack.jpg",
    sortOrder: 1,
    description:
      "Festival gift pack with 16 items including Bijli, Lakshmi, Kuruvi, Disco Wheel, Sparklers, and more.",
  },
  {
    slug: "21-items-gift-pack",
    name: "21 Items Gift Pack",
    pack: "21 Items Gift Pack",
    mrp: 1500,
    price: 285,
    imageUrl: "/products/gift-packs/21-items-gift-pack.jpg",
    sortOrder: 2,
    description:
      "Festival gift pack with 21 items including Lakshmi, Kuruvi, Military Boom, Flowerpot, Chakra, and more.",
  },
  {
    slug: "25-items-gift-pack",
    name: "25 Items Gift Pack",
    pack: "25 Items Gift Pack",
    mrp: 1500,
    price: 350,
    imageUrl: "/products/gift-packs/25-items-gift-pack.jpg",
    sortOrder: 3,
    description:
      "Festival gift pack with 25 items including Bijli, Lakshmi, Parrot, Flower Pot, Sparklers, and more.",
  },
  {
    slug: "30-items-gift-pack",
    name: "30 Items Gift Pack",
    pack: "30 Items Gift Pack",
    mrp: 1500,
    price: 550,
    imageUrl: "/products/gift-packs/30-items-gift-pack.jpg",
    sortOrder: 4,
    description:
      "Festival gift pack with 30 items including Bijili, Lakshmi, Flower Pot Big, Chakra Big, Sparklers, and more.",
  },
] as const;

const LEGACY_SLUGS = ["amazing-gift-pack", "golden-gift-pack", "mayur-gift-box"];

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

  for (const slug of LEGACY_SLUGS) {
    const deactivated = await prisma.product.updateMany({
      where: { slug },
      data: { active: false },
    });
    if (deactivated.count > 0) {
      console.log(`✗ Deactivated legacy pack: ${slug}`);
    }
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
