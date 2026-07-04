import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }],
    include: { category: { select: { key: true, label: true } } },
  });

  return NextResponse.json({
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      pack: product.pack,
      price: product.price,
      mrp: product.mrp,
      active: product.active,
      imageUrl: product.imageUrl,
      description: product.description,
      categoryKey: product.category.key,
      categoryLabel: product.category.label,
    })),
  });
}
