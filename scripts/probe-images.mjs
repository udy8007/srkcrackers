const BASE = "https://www.velcrackerssivakasi.com";
const r = await fetch(`${BASE}/shop/`);
const html = await r.text();
const products = [...html.matchAll(/href="(https:\/\/www\.velcrackerssivakasi\.com\/product\/[^"]+)"/g)].map((m) => m[1]);
console.log("products:", [...new Set(products)].length);
for (const p of [...new Set(products)].slice(0, 5)) {
  const pr = await fetch(p);
  const ph = await pr.text();
  const img = ph.match(/wp-content\/uploads\/[^"'\s]+\.(jpg|jpeg|webp|png)/i);
  const title = ph.match(/<h1[^>]*>([^<]+)/i)?.[1]?.trim();
  console.log(title, "=>", img ? `https://www.velcrackerssivakasi.com/${img[0]}` : "none");
}
