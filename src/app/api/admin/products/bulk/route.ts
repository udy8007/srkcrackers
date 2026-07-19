import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
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
    await writeAuditLog({
      actor: actorFromSession(session.user),
      action: "PRODUCT_BULK_DELETE",
      entityType: "product",
      summary: `Bulk deleted ${result.count} product(s)`,
      metadata: { count: result.count, ids },
    });
    return NextResponse.json({ count: result.count });
  }

  const active = action === "enable";
  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { active },
  });
  invalidateCatalogCache();
  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: active ? "PRODUCT_BULK_ENABLE" : "PRODUCT_BULK_DISABLE",
    entityType: "product",
    summary: `Bulk ${active ? "enabled" : "disabled"} ${result.count} product(s)`,
    metadata: { count: result.count, ids },
  });
  return NextResponse.json({ count: result.count });
}
