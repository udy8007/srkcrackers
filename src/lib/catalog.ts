import { revalidatePath } from "next/cache";
import { getMasterDataSnapshot, syncMasterDataCache } from "@/lib/master-data-cache";
import type {
  CategoryMetaDTO,
  CategoryWithProductsDTO,
  ProductDTO,
} from "@/types";
import type { Product } from "@/lib/db/types";

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

function buildCatalogFromSnapshot(): Promise<CategoryWithProductsDTO[]> {
  return getMasterDataSnapshot().then(({ categories, products, categoryById }) => {
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
  });
}

export async function getCatalog(): Promise<CategoryWithProductsDTO[]> {
  return buildCatalogFromSnapshot();
}

/** Active categories with product counts — no product payloads. */
export async function getCategoryMeta(): Promise<CategoryMetaDTO[]> {
  const { categories, products } = await getMasterDataSnapshot();

  const productCountByCategory = new Map<string, number>();
  for (const product of products) {
    productCountByCategory.set(
      product.categoryId,
      (productCountByCategory.get(product.categoryId) ?? 0) + 1,
    );
  }

  return categories
    .map((category) => ({
      key: category.key,
      label: category.label,
      productCount: productCountByCategory.get(category.id) ?? 0,
    }))
    .filter((category) => category.productCount > 0);
}

function productMatchesSearch(product: Product, search: string): boolean {
  return [product.name, product.nameTa, product.pack, product.description].some(
    (value) => value?.includes(search) ?? false,
  );
}

/** Active products for the storefront grid (all matching results). */
export async function getFilteredProducts(
  query: ProductsFilterQuery = {},
): Promise<{ products: ProductDTO[]; total: number }> {
  const { products, categoryByKey, categoryById } = await getMasterDataSnapshot();

  const categoryKey = query.category?.trim();
  const excludeCategory = query.excludeCategory?.trim();
  const search = query.query?.trim();

  let filtered = products;

  if (categoryKey && categoryKey !== "all") {
    const category = categoryByKey.get(categoryKey);
    filtered = category ? filtered.filter((product) => product.categoryId === category.id) : [];
  } else if (excludeCategory) {
    const category = categoryByKey.get(excludeCategory);
    if (category) {
      filtered = filtered.filter((product) => product.categoryId !== category.id);
    }
  }

  if (search) {
    filtered = filtered.filter((product) => productMatchesSearch(product, search));
  }

  filtered.sort((a, b) => {
    const categorySortA = categoryById.get(a.categoryId)?.sortOrder ?? 0;
    const categorySortB = categoryById.get(b.categoryId)?.sortOrder ?? 0;
    if (categorySortA !== categorySortB) return categorySortA - categorySortB;
    return a.sortOrder - b.sortOrder;
  });

  return {
    products: filtered.map((product) =>
      mapProductToDTO(product, categoryById.get(product.categoryId)?.key ?? ""),
    ),
    total: filtered.length,
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

  const { products, categoryById } = await getMasterDataSnapshot();

  const matched = products.filter((product) => {
    if (ids.length > 0 && slug) {
      return ids.includes(product.id) || product.slug === slug;
    }
    if (ids.length > 0) return ids.includes(product.id);
    return product.slug === slug;
  });

  return matched.map((product) =>
    mapProductToDTO(product, categoryById.get(product.categoryId)?.key ?? ""),
  );
}

/** Reload master-data cache and revalidate storefront paths after admin mutations. */
export async function invalidateCatalogCache(): Promise<void> {
  await syncMasterDataCache();
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
