import { getAllProducts, getCategoryMeta } from "@/lib/catalog";
import { Storefront } from "@/components/storefront/Storefront";

export default async function HomePage() {
  const [categories, products] = await Promise.all([getCategoryMeta(), getAllProducts()]);
  return <Storefront categories={categories} products={products} />;
}
