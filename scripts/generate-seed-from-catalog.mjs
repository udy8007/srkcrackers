import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalog = JSON.parse(readFileSync(resolve(root, "prisma/seed-catalog.json"), "utf8"));

const imageMap = {};
for (const p of catalog.products) {
  if (p.image.startsWith("/products/photos/")) {
    imageMap[p.name] = p.image;
  }
}

const productImagesTs = `// Product pack photos from SRK price-list image set (14 Jul 2026).
export const PRODUCT_IMAGES: Record<string, string> = ${JSON.stringify(imageMap, null, 2)};
`;

const productsTs = catalog.products
  .map(
    (p) =>
      `  item(${JSON.stringify(p.cat)}, ${JSON.stringify(p.name)}, ${JSON.stringify(p.pack)}, ${p.price}, ${p.mrp}, ${JSON.stringify(p.description)}),`,
  )
  .join("\n");

const seedDataTs = `// Catalog from SRK Crackers Price List (14 Jul 2026).
// Create-only seed on empty DB; use \`npm run db:sync-catalog\` to upsert prices/images locally.

import { PRODUCT_IMAGES } from "./product-images";

export const CATEGORY_IMAGES: Record<string, string> = {
  sparklers: "/products/sparklers.svg",
  fancy: "/products/fancy.svg",
  rockets: "/products/fancy.svg",
  fountain: "/products/fountain.svg",
  bombs: "/products/bombs.svg",
  lakshmi: "/products/lakshmi.svg",
  kids: "/products/kids.svg",
  wala: "/products/wala.svg",
};

export const FALLBACK_IMAGE = "/products/default.svg";

export interface SeedCategory {
  key: string;
  label: string;
  sortOrder: number;
}

export interface SeedProduct {
  cat: string;
  name: string;
  pack: string;
  price: number;
  mrp: number;
  image: string;
  description: string;
}

function item(
  cat: string,
  name: string,
  pack: string,
  price: number,
  mrp: number,
  description: string,
): SeedProduct {
  return {
    cat,
    name,
    pack,
    price,
    mrp,
    image: PRODUCT_IMAGES[name] ?? CATEGORY_IMAGES[cat] ?? FALLBACK_IMAGE,
    description,
  };
}

export const CATEGORIES: SeedCategory[] = [
  { key: "sparklers", label: "SPARKLERS", sortOrder: 1 },
  { key: "fancy", label: "FANCY SKY SHOTS", sortOrder: 2 },
  { key: "rockets", label: "ROCKETS", sortOrder: 3 },
  { key: "fountain", label: "FOUNTAINS & FLOWER POTS", sortOrder: 4 },
  { key: "bombs", label: "BOMBS", sortOrder: 5 },
  { key: "lakshmi", label: "SOUND CRACKERS", sortOrder: 6 },
  { key: "kids", label: "KIDS SPECIAL", sortOrder: 7 },
  { key: "wala", label: "GARLAND (WALA)", sortOrder: 8 },
];

export const PRODUCTS: SeedProduct[] = [
${productsTs}
];
`;

writeFileSync(resolve(root, "prisma/product-images.ts"), productImagesTs);
writeFileSync(resolve(root, "prisma/seed-data.ts"), seedDataTs);
console.log(`Wrote product-images (${Object.keys(imageMap).length}) and seed-data (${catalog.products.length})`);
