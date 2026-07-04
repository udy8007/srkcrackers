import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

function serializeProduct(
  product: Prisma.ProductGetPayload<{ include: { category: { select: { key: true; label: true } } } }>,
) {
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
    categoryKey: product.category.key,
    categoryLabel: product.category.label,
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { category: { select: { key: true, label: true } } },
  });

  return NextResponse.json({ products: products.map(serializeProduct) });
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
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        categoryId,
      },
      include: { category: { select: { key: true, label: true } } },
    });
    return NextResponse.json(serializeProduct(product), { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not create product" }, { status: 400 });
  }
}
