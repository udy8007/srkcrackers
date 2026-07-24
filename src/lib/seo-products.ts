import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";
import type { Product } from "@/lib/db/types";

export type SeoProduct = {
  id: string;
  name: string;
  nameTa: string | null;
  slug: string;
  pack: string;
  price: number;
  mrp: number;
  imageUrl: string;
  description: string;
  categoryKey: string;
  categoryLabel: string;
  updatedAt: Date;
};

export async function getSeoProductBySlug(slug: string): Promise<SeoProduct | null> {
  const product = (await prisma.product.findFirst({
    where: { slug, active: true },
  })) as Product | null;
  if (!product) return null;

  const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
  if (!category || !category.active) return null;

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
    categoryKey: category.key,
    categoryLabel: category.label,
    updatedAt: product.updatedAt,
  };
}

export async function listActiveSeoProducts(): Promise<
  Array<{ slug: string; updatedAt: Date; name: string }>
> {
  const products = (await prisma.product.findMany({
    where: { active: true },
    select: { slug: true, updatedAt: true, name: true, categoryId: true },
    orderBy: { sortOrder: "asc" },
  })) as Array<{ slug: string; updatedAt: Date; name: string; categoryId: string }>;

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { id: true },
  });
  const activeCategoryIds = new Set(categories.map((category) => category.id));

  return products
    .filter((product) => activeCategoryIds.has(product.categoryId))
    .map(({ slug, updatedAt, name }) => ({ slug, updatedAt, name }));
}

export function productSeoPath(slug: string): string {
  return `/crackers/${slug}`;
}

export function productSeoUrl(slug: string): string {
  return `${BUSINESS.url}${productSeoPath(slug)}`;
}
