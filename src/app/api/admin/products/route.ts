import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { invalidateCatalogCache } from "@/lib/catalog";
import { slugify } from "@/lib/slugify";
import type { Product } from "@/lib/db/types";

export const dynamic = "force-dynamic";

type ProductRow = Product & { categoryKey: string; categoryLabel: string };

async function withCategory(product: Product): Promise<ProductRow> {
  const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
  return {
    ...product,
    categoryKey: category?.key ?? "",
    categoryLabel: category?.label ?? "",
  };
}

function serializeProduct(product: ProductRow) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    pack: product.pack,
    price: product.price,
    mrp: product.mrp,
    active: product.active,
    imageUrl: product.imageUrl,
    description: product.description,
    sortOrder: product.sortOrder,
    categoryId: product.categoryId,
    categoryKey: product.categoryKey,
    categoryLabel: product.categoryLabel,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const statusParam = searchParams.get("status") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const take = Math.min(Number(searchParams.get("take")) || 25, 200);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const where: Record<string, unknown> = {};
  if (statusParam === "active") where.active = true;
  else if (statusParam === "hidden") where.active = false;
  if (categoryId) where.categoryId = categoryId;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { pack: { contains: q, mode: "insensitive" } },
    ];
  }

  const [products, total, statsTotal, statsActive, statsHidden] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { sortOrder: "asc" },
      take,
      skip,
    }),
    prisma.product.count({ where }),
    prisma.product.count(),
    prisma.product.count({ where: { active: true } }),
    prisma.product.count({ where: { active: false } }),
  ]);

  const enriched = await Promise.all(products.map(withCategory));

  return NextResponse.json({
    products: enriched.map(serializeProduct),
    total,
    stats: { total: statsTotal, active: statsActive, hidden: statsHidden },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    name?: string;
    pack?: string;
    price?: number;
    mrp?: number;
    description?: string;
    imageUrl?: string;
    categoryId?: string;
    active?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const name = body.name?.trim();
  const pack = body.pack?.trim();
  const categoryId = body.categoryId;
  if (!name || !pack || !categoryId) {
    return NextResponse.json({ error: "name, pack, and categoryId are required" }, { status: 400 });
  }

  const price = Math.max(0, Math.round(body.price ?? 0));
  const mrp = Math.max(price, Math.round(body.mrp ?? price * 5));

  const baseSlug = slugify(name) || "product";
  let slug = baseSlug;
  let n = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++n}`;
  }

  const maxOrder = await prisma.product.aggregate({
    where: { categoryId },
    _max: { sortOrder: true },
  });

  try {
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        pack,
        price,
        mrp,
        description: body.description?.trim() ?? "",
        imageUrl: body.imageUrl?.trim() || "/products/default.svg",
        active: body.active !== false,
        sortOrder: ((maxOrder._max as { sortOrder: number | null } | undefined)?.sortOrder ?? 0) + 1,
        categoryId,
      },
    });
    const enriched = await withCategory(product);
    invalidateCatalogCache();
    return NextResponse.json(serializeProduct(enriched), { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products failed:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
