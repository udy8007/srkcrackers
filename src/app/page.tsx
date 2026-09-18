import { getAllProducts, getCategoryMeta } from "@/lib/catalog";
import { Storefront } from "@/components/storefront/Storefront";

/** Catalog comes from Turso at request time (cPanel env), not from GitHub build. */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategoryMeta(), getAllProducts()]);
  return <Storefront categories={categories} products={products} />;
}
