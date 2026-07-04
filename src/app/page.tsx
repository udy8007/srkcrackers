import { getCatalog } from "@/lib/catalog";
import { Storefront } from "@/components/storefront/Storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await getCatalog();
  return <Storefront categories={categories} />;
}
