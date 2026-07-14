import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(ORDER_STATUSES.map((s) => s.key));

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statusParam = searchParams.get("status") ?? "";
  const q = searchParams.get("q")?.trim() ?? "";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const take = Math.min(Number(searchParams.get("take")) || 50, 200);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const where: Record<string, unknown> = {};
  if (statusParam && VALID_STATUSES.has(statusParam as OrderStatus)) {
    where.status = statusParam as OrderStatus;
  }
  if (q) {
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { phone: { contains: q } },
      { customerName: { contains: q, mode: "insensitive" } },
    ];
  }
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) createdAt.gte = new Date(from);
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }
    where.createdAt = createdAt;
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
    }),
    prisma.order.count({ where }),
  ]);

  const withCounts = await Promise.all(
    orders.map(async (order) => {
      const itemCount = await prisma.orderItem.count({ where: { orderId: order.id } });
      return { order, itemCount };
    }),
  );

  return NextResponse.json({
    total,
    orders: withCounts.map(({ order, itemCount }) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      city: order.city,
      state: order.state,
      total: order.total,
      status: order.status,
      itemCount,
      createdAt: order.createdAt.toISOString(),
    })),
  });
}
