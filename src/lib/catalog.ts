import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CategoryWithProductsDTO, ProductDTO } from "@/types";
import type { Category, Product } from "@/lib/db/types";

export const CATALOG_CACHE_TAG = "catalog";

async function loadCatalogFromDb(): Promise<CategoryWithProductsDTO[]> {
  const [categories, products] = (await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])) as [Category[], Product[]];

  const productsByCategory = new Map<string, Product[]>();
  for (const product of products) {
    const list = productsByCategory.get(product.categoryId) ?? [];
    list.push(product);
    productsByCategory.set(product.categoryId, list);
  }

  return categories
    .map((category) => ({
      key: category.key,
      label: category.label,
      products: (productsByCategory.get(category.id) ?? []).map(
        (product): ProductDTO => ({
          id: product.id,
          name: product.name,
          nameTa: product.nameTa ?? null,
          slug: product.slug,
          pack: product.pack,
          price: product.price,
          mrp: product.mrp,
          imageUrl: product.imageUrl,
          description: product.description,
          categoryKey: category.key,
        }),
      ),
    }))
    .filter((category) => category.products.length > 0);
}

const getCachedCatalog = unstable_cache(loadCatalogFromDb, ["storefront-catalog"], {
  revalidate: 60,
  tags: [CATALOG_CACHE_TAG],
});

/**
 * Prefer the short-lived cache, but never serve a stuck empty catalog
 * (e.g. after a deploy against an empty DB that was seeded later).
 * Falls back when Next.js refuses large cache entries (>2MB).
 */
export async function getCatalog(): Promise<CategoryWithProductsDTO[]> {
  try {
    const cached = await getCachedCatalog();
    if (cached.length > 0) return cached;
  } catch (error) {
    console.warn("Catalog cache unavailable, loading from DB:", error);
  }
  return loadCatalogFromDb();
}

/** Call after product/category admin mutations so the storefront refreshes promptly. */
export function invalidateCatalogCache(): void {
  revalidateTag(CATALOG_CACHE_TAG);
}

/** Flat list of all active products. */
export async function getAllProducts(): Promise<ProductDTO[]> {
  const catalog = await getCatalog();
  return catalog.flatMap((category) => category.products);
}
