import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { label?: string; active?: boolean; sortOrder?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: { label?: string; active?: boolean; sortOrder?: number } = {};
  if (typeof body.label === "string" && body.label.trim()) data.label = body.label.trim();
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.sortOrder === "number") data.sortOrder = Math.round(body.sortOrder);

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  try {
    const category = await prisma.category.update({
      where: { id },
      data,
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
  } catch {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}
