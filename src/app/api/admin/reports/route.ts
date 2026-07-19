import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/constants";
import type { OrderStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: { date: string; label: string; start: Date; end: Date }[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = startOfDay();
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    days.push({
      date: dayKey(start),
      label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      start,
      end,
    });
  }
  return days;
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const daysParam = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const rangeDays = [7, 14, 30, 90].includes(daysParam) ? daysParam : 30;
  const days = lastNDays(rangeDays);
  const rangeStart = days[0]!.start;
  const today = startOfDay();

  const revenueWhere = {
    status: { notIn: ["CANCELLED", "PAYMENT_PENDING"] as OrderStatus[] },
  };

  const [
    ordersInRange,
    orderStatusGroups,
    allRevenue,
    rangeRevenue,
    todayRevenue,
    categories,
    products,
    orderItems,
    visitsInRange,
    cityGroups,
    totalVisits,
    todayVisits,
  ] = await Promise.all([
    prisma.order.findMany({
      where: { createdAt: { gte: rangeStart } },
      select: {
        id: true,
        status: true,
        total: true,
        city: true,
        createdAt: true,
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({ _sum: { total: true }, where: revenueWhere }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { ...revenueWhere, createdAt: { gte: rangeStart } },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { ...revenueWhere, createdAt: { gte: today } },
    }),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, key: true, label: true, active: true },
    }),
    prisma.product.findMany({
      select: { id: true, name: true, active: true, categoryId: true, price: true },
    }),
    prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: { gte: rangeStart },
          status: { notIn: ["CANCELLED", "PAYMENT_PENDING"] },
        },
      },
      select: {
        productId: true,
        name: true,
        qty: true,
        amount: true,
        product: { select: { categoryId: true } },
      },
    }),
    prisma.siteVisit
      .findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { createdAt: true, city: true },
      })
      .catch(() => [] as { createdAt: Date; city: string | null }[]),
    prisma.siteVisit
      .groupBy({
        by: ["city"],
        where: { city: { not: null } },
        _count: { _all: true },
      })
      .catch(() => []),
    prisma.siteVisit.count().catch(() => 0),
    prisma.siteVisit.count({ where: { createdAt: { gte: today } } }).catch(() => 0),
  ]);

  // —— Sales / orders daily ——
  const daily = days.map((d) => {
    const inDay = ordersInRange.filter((o) => {
      const t = o.createdAt.getTime();
      return t >= d.start.getTime() && t < d.end.getTime();
    });
    const revenue = inDay
      .filter((o) => o.status !== "CANCELLED" && o.status !== "PAYMENT_PENDING")
      .reduce((s, o) => s + o.total, 0);
    return {
      date: d.date,
      label: d.label,
      orders: inDay.length,
      revenue,
    };
  });

  const byStatus = ORDER_STATUSES.map((s) => ({
    key: s.key,
    label: ORDER_STATUS_LABEL[s.key],
    count: orderStatusGroups.find((g) => g.status === s.key)?._count._all ?? 0,
  })).filter((s) => s.count > 0);

  // —— Orders by city ——
  const cityOrderMap = new Map<string, { orders: number; revenue: number }>();
  for (const o of ordersInRange) {
    if (o.status === "CANCELLED" || o.status === "PAYMENT_PENDING") continue;
    const city = o.city?.trim() || "Unknown";
    const cur = cityOrderMap.get(city) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += o.total;
    cityOrderMap.set(city, cur);
  }
  const ordersByCity = [...cityOrderMap.entries()]
    .map(([city, v]) => ({ city, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // —— Catalog by category ——
  const productsByCat = new Map<string, { active: number; hidden: number }>();
  for (const p of products) {
    const cur = productsByCat.get(p.categoryId) ?? { active: 0, hidden: 0 };
    if (p.active) cur.active += 1;
    else cur.hidden += 1;
    productsByCat.set(p.categoryId, cur);
  }

  const salesByCat = new Map<string, { qty: number; amount: number }>();
  const topProductsMap = new Map<string, { name: string; qty: number; amount: number; categoryId: string | null }>();
  for (const item of orderItems) {
    const categoryId = item.product?.categoryId ?? "__uncategorized__";
    const cat = salesByCat.get(categoryId) ?? { qty: 0, amount: 0 };
    cat.qty += item.qty;
    cat.amount += item.amount;
    salesByCat.set(categoryId, cat);

    const key = item.productId ?? item.name;
    const prod = topProductsMap.get(key) ?? {
      name: item.name,
      qty: 0,
      amount: 0,
      categoryId: item.product?.categoryId ?? null,
    };
    prod.qty += item.qty;
    prod.amount += item.amount;
    topProductsMap.set(key, prod);
  }

  const categoryReport = categories.map((c) => {
    const stock = productsByCat.get(c.id) ?? { active: 0, hidden: 0 };
    const sales = salesByCat.get(c.id) ?? { qty: 0, amount: 0 };
    return {
      id: c.id,
      key: c.key,
      label: c.label,
      active: c.active,
      productActive: stock.active,
      productHidden: stock.hidden,
      soldQty: sales.qty,
      soldAmount: sales.amount,
    };
  });

  const topProducts = [...topProductsMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 12)
    .map((p) => ({
      name: p.name,
      qty: p.qty,
      amount: p.amount,
      categoryLabel: categories.find((c) => c.id === p.categoryId)?.label ?? "Uncategorized",
    }));

  // —— Traffic ——
  const dailyVisits = days.map((d) => {
    const count = visitsInRange.filter((v) => {
      const t = v.createdAt.getTime();
      return t >= d.start.getTime() && t < d.end.getTime();
    }).length;
    return { date: d.date, label: d.label, count };
  });

  const topCities = cityGroups
    .filter((g) => g.city)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 10)
    .map((g) => ({ city: g.city as string, count: g._count._all }));

  const rangeOrderCount = ordersInRange.length;
  const rangeNetOrders = ordersInRange.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "PAYMENT_PENDING",
  ).length;

  return NextResponse.json({
    rangeDays,
    summary: {
      revenueAllTime: allRevenue._sum.total ?? 0,
      revenueRange: rangeRevenue._sum.total ?? 0,
      revenueToday: todayRevenue._sum.total ?? 0,
      ordersRange: rangeOrderCount,
      ordersNetRange: rangeNetOrders,
      productsActive: products.filter((p) => p.active).length,
      productsHidden: products.filter((p) => !p.active).length,
      totalVisits,
      todayVisits,
    },
    sales: {
      daily,
      byCategory: categoryReport
        .filter((c) => c.soldAmount > 0 || c.soldQty > 0)
        .sort((a, b) => b.soldAmount - a.soldAmount),
      topProducts,
    },
    orders: {
      byStatus,
      byCity: ordersByCity,
      daily: daily.map((d) => ({ date: d.date, label: d.label, count: d.orders })),
    },
    catalog: {
      byCategory: categoryReport.map((c) => ({
        id: c.id,
        label: c.label,
        active: c.productActive,
        hidden: c.productHidden,
        total: c.productActive + c.productHidden,
      })),
    },
    traffic: {
      dailyVisits,
      topCities,
    },
  });
}
