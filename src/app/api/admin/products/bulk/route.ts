import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { invalidateCatalogCache } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; action?: "enable" | "disable" | "delete" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { ids, action } = body;
  if (!ids?.length || !action) {
    return NextResponse.json({ error: "ids and action required" }, { status: 400 });
  }

  if (action === "delete") {
    const result = await prisma.product.deleteMany({ where: { id: { in: ids } } });
    invalidateCatalogCache();
    return NextResponse.json({ count: result.count });
  }

  const active = action === "enable";
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { active },
  });
  invalidateCatalogCache();
  return NextResponse.json({ count: result.count });
}
