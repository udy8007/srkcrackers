import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 50)));

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        orderId: true,
        trigger: true,
        recipient: true,
        subject: true,
        status: true,
        error: true,
        createdAt: true,
      },
    }),
    prisma.emailLog.count(),
  ]);

  return NextResponse.json({
    logs: logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
    })),
    total,
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.emailLog.deleteMany();
  return NextResponse.json({ ok: true, deleted: result.count });
}
