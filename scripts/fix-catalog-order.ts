/**
 * One-shot: fix production category labels + product category/sortOrder
 * to match the storefront price-list order.
 *
 * Usage: npx tsx scripts/fix-catalog-order.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Desired catalog: category key → label, sortOrder, product slugs in display order */
const CATALOG: Array<{
  key: string;
  label: string;
  sortOrder: number;
  products: string[];
}> = [
  {
    key: "sparklers",
    label: "Sparklers (Kids & Family)",
    sortOrder: 1,
    products: [
      "7-cm-electric-sparklers",
      "7-cm-colour-sparklers",
      "10-cm-electric-sparklers",
      "10-cm-colour-sparklers",
      "15-cm-electric-sparklers",
      "15-cm-green-sparklers",
      "15-cm-red-sparklers",
      "30-cm-electric-sparklers",
      "30-cm-colour-sparklers",
      "50-cm-electric-sparklers",
      "1-twinkling-star",
      "twinkling-star-deluxe",
      "green-colour-torch",
    ],
  },
  {
    key: "ground",
    label: "Ground Fancy",
    sortOrder: 2,
    products: [
      "deluxe-chakkar",
      "special-chakkar",
      "colour-swirls-special",
      "kurkure-crackling-12-shot",
      "60-multi-colour-shot",
    ],
  },
  {
    key: "fancy",
    label: "Fancy Sky Shots",
    sortOrder: 3,
    products: [
      "chota-fancy-1pcs",
      "2in-fancy",
      "2in-fancy-3-pcs",
      "2-inch-double-ball-1pcs",
      "2in-pipe-1-piece",
      "3in-fancy",
      "3-5in-fancy-1-piece",
      "4in-fancy-2-pcs",
      "5-inch-fancy-2-in-1",
      "3-pcs-sky-shot-2pcs",
      "7-shots",
      "30-shots-multi-colour",
      "120shots",
    ],
  },
  {
    key: "rockets",
    label: "Rockets",
    sortOrder: 4,
    products: ["helicopter-5pcs", "rocket-bomb", "whistling-rocket"],
  },
  {
    key: "fountain",
    label: "Flower Pots & Fountains",
    sortOrder: 5,
    products: [
      "flower-pot-asoka",
      "flower-pots-special",
      "flower-pots-deluxe-5pcs",
      "colour-koti",
      "colour-koti-deluxe",
      "butterfly",
      "rotate-sparklers",
      "mini-siren",
      "mega-siren-3pcs",
      "magic-peacock",
      "bada-peacock-5-face",
      "naya-falls",
    ],
  },
  {
    key: "bombs",
    label: "Bombs",
    sortOrder: 6,
    products: [
      "hitler-kg-paper-bomb",
      "kaki-ola-vedi-10pcs",
      "hydro-bomb",
      "classic-bomb",
      "digital-bomb",
      "paper-bomb-half-kg",
      "paper-bomb-1-kg",
    ],
  },
  {
    key: "lakshmi",
    label: "Sound Crackers",
    sortOrder: 7,
    products: [
      "2-75-kuruvi",
      "3-25-lakshmi-1-packet",
      "4-dlx-lakshmi",
      "gold-lakshmi-1-packet",
      "hulk-dlx",
      "5in-lion-1-packet",
      "red-bijili-100",
      "two-sound-1-packet",
      "jallikattu-dlx-1-packet",
    ],
  },
  {
    key: "kids",
    label: "Kids Special",
    sortOrder: 8,
    products: [
      "roll-cap",
      "wonder-throw-box-10pcs",
      "pop-pop-50-boxes",
      "beedi-blast-10-boxes",
      "gun-with-3-ring-caps",
      "ring-cap-100-packets",
      "anaconda-10-boxes",
      "selfie-stick-5pcs",
      "colour-smoke",
      "photo-flash",
      "sky-lander-6-piece",
    ],
  },
  {
    key: "wala",
    label: "Garland (Wala)",
    sortOrder: 9,
    products: [
      "28-wala",
      "100-wala",
      "200-wala",
      "1000-wala",
      "2000-wala",
      "5000-wala",
      "10000-wala",
    ],
  },
];

async function main() {
  const allProducts = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, categoryId: true },
  });
  const bySlug = new Map(allProducts.map((p) => [p.slug, p]));

  const listed = new Set(CATALOG.flatMap((c) => c.products));
  const missing = [...listed].filter((slug) => !bySlug.has(slug));
  if (missing.length) {
    console.error("Missing slugs in DB:", missing);
    process.exit(1);
  }

  const unlisted = allProducts.filter((p) => !listed.has(p.slug));
  if (unlisted.length) {
    console.warn(
      "Products not in new list (left unchanged):",
      unlisted.map((p) => `${p.slug} (${p.name})`),
    );
  }

  let globalOrder = 0;

  for (const cat of CATALOG) {
    const category = await prisma.category.upsert({
      where: { key: cat.key },
      update: { label: cat.label, sortOrder: cat.sortOrder, active: true },
      create: {
        key: cat.key,
        label: cat.label,
        sortOrder: cat.sortOrder,
        active: true,
      },
    });
    console.log(`Category ${cat.sortOrder}. ${cat.label} (${cat.key})`);

    let localOrder = 0;
    for (const slug of cat.products) {
      localOrder += 1;
      globalOrder += 1;
      const product = bySlug.get(slug)!;
      await prisma.product.update({
        where: { id: product.id },
        data: {
          categoryId: category.id,
          sortOrder: localOrder,
          active: true,
        },
      });
      console.log(`  ${localOrder}. ${product.name}`);
    }
  }

  console.log(`\nDone. Updated ${globalOrder} products across ${CATALOG.length} categories.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
