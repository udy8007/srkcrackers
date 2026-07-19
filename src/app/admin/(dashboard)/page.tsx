import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ORDER_STATUSES } from "@/lib/constants";
import { formatDateTime, formatPrice } from "@/lib/utils";
import type { OrderStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const STATUS_BAR: Record<OrderStatus, string> = {
  PAYMENT_PENDING: "bg-orange-400",
  PLACED: "bg-slate-400",
  PAYMENT_UPLOADED: "bg-blue-500",
  VERIFYING: "bg-amber-500",
  CONFIRMED: "bg-indigo-500",
  PROCESSING: "bg-fuchsia-500",
  DISPATCHED: "bg-cyan-500",
  DELIVERED: "bg-green",
  CANCELLED: "bg-red",
};

function locationLabel(city: string | null, region: string | null, country: string | null) {
  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown location";
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function lastNDays(n: number) {
  const days: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    days.push({
      key: dayKey(start),
      label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      start,
      end,
    });
  }
  return days;
}

export default async function DashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekDays = lastNDays(7);
  const weekStart = weekDays[0]!.start;

  const [
    totalOrders,
    todayOrders,
    grouped,
    revenue,
    recent,
    totalVisits,
    todayVisits,
    recentVisits,
    cityGroups,
    productCounts,
    weekOrders,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { notIn: ["CANCELLED", "PAYMENT_PENDING"] } },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.siteVisit.count().catch(() => 0),
    prisma.siteVisit.count({ where: { createdAt: { gte: startOfToday } } }).catch(() => 0),
    prisma.siteVisit
      .findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        select: { city: true, region: true, country: true, path: true, createdAt: true },
      })
      .catch(() => []),
    prisma.siteVisit
      .groupBy({
        by: ["city"],
        where: { city: { not: null } },
        _count: { _all: true },
      })
      .catch(() => []),
    prisma.product.groupBy({ by: ["active"], _count: { _all: true } }),
    prisma.order.findMany({
      where: { createdAt: { gte: weekStart } },
      select: { createdAt: true, total: true, status: true },
    }),
  ]);

  const countByStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  const pending =
    (countByStatus.get("VERIFYING") ?? 0) +
    (countByStatus.get("PLACED") ?? 0) +
    (countByStatus.get("PAYMENT_UPLOADED") ?? 0);
  const abandoned = countByStatus.get("PAYMENT_PENDING") ?? 0;

  const topCities = cityGroups
    .filter((g) => g.city)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 6);
  const maxCity = Math.max(...topCities.map((c) => c._count._all), 1);

  const activeProducts = productCounts.find((p) => p.active)?._count._all ?? 0;
  const hiddenProducts = productCounts.find((p) => !p.active)?._count._all ?? 0;
  const catalogTotal = activeProducts + hiddenProducts || 1;
  const activePct = Math.round((activeProducts / catalogTotal) * 100);

  const ordersByDay = weekDays.map((day) => {
    const count = weekOrders.filter((o) => {
      const t = o.createdAt.getTime();
      return t >= day.start.getTime() && t < day.end.getTime();
    }).length;
    return { ...day, count };
  });
  const maxDayOrders = Math.max(...ordersByDay.map((d) => d.count), 1);

  const statusRows = ORDER_STATUSES.map((s) => ({
    key: s.key,
    label: s.label,
    count: countByStatus.get(s.key) ?? 0,
  })).filter((s) => s.count > 0);
  const maxStatus = Math.max(...statusRows.map((s) => s.count), 1);

  const netRevenue = revenue._sum.total ?? 0;

  const kpis = [
    {
      label: "Orders today",
      value: String(todayOrders),
      hint: `${totalOrders} all time`,
      tone: "from-[#fff5f0] to-white",
      bar: "bg-primary",
      href: "/admin/orders",
    },
    {
      label: "Needs attention",
      value: String(pending),
      hint: "Verify / confirm",
      tone: "from-amber-50 to-white",
      bar: "bg-amber-500",
      href: "/admin/orders?status=VERIFYING",
    },
    {
      label: "Incomplete checkouts",
      value: String(abandoned),
      hint: "Payment not finished",
      tone: "from-orange-50 to-white",
      bar: "bg-orange-500",
      href: "/admin/orders?status=PAYMENT_PENDING",
    },
    {
      label: "Net revenue",
      value: formatPrice(netRevenue),
      hint: "Excl. cancelled / pending",
      tone: "from-emerald-50 to-white",
      bar: "bg-green",
      href: "/admin/orders",
    },
    {
      label: "Visits today",
      value: String(todayVisits),
      hint: `${totalVisits} total visits`,
      tone: "from-sky-50 to-white",
      bar: "bg-sky-500",
      href: "/admin/analytics",
    },
    {
      label: "Live catalog",
      value: String(activeProducts),
      hint: `${hiddenProducts} hidden`,
      tone: "from-[#fff8ee] to-white",
      bar: "bg-[#c45c26]",
      href: "/admin/products",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted">Live snapshot of orders, traffic, and catalog health</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <QuickLink href="/admin/orders?status=VERIFYING" label={`Review pending (${pending})`} hot />
          <QuickLink href="/admin/analytics" label="Full analytics" />
          <QuickLink href="/admin/products" label="Products" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <Link
            key={kpi.label}
            href={kpi.href}
            className={`group relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br ${kpi.tone} p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md`}
          >
            <div className={`absolute inset-y-0 left-0 w-1 ${kpi.bar}`} />
            <p className="pl-2 text-[0.7rem] font-bold uppercase tracking-wide text-ink-muted">
              {kpi.label}
            </p>
            <p className="mt-1 pl-2 font-display text-2xl font-bold tracking-tight text-ink">
              {kpi.value}
            </p>
            <p className="mt-1 pl-2 text-xs text-ink-muted group-hover:text-primary">{kpi.hint}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        {/* 7-day orders chart */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm xl:col-span-3">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Orders — last 7 days</h2>
              <p className="text-xs text-ink-muted">Daily order volume</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
              {weekOrders.length} total
            </span>
          </div>
          <div className="flex h-44 items-end gap-2 sm:gap-3">
            {ordersByDay.map((day) => {
              const h = Math.max((day.count / maxDayOrders) * 100, day.count ? 8 : 2);
              return (
                <div key={day.key} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-bold tabular-nums text-ink">
                    {day.count || ""}
                  </span>
                  <div className="flex h-28 w-full items-end justify-center">
                    <div
                      className="w-full max-w-[2.5rem] rounded-t-lg bg-gradient-to-t from-primary to-[#e85d04] shadow-sm transition"
                      style={{ height: `${h}%` }}
                      title={`${day.label}: ${day.count} orders`}
                    />
                  </div>
                  <span className="truncate text-[0.65rem] font-medium text-ink-muted">{day.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Catalog donut */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Catalog health</h2>
          <p className="mb-4 text-xs text-ink-muted">Active vs hidden products</p>
          <div className="flex items-center gap-6">
            <div
              className="relative h-32 w-32 shrink-0 rounded-full"
              style={{
                background: `conic-gradient(#15803d 0% ${activePct}%, #e7e0d8 ${activePct}% 100%)`,
              }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-white shadow-inner">
                <span className="font-display text-2xl font-bold text-ink">{activePct}%</span>
                <span className="text-[0.65rem] font-semibold uppercase text-ink-muted">Live</span>
              </div>
            </div>
            <div className="min-w-0 flex-1 space-y-3 text-sm">
              <LegendRow color="bg-green" label="Active" value={activeProducts} />
              <LegendRow color="bg-[#e7e0d8]" label="Hidden" value={hiddenProducts} />
              <LegendRow color="bg-primary" label="Visits today" value={todayVisits} />
              <Link
                href="/admin/products"
                className="inline-block text-xs font-bold text-primary hover:underline"
              >
                Manage catalog →
              </Link>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Order status bars */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Orders by status</h2>
              <p className="text-xs text-ink-muted">Click a row to filter orders</p>
            </div>
          </div>
          {statusRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">No orders yet.</p>
          ) : (
            <ul className="space-y-3">
              {statusRows
                .sort((a, b) => b.count - a.count)
                .map((row) => (
                  <li key={row.key}>
                    <Link href={`/admin/orders?status=${row.key}`} className="group block">
                      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-ink group-hover:text-primary">
                          {row.label}
                        </span>
                        <span className="font-bold tabular-nums text-ink">{row.count}</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-brandbg">
                        <div
                          className={`h-full rounded-full ${STATUS_BAR[row.key]} transition-all`}
                          style={{ width: `${Math.max((row.count / maxStatus) * 100, 4)}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>

        {/* Top cities bars */}
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Top visitor cities</h2>
              <p className="text-xs text-ink-muted">Storefront traffic by city</p>
            </div>
            <Link href="/admin/analytics" className="text-xs font-bold text-primary hover:underline">
              Analytics →
            </Link>
          </div>
          {topCities.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">
              No visit data yet. Visits are recorded when customers open the storefront.
            </p>
          ) : (
            <ul className="space-y-3">
              {topCities.map((row, i) => (
                <li key={row.city}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                    <span className="flex items-center gap-2 font-medium text-ink">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[0.65rem] font-bold text-primary">
                        {i + 1}
                      </span>
                      {row.city}
                    </span>
                    <span className="font-bold tabular-nums text-primary">{row._count._all}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-brandbg">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-[#e85d04]"
                      style={{ width: `${Math.max((row._count._all / maxCity) * 100, 4)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent orders */}
        <section className="rounded-2xl border border-line bg-white shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">Recent orders</h2>
              <p className="text-xs text-ink-muted">Latest customer placements</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((order) => (
                  <tr key={order.id} className="border-b border-line last:border-0 hover:bg-brandbg/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono font-semibold text-primary hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-medium">{order.customerName}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums">{formatPrice(order.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{formatDateTime(order.createdAt)}</td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-ink-muted">
                      No orders yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Live visits feed */}
        <section className="rounded-2xl border border-line bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">Live visits</h2>
            <p className="text-xs text-ink-muted">Latest storefront activity</p>
          </div>
          <ul className="divide-y divide-line">
            {recentVisits.map((visit, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sm">
                  📍
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {locationLabel(visit.city, visit.region, visit.country)}
                  </p>
                  <p className="text-xs text-ink-muted">{formatDateTime(visit.createdAt)}</p>
                </div>
              </li>
            ))}
            {recentVisits.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-ink-muted">No visits recorded yet.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-ink-muted">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        {label}
      </span>
      <span className="font-bold tabular-nums text-ink">{value}</span>
    </div>
  );
}

function QuickLink({ href, label, hot }: { href: string; label: string; hot?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${
        hot
          ? "border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-500"
          : "border-line bg-white text-ink hover:border-primary hover:text-primary"
      }`}
    >
      {label}
    </Link>
  );
}
