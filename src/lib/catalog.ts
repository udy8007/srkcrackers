import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type {
  CategoryMetaDTO,
  CategoryWithProductsDTO,
  ProductDTO,
} from "@/types";
import type { Category, Product } from "@/lib/db/types";

export interface ProductsFilterQuery {
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

export async function getCatalog(): Promise<CategoryWithProductsDTO[]> {
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

/** Active categories with product counts — no product payloads. */
export async function getCategoryMeta(): Promise<CategoryMetaDTO[]> {
  return loadCategoryMetaFromDb();
}

async function buildProductsWhere(query: ProductsFilterQuery): Promise<Record<string, unknown>> {
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

/** Active products for the storefront grid (all matching results). */
export async function getFilteredProducts(
  query: ProductsFilterQuery = {},
): Promise<{ products: ProductDTO[]; total: number }> {
  const where = await buildProductsWhere(query);

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { category: { select: { key: true } } },
  });

  return {
    products: products.map((product) => mapProductToDTO(product, product.category.key)),
    total: products.length,
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
