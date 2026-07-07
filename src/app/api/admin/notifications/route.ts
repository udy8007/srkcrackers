import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unreadOnly = request.nextUrl.searchParams.get("unread") === "true";
  const limit = Math.min(50, Number(request.nextUrl.searchParams.get("limit") ?? 20));

  const [notifications, unreadCount] = await Promise.all([
    prisma.adminNotification.findMany({
      where: unreadOnly ? { read: false } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.adminNotification.count({ where: { read: false } }),
  ]);

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      orderId: n.orderId,
      orderNumber: n.orderNumber,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { ids?: string[]; markAllRead?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.markAllRead) {
    await prisma.adminNotification.updateMany({
      where: { read: false },
      data: { read: true },
    });
    return NextResponse.json({ ok: true });
  }

  if (!body.ids?.length) {
    return NextResponse.json({ error: "ids or markAllRead required" }, { status: 400 });
  }

  await prisma.adminNotification.updateMany({
    where: { id: { in: body.ids } },
    data: { read: true },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.adminNotification.deleteMany();
  return NextResponse.json({ ok: true, deleted: result.count });
}
