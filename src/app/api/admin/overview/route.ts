import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { dispatchSchedulerTick } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  dispatchSchedulerTick("overview");

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [grouped, todayCount, revenue, productStats, categories, activeProductRows, pendingEnquiries, todayEnquiries] =
    await Promise.all([
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ["CANCELLED", "PAYMENT_PENDING"] } },
      }),
      prisma.product.groupBy({ by: ["active"], _count: { _all: true } }),
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, key: true, label: true, active: true },
      }),
      prisma.product.findMany({
        where: { active: true },
        select: { categoryId: true },
      }),
      prisma.enquiry.count({ where: { status: "PENDING" } }),
      prisma.enquiry.count({ where: { createdAt: { gte: startOfToday } } }),
    ]);

  const byStatus = Object.fromEntries(grouped.map((g) => [g.status, g._count._all]));
  const activeProducts = productStats.find((p) => p.active)?._count._all ?? 0;
  const hiddenProducts = productStats.find((p) => !p.active)?._count._all ?? 0;
  const activeCountByCategory = new Map<string, number>();
  for (const row of activeProductRows) {
    const categoryId = String((row as { categoryId: string }).categoryId);
    activeCountByCategory.set(categoryId, (activeCountByCategory.get(categoryId) ?? 0) + 1);
  }

  return NextResponse.json({
    orders: {
      total: grouped.reduce((s, g) => s + g._count._all, 0),
      today: todayCount,
      byStatus,
      revenue: revenue._sum.total ?? 0,
      pending:
        (byStatus.PLACED ?? 0) + (byStatus.PAYMENT_UPLOADED ?? 0) + (byStatus.VERIFYING ?? 0),
      abandoned: byStatus.PAYMENT_PENDING ?? 0,
    },
    products: { active: activeProducts, hidden: hiddenProducts, total: activeProducts + hiddenProducts },
    enquiries: {
      pending: pendingEnquiries,
      today: todayEnquiries,
    },
    categories: categories.map((c) => ({
      id: c.id,
      key: c.key,
      label: c.label,
      active: c.active,
      activeProducts: activeCountByCategory.get(c.id) ?? 0,
    })),
  });
}
