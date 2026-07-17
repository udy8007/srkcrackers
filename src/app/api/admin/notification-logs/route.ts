import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Channel = "all" | "email" | "push" | "inapp";

function parseChannel(value: string | null): Channel {
  return value === "email" || value === "push" || value === "inapp" ? value : "all";
}

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(1, Math.floor(parsed)));
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = parsePositiveInt(request.nextUrl.searchParams.get("page"), 1, 10_000);
  const pageSize = parsePositiveInt(request.nextUrl.searchParams.get("pageSize"), 25, 100);
  const channel = parseChannel(request.nextUrl.searchParams.get("channel"));
  const offset = (page - 1) * pageSize;

  const includeEmail = channel === "all" || channel === "email";
  const includePush = channel === "all" || channel === "push";
  const includeInApp = channel === "all" || channel === "inapp";

  const [emails, emailCount, pushes, pushCount, inApps, inAppCount] = await Promise.all([
    includeEmail
      ? prisma.emailLog.findMany({
          orderBy: { createdAt: "desc" },
          take: offset + pageSize,
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
        })
      : [],
    includeEmail ? prisma.emailLog.count() : 0,
    includePush
      ? prisma.adminPushLog.findMany({
          orderBy: { createdAt: "desc" },
          take: offset + pageSize,
          select: {
            id: true,
            type: true,
            title: true,
            body: true,
            targetUrl: true,
            orderId: true,
            orderNumber: true,
            status: true,
            sent: true,
            failed: true,
            removed: true,
            error: true,
            createdAt: true,
          },
        })
      : [],
    includePush ? prisma.adminPushLog.count() : 0,
    includeInApp
      ? prisma.adminNotification.findMany({
          orderBy: { createdAt: "desc" },
          take: offset + pageSize,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            orderId: true,
            orderNumber: true,
            read: true,
            createdAt: true,
          },
        })
      : [],
    includeInApp ? prisma.adminNotification.count() : 0,
  ]);

  const items = [
    ...emails.map((log) => ({
      id: `email:${log.id}`,
      channel: "email" as const,
      type: log.trigger,
      title: log.subject,
      message: log.recipient,
      orderId: log.orderId,
      orderNumber: null,
      status: log.status,
      targetUrl: log.orderId ? `/admin/orders/${log.orderId}` : null,
      meta: `To ${log.recipient}`,
      error: log.error,
      createdAt: log.createdAt.toISOString(),
    })),
    ...pushes.map((log) => ({
      id: `push:${log.id}`,
      channel: "push" as const,
      type: log.type,
      title: log.title,
      message: log.body,
      orderId: log.orderId,
      orderNumber: log.orderNumber,
      status: log.status,
      targetUrl: log.targetUrl,
      meta: `${log.sent} sent, ${log.failed} failed, ${log.removed} removed`,
      error: log.error,
      createdAt: log.createdAt.toISOString(),
    })),
    ...inApps.map((log) => ({
      id: `inapp:${log.id}`,
      channel: "inapp" as const,
      type: log.type,
      title: log.title,
      message: log.message,
      orderId: log.orderId,
      orderNumber: log.orderNumber,
      status: log.read ? "READ" : "UNREAD",
      targetUrl: log.orderId ? `/admin/orders/${log.orderId}` : null,
      meta: log.orderNumber ? `Order ${log.orderNumber}` : "Admin bell",
      error: null,
      createdAt: log.createdAt.toISOString(),
    })),
  ]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(offset, offset + pageSize);

  const total = emailCount + pushCount + inAppCount;

  return NextResponse.json({
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    counts: {
      email: emailCount,
      push: pushCount,
      inapp: inAppCount,
      all: total,
    },
  });
}
