import { getCategoryMeta } from "@/lib/catalog";
import { Storefront } from "@/components/storefront/Storefront";

/** Must match STOREFRONT_CATALOG_REVALIDATE_SECONDS in @/lib/catalog */
export const revalidate = 300;

export default async function HomePage() {
  const categories = await getCategoryMeta();
  return <Storefront categories={categories} />;
}
