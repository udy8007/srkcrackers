import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import type { AuditEntityType } from "@/lib/audit-log";

export const dynamic = "force-dynamic";

const ENTITY_TYPES: AuditEntityType[] = [
  "product",
  "order",
  "category",
  "settings",
  "account",
  "system",
  "review",
];

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(Math.floor(n), max);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entityTypeParam = searchParams.get("entityType")?.trim() ?? "all";
  const action = searchParams.get("action")?.trim() ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const page = parsePositiveInt(searchParams.get("page"), 1, 10_000);
  const pageSize = parsePositiveInt(searchParams.get("pageSize"), 25, 100);
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = {};
  if (entityTypeParam !== "all" && ENTITY_TYPES.includes(entityTypeParam as AuditEntityType)) {
    where.entityType = entityTypeParam;
  }
  if (action) where.action = action;
  if (q) {
    where.OR = [
      { summary: { contains: q, mode: "insensitive" } },
      { actorEmail: { contains: q, mode: "insensitive" } },
      { actorName: { contains: q, mode: "insensitive" } },
      { entityId: { contains: q, mode: "insensitive" } },
      { action: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total, allCount, ...entityCounts] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.count(),
    ...ENTITY_TYPES.map((entityType) => prisma.auditLog.count({ where: { entityType } })),
  ]);

  const counts: Record<string, number> = { all: allCount };
  ENTITY_TYPES.forEach((entityType, i) => {
    counts[entityType] = entityCounts[i] ?? 0;
  });

  return NextResponse.json({
    items: items.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorEmail: row.actorEmail,
      actorName: row.actorName,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      summary: row.summary,
      metadata: row.metadata,
      createdAt: row.createdAt.toISOString(),
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts,
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.auditLog.deleteMany();
  return NextResponse.json({ ok: true, deleted: result.count });
}
