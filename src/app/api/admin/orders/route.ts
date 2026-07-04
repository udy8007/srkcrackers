import { NextRequest, NextResponse } from "next/server";
import type { OrderStatus, Prisma } from "@prisma/client";
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
  const take = Math.min(Number(searchParams.get("take")) || 50, 100);
  const skip = Math.max(Number(searchParams.get("skip")) || 0, 0);

  const where: Prisma.OrderWhereInput = {};
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

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take,
      skip,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        phone: true,
        city: true,
        state: true,
        total: true,
        status: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    total,
    orders: orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      phone: order.phone,
      city: order.city,
      state: order.state,
      total: order.total,
      status: order.status,
      itemCount: order._count.items,
      createdAt: order.createdAt.toISOString(),
    })),
  });
}
