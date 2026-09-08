/**
 * One-time catalog cleanup:
 * - Clean category display names (remove "80% OFF" clutter)
 * - Add Rockets category
 * - Move misplaced products into the right categories
 * - Deactivate empty Crackling category
 *
 * Run: npx tsx scripts/cleanup-catalog.ts
 */
import { createPrismaClient } from "../src/lib/create-prisma-client";

const prisma = createPrismaClient();

const CATEGORY_UPDATES: { key: string; label: string; sortOrder: number; active: boolean }[] = [
  { key: "sparklers", label: "SPARKLERS", sortOrder: 1, active: true },
  { key: "fancy", label: "FANCY SKY SHOTS", sortOrder: 2, active: true },
  { key: "rockets", label: "ROCKETS", sortOrder: 3, active: true },
  { key: "fountain", label: "FOUNTAINS & FLOWER POTS", sortOrder: 4, active: true },
  { key: "bombs", label: "BOMBS", sortOrder: 5, active: true },
  { key: "lakshmi", label: "SOUND CRACKERS", sortOrder: 6, active: true },
  { key: "kids", label: "KIDS SPECIAL", sortOrder: 7, active: true },
  { key: "wala", label: "GARLAND (WALA)", sortOrder: 8, active: true },
  { key: "crackling", label: "CRACKLING", sortOrder: 99, active: false },
];

/** Product name → destination category key */
const PRODUCT_MOVES: Record<string, string> = {
  // Crackling was a tiny leftover category
  "10 Crackling": "sparklers",
  "2¾ Kuruvi": "lakshmi",

  // Rockets were mixed into Fancy
  "Rocket Bomb": "rockets",
  "Whistling Rocket": "rockets",
  "Sky Scrapper": "rockets",

  // Daytime / novelty items fit Kids Special better
  "Colour Smoke": "kids",
  "Selfie Stick": "kids",
  "Photo Flash": "kids",
};

async function main() {
  console.log("Cleaning catalog categories & product placement...\n");

  for (const cat of CATEGORY_UPDATES) {
    await prisma.category.upsert({
      where: { key: cat.key },
      update: { label: cat.label, sortOrder: cat.sortOrder, active: cat.active },
      create: {
        key: cat.key,
        label: cat.label,
        sortOrder: cat.sortOrder,
        active: cat.active,
      },
    });
    console.log(`✓ Category ${cat.key} → "${cat.label}" (active=${cat.active})`);
  }

  const categories = await prisma.category.findMany();
  const byKey = new Map(categories.map((c) => [c.key, c.id]));

  let moved = 0;
  for (const [name, catKey] of Object.entries(PRODUCT_MOVES)) {
    const categoryId = byKey.get(catKey);
    if (!categoryId) {
      console.warn(`! Missing category "${catKey}" for "${name}"`);
      continue;
    }
    const result = await prisma.product.updateMany({
      where: { name },
      data: { categoryId },
    });
    if (result.count > 0) {
      console.log(`→ Moved "${name}" → ${catKey}`);
      moved += result.count;
    } else {
      console.warn(`! Product not found: "${name}"`);
    }
  }

  // Re-number sortOrder within each active category for a clean list
  const activeCats = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  for (const cat of activeCats) {
    const products = await prisma.product.findMany({
      where: { categoryId: cat.id },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    let i = 0;
    for (const p of products) {
      i += 1;
      await prisma.product.update({ where: { id: p.id }, data: { sortOrder: i } });
    }
  }

  console.log(`\nDone. Moved ${moved} product(s).`);

  const summary = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: true } } },
  });
  console.log("\n=== FINAL CATEGORIES ===");
  for (const c of summary) {
    console.log(
      `${c.active ? "✓" : "✗"} ${c.sortOrder}. ${c.label} (${c.key}) — ${c._count.products} products`,
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
