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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: {
    name?: string;
    pack?: string;
    price?: number;
    mrp?: number;
    description?: string;
    active?: boolean;
    imageUrl?: string;
    categoryId?: string;
    sortOrder?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data: Prisma.ProductUpdateInput = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.pack === "string" && body.pack.trim()) data.pack = body.pack.trim();
  if (typeof body.description === "string") data.description = body.description.trim();
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.price === "number" && body.price >= 0) data.price = Math.round(body.price);
  if (typeof body.mrp === "number" && body.mrp >= 0) data.mrp = Math.round(body.mrp);
  if (typeof body.sortOrder === "number") data.sortOrder = Math.round(body.sortOrder);
  if (typeof body.imageUrl === "string" && body.imageUrl.trim()) {
    const url = body.imageUrl.trim();
    if (url.length > 600_000) {
      return NextResponse.json({ error: "Image data too large to store" }, { status: 413 });
    }
    data.imageUrl = url;
  }
  if (typeof body.categoryId === "string") {
    data.category = { connect: { id: body.categoryId } };
  }

  if (typeof body.name === "string" && body.name.trim()) {
    const baseSlug = slugify(body.name.trim());
    if (baseSlug) {
      const conflict = await prisma.product.findFirst({
        where: { slug: baseSlug, NOT: { id } },
      });
      if (!conflict) data.slug = baseSlug;
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: { select: { key: true, label: true } } },
    });
    return NextResponse.json(serializeProduct(product));
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
}
