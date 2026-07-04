import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { PRODUCT_VEL_SLUGS } from "../prisma/product-image-map";
import { PRODUCTS } from "../prisma/seed-data";

interface VelProduct {
  slug: string;
  img: string | null;
}

const catalog = JSON.parse(readFileSync("scripts/vel-catalog.json", "utf8")) as VelProduct[];
const bySlug = new Map(catalog.map((p) => [p.slug, p]));

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[″"']/g, "in")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.split("?")[0];
}

const outDir = join("public", "products", "photos");

async function main() {
  mkdirSync(outDir, { recursive: true });

  const imageMap: Record<string, string> = {};
  let ok = 0;
  let miss = 0;

  for (const product of PRODUCTS) {
    const velSlug = PRODUCT_VEL_SLUGS[product.name];
    const vel = bySlug.get(velSlug);
    const src = cleanUrl(vel?.img ?? null);
    const fileSlug = slugify(product.name);

    if (!src) {
      console.warn(`MISS ${product.name} (vel slug: ${velSlug})`);
      imageMap[product.name] = product.image;
      miss++;
      continue;
    }

    const ext = extname(new URL(src).pathname) || ".jpg";
    const dest = join(outDir, `${fileSlug}${ext}`);
    const localUrl = `/products/photos/${fileSlug}${ext}`;

    process.stdout.write(`↓ ${product.name} ... `);
    const res = await fetch(src);
    if (!res.ok) {
      console.warn(`FAIL ${res.status}`);
      imageMap[product.name] = product.image;
      miss++;
      continue;
    }
    writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
    imageMap[product.name] = localUrl;
    ok++;
    console.log("ok");
  }

  writeFileSync("scripts/product-images.json", JSON.stringify(imageMap, null, 2));
  console.log(`\nDone: ${ok} downloaded, ${miss} fallback`);

  const lines = Object.entries(imageMap).map(
    ([name, url]) => `  ${JSON.stringify(name)}: ${JSON.stringify(url)},`,
  );
  const ts = `// Real product pack photos — sourced from velcrackerssivakasi.com (no watermarks).\nexport const PRODUCT_IMAGES: Record<string, string> = {\n${lines.join("\n")}\n};\n`;
  writeFileSync("prisma/product-images.ts", ts);
  console.log("Wrote prisma/product-images.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
