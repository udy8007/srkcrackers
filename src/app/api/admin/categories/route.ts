import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

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
