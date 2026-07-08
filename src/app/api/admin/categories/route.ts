import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { slugify } from "@/lib/slugify";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      key: true,
      label: true,
      active: true,
      sortOrder: true,
      _count: { select: { products: true } },
    },
  });

  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      key: c.key,
      label: c.label,
      active: c.active,
      sortOrder: c.sortOrder,
      productCount: c._count.products,
    })),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { key?: string; label?: string; active?: boolean; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const label = body.label?.trim();
  const rawKey = body.key?.trim() || (label ? slugify(label) : "");
  const key = rawKey.replace(/[^a-z0-9-]/g, "");
  if (!label || !key) {
    return NextResponse.json({ error: "label and key are required" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { key } });
  if (existing) {
    return NextResponse.json({ error: "A category with this key already exists" }, { status: 409 });
  }

  const sortOrder =
    typeof body.sortOrder === "number"
      ? Math.round(body.sortOrder)
      : ((await prisma.category.aggregate({ _max: { sortOrder: true } }))._max.sortOrder ?? 0) + 1;

  const category = await prisma.category.create({
    data: {
      key,
      label,
      sortOrder,
      active: typeof body.active === "boolean" ? body.active : true,
    },
    include: { _count: { select: { products: true } } },
  });

  return NextResponse.json({
    id: category.id,
    key: category.key,
    label: category.label,
    active: category.active,
    sortOrder: category.sortOrder,
    productCount: category._count.products,
  });
}
