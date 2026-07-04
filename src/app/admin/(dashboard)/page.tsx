import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDateTime, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalOrders, todayOrders, grouped, revenue, recent] = await Promise.all([
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
  ]);

  const countByStatus = new Map(grouped.map((g) => [g.status, g._count._all]));
  const pending =
    (countByStatus.get("VERIFYING") ?? 0) +
    (countByStatus.get("PLACED") ?? 0) +
    (countByStatus.get("PAYMENT_UPLOADED") ?? 0);

  const stats = [
    { label: "Total Orders", value: totalOrders, accent: "text-primary" },
    { label: "Orders Today", value: todayOrders, accent: "text-blue-600" },
    { label: "Pending Verification", value: pending, accent: "text-amber-600" },
    { label: "Revenue (net)", value: formatPrice(revenue._sum.total ?? 0), accent: "text-green" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted">Overview of your store activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {stat.label}
            </div>
            <div className={`mt-2 text-2xl font-bold ${stat.accent}`}>{stat.value}</div>
          </div>
        ))}
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
