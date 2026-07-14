import { prisma } from "@/lib/prisma";
import type { CategoryWithProductsDTO, ProductDTO } from "@/types";
import type { Category, Product } from "@/lib/db/types";

/** Fetch active categories with their active products, ready for the storefront. */
export async function getCatalog(): Promise<CategoryWithProductsDTO[]> {
  const categories = (await prisma.category.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
    include: {
      products: {
        where: { active: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })) as Array<Category & { products: Product[] }>;

  return categories
    .map((category) => ({
      key: category.key,
      label: category.label,
      products: category.products.map(
        (product): ProductDTO => ({
          id: product.id,
          name: product.name,
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

/** Flat list of all active products. */
export async function getAllProducts(): Promise<ProductDTO[]> {
  const catalog = await getCatalog();
  return catalog.flatMap((category) => category.products);
}
