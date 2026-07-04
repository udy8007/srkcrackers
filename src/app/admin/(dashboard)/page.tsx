import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

function locationLabel(city: string | null, region: string | null, country: string | null) {
  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown location";
}

export default async function DashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, grouped, revenue, recent, totalVisits, todayVisits, recentVisits, cityGroups, productCounts] =
    await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { notIn: ["CANCELLED"] } },
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
          take: 10,
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
    ]);

  const countByStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  const pending =
    (countByStatus.get("VERIFYING") ?? 0) +
    (countByStatus.get("PLACED") ?? 0) +
    (countByStatus.get("PAYMENT_UPLOADED") ?? 0);

  const topCities = cityGroups
    .filter((g) => g.city)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8);

  const activeProducts = productCounts.find((p) => p.active)?._count._all ?? 0;
  const hiddenProducts = productCounts.find((p) => !p.active)?._count._all ?? 0;

  const stats = [
    { label: "Total Orders", value: totalOrders, accent: "text-primary" },
    { label: "Orders Today", value: todayOrders, accent: "text-blue-600" },
    { label: "Pending Verification", value: pending, accent: "text-amber-600" },
    { label: "Revenue (net)", value: formatPrice(revenue._sum.total ?? 0), accent: "text-green" },
    { label: "Active Products", value: activeProducts, accent: "text-orange-600" },
    { label: "Visits Today", value: todayVisits, accent: "text-indigo-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Orders, catalog, and storefront analytics at a glance</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <QuickLink href="/admin/orders?status=VERIFYING" label={`Review pending (${pending})`} />
        <QuickLink href="/admin/products" label="Manage products" />
        <QuickLink href="/admin/categories" label="Categories" />
        <QuickLink href="/admin/analytics" label="Full analytics →" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {stat.label}
            </div>
            <div className={`mt-2 text-2xl font-bold ${stat.accent}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-line bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Order Status</h2>
          <ul className="space-y-2">
            {grouped
              .sort((a, b) => b._count._all - a._count._all)
              .map((g) => (
                <li key={g.status} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/admin/orders?status=${g.status}`}
                    className="font-medium text-ink hover:text-primary"
                  >
                    {g.status.replace(/_/g, " ")}
                  </Link>
                  <span className="font-bold text-primary">{g._count._all}</span>
                </li>
              ))}
            {grouped.length === 0 && (
              <li className="text-sm text-ink-muted">No orders yet.</li>
            )}
          </ul>
        </section>

        <section className="rounded-xl border border-line bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Catalog</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Active products</span>
              <span className="font-bold text-green">{activeProducts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Hidden products</span>
              <span className="font-bold text-ink-muted">{hiddenProducts}</span>
            </div>
            <div className="flex justify-between border-t border-line pt-3">
              <span className="text-ink-muted">Total visits</span>
              <span className="font-bold text-purple-600">{totalVisits}</span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm lg:col-span-1">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">Top Visitor Cities</h2>
            <p className="text-xs text-ink-muted">Based on storefront visits (geo from hosting provider)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 font-semibold text-right">Visits</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((row) => (
                  <tr key={row.city} className="border-b border-line last:border-0 hover:bg-brandbg">
                    <td className="px-5 py-3 font-medium">{row.city}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{row._count._all}</td>
                  </tr>
                ))}
                {topCities.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-ink-muted">
                      No visit data yet. Visits are recorded when customers open the storefront.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Visits</h2>
            <p className="text-xs text-ink-muted">City and time of latest storefront visitors</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {recentVisits.map((visit, i) => (
                  <tr key={i} className="border-b border-line last:border-0 hover:bg-brandbg">
                    <td className="px-5 py-3">
                      {locationLabel(visit.city, visit.region, visit.country)}
                    </td>
                    <td className="px-5 py-3 text-ink-muted">{formatDateTime(visit.createdAt)}</td>
                  </tr>
                ))}
                {recentVisits.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-ink-muted">
                      No visits recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="rounded-xl border border-line bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold text-ink">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-primary hover:underline">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
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
                <tr key={order.id} className="border-b border-line last:border-0 hover:bg-brandbg">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-mono font-semibold text-primary hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{order.customerName}</td>
                  <td className="px-5 py-3 font-semibold">{formatPrice(order.total)}</td>
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
      </div>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-line bg-white px-4 py-1.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
    >
      {label}
    </Link>
  );
}
