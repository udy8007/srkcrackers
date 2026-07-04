const all = [];
for (let page = 1; page <= 20; page++) {
  const r = await fetch(
    `https://www.velcrackerssivakasi.com/wp-json/wc/store/products?per_page=100&page=${page}`,
  );
  if (!r.ok) break;
  const batch = await r.json();
  if (!batch.length) break;
  for (const p of batch) {
    all.push({ name: p.name, img: p.images?.[0]?.src ?? null, slug: p.slug });
  }
  console.log("page", page, "total", all.length);
}
import { writeFileSync } from "node:fs";
writeFileSync("scripts/vel-catalog.json", JSON.stringify(all, null, 2));
console.log("with images:", all.filter((x) => x.img).length);
