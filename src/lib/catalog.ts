import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import type {
  CategoryMetaDTO,
  CategoryWithProductsDTO,
  ProductDTO,
  ProductsPageDTO,
} from "@/types";
import type { Category, Product } from "@/lib/db/types";

export const CATALOG_CACHE_TAG = "catalog";

/** Fallback TTL for edge/server cache; admin invalidation clears immediately. */
export const STOREFRONT_CATALOG_REVALIDATE_SECONDS = 300;

export const DEFAULT_PRODUCTS_PAGE_SIZE = 10;
export const MAX_PRODUCTS_PAGE_SIZE = 48;

export interface ProductsPageQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  excludeCategory?: string;
  query?: string;
}

function mapProductToDTO(product: Product, categoryKey: string): ProductDTO {
  return {
    id: product.id,
    name: product.name,
    nameTa: product.nameTa ?? null,
    slug: product.slug,
    pack: product.pack,
    price: product.price,
    mrp: product.mrp,
    imageUrl: product.imageUrl,
    description: product.description,
    categoryKey,
  };
}

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
      products: (productsByCategory.get(category.id) ?? []).map((product) =>
        mapProductToDTO(product, category.key),
      ),
    }))
    .filter((category) => category.products.length > 0);
}

const getCachedCatalog = unstable_cache(loadCatalogFromDb, ["storefront-catalog"], {
  revalidate: STOREFRONT_CATALOG_REVALIDATE_SECONDS,
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

async function loadCategoryMetaFromDb(): Promise<CategoryMetaDTO[]> {
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { products: { where: { active: true } } },
      },
    },
  });

  return categories
    .filter((category) => category._count.products > 0)
    .map((category) => ({
      key: category.key,
      label: category.label,
      productCount: category._count.products,
    }));
}

const getCachedCategoryMeta = unstable_cache(loadCategoryMetaFromDb, ["storefront-category-meta"], {
  revalidate: STOREFRONT_CATALOG_REVALIDATE_SECONDS,
  tags: [CATALOG_CACHE_TAG],
});

/** Active categories with product counts — no product payloads. */
export async function getCategoryMeta(): Promise<CategoryMetaDTO[]> {
  try {
    const cached = await getCachedCategoryMeta();
    if (cached.length > 0) return cached;
  } catch (error) {
    console.warn("Category meta cache unavailable, loading from DB:", error);
  }
  return loadCategoryMetaFromDb();
}

async function buildProductsWhere(query: ProductsPageQuery): Promise<Record<string, unknown>> {
  const where: Record<string, unknown> = { active: true };
  const categoryKey = query.category?.trim();
  const excludeCategory = query.excludeCategory?.trim();
  const search = query.query?.trim();

  if (categoryKey && categoryKey !== "all") {
    const category = await prisma.category.findFirst({
      where: { key: categoryKey, active: true },
      select: { id: true },
    });
    if (category) where.categoryId = category.id;
  } else if (excludeCategory) {
    const category = await prisma.category.findFirst({
      where: { key: excludeCategory },
      select: { id: true },
    });
    if (category) where.categoryId = { not: category.id };
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { nameTa: { contains: search } },
      { pack: { contains: search } },
      { description: { contains: search } },
    ];
  }

  return where;
}

/** Paginated active products for the storefront grid. */
export async function getProductsPage(query: ProductsPageQuery = {}): Promise<ProductsPageDTO> {
  const page = Math.max(query.page ?? 1, 1);
  const pageSize = Math.min(
    Math.max(query.pageSize ?? DEFAULT_PRODUCTS_PAGE_SIZE, 1),
    MAX_PRODUCTS_PAGE_SIZE,
  );
  const skip = (page - 1) * pageSize;
  const where = await buildProductsWhere(query);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
      skip,
      take: pageSize,
      include: { category: { select: { key: true } } },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((product) => mapProductToDTO(product, product.category.key)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Resolve products by id and/or slug (cart recovery, deep links). */
export async function resolveProducts(options: {
  ids?: string[];
  slug?: string;
}): Promise<ProductDTO[]> {
  const ids = options.ids?.filter(Boolean) ?? [];
  const slug = options.slug?.trim();

  if (ids.length === 0 && !slug) return [];

  const where =
    ids.length > 0 && slug
      ? { active: true, OR: [{ id: { in: ids } }, { slug }] }
      : ids.length > 0
        ? { active: true, id: { in: ids } }
        : { active: true, slug };

  const products = await prisma.product.findMany({
    where,
    include: { category: { select: { key: true } } },
  });

  return products.map((product) => mapProductToDTO(product, product.category.key));
}

/** Call after product/category admin mutations so the storefront refreshes promptly. */
export function invalidateCatalogCache(): void {
  revalidateTag(CATALOG_CACHE_TAG);
  revalidatePath("/");
  revalidatePath("/api/products");
  revalidatePath("/api/products/resolve");
  revalidatePath("/crackers", "layout");
}

/** Flat list of all active products. */
export async function getAllProducts(): Promise<ProductDTO[]> {
  const catalog = await getCatalog();
  return catalog.flatMap((category) => category.products);
}
