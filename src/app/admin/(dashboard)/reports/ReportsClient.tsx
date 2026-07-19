"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cn, formatPrice } from "@/lib/utils";

type Section = "sales" | "orders" | "catalog" | "traffic";

interface ReportsData {
  rangeDays: number;
  summary: {
    revenueAllTime: number;
    revenueRange: number;
    revenueToday: number;
    ordersRange: number;
    ordersNetRange: number;
    productsActive: number;
    productsHidden: number;
    totalVisits: number;
    todayVisits: number;
  };
  sales: {
    daily: { date: string; label: string; orders: number; revenue: number }[];
    byCategory: {
      id: string;
      label: string;
      soldQty: number;
      soldAmount: number;
      productActive: number;
    }[];
    topProducts: { name: string; qty: number; amount: number; categoryLabel: string }[];
  };
  orders: {
    byStatus: { key: string; label: string; count: number }[];
    byCity: { city: string; orders: number; revenue: number }[];
    daily: { date: string; label: string; count: number }[];
  };
  catalog: {
    byCategory: { id: string; label: string; active: number; hidden: number; total: number }[];
  };
  traffic: {
    dailyVisits: { date: string; label: string; count: number }[];
    topCities: { city: string; count: number }[];
  };
}

const SECTIONS: { key: Section; label: string; hint: string }[] = [
  { key: "sales", label: "Sales", hint: "Revenue & top products by category" },
  { key: "orders", label: "Orders", hint: "Volume, status mix, cities" },
  { key: "catalog", label: "Catalog", hint: "Products per category" },
  { key: "traffic", label: "Traffic", hint: "Storefront visits & cities" },
];

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

const STATUS_COLORS = [
  "bg-amber-500",
  "bg-blue-500",
  "bg-green",
  "bg-primary",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-indigo-500",
  "bg-slate-500",
  "bg-red",
];

function BarChart({
  items,
  valueKey,
  labelKey,
  formatValue,
  colorClass = "bg-gradient-to-t from-primary to-[#e85d04]",
  height = 160,
}: {
  items: Record<string, string | number>[];
  valueKey: string;
  labelKey: string;
  formatValue?: (n: number) => string;
  colorClass?: string;
  height?: number;
}) {
  const max = Math.max(...items.map((i) => Number(i[valueKey]) || 0), 1);
  return (
    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const h = Math.max((value / max) * 100, value ? 6 : 2);
        return (
          <div key={String(item[labelKey])} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="max-w-full truncate text-[0.65rem] font-bold tabular-nums text-ink">
              {value ? (formatValue ? formatValue(value) : value) : ""}
            </span>
            <div className="flex w-full flex-1 items-end justify-center">
              <div
                className={`w-full max-w-[2.25rem] rounded-t-md ${colorClass}`}
                style={{ height: `${h}%` }}
                title={`${item[labelKey]}: ${value}`}
              />
            </div>
            <span className="max-w-full truncate text-[0.6rem] text-ink-muted">{item[labelKey]}</span>
          </div>
        );
      })}
    </div>
  );
}

function HBarList({
  rows,
}: {
  rows: { label: string; value: number; display: string; color?: string }[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-ink-muted">No data in this range.</p>;
  }
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-sm">
            <span className="min-w-0 truncate font-medium text-ink">{row.label}</span>
            <span className="shrink-0 font-bold tabular-nums text-ink">{row.display}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-brandbg">
            <div
              className={`h-full rounded-full ${row.color ?? "bg-gradient-to-r from-primary to-[#e85d04]"}`}
              style={{ width: `${Math.max((row.value / max) * 100, 4)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: string;
}) {
  return (
    <div className={`rounded-2xl border border-line bg-gradient-to-br ${tone} p-4 shadow-sm`}>
      <p className="text-[0.7rem] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}

export function ReportsClient() {
  const [section, setSection] = useState<Section>("sales");
  const [rangeDays, setRangeDays] = useState<number>(30);
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reports?days=${rangeDays}`);
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error ?? "Could not load reports.");
        return;
      }
      setData(payload);
    } catch {
      setError("Network error while loading reports.");
    } finally {
      setLoading(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setCategoryFilter("all");
  }, [section, rangeDays]);

  const categoryOptions = useMemo(() => {
    if (!data) return [];
    if (section === "sales") {
      return data.sales.byCategory.map((c) => ({ id: c.id, label: c.label }));
    }
    if (section === "catalog") {
      return data.catalog.byCategory.map((c) => ({ id: c.id, label: c.label }));
    }
    return [];
  }, [data, section]);

  const filteredTopProducts = useMemo(() => {
    if (!data) return [];
    if (categoryFilter === "all") return data.sales.topProducts;
    const label = data.sales.byCategory.find((c) => c.id === categoryFilter)?.label;
    if (!label) return data.sales.topProducts;
    return data.sales.topProducts.filter((p) => p.categoryLabel === label);
  }, [data, categoryFilter]);

  const filteredCategorySales = useMemo(() => {
    if (!data) return [];
    if (categoryFilter === "all") return data.sales.byCategory;
    return data.sales.byCategory.filter((c) => c.id === categoryFilter);
  }, [data, categoryFilter]);

  const filteredCatalog = useMemo(() => {
    if (!data) return [];
    if (categoryFilter === "all") return data.catalog.byCategory;
    return data.catalog.byCategory.filter((c) => c.id === categoryFilter);
  }, [data, categoryFilter]);

  const sectionMeta = SECTIONS.find((s) => s.key === section)!;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Reports</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Graphical business reports — sales, orders, catalog, and traffic.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border border-line bg-white p-0.5 shadow-sm">
            {RANGE_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setRangeDays(d)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition",
                  rangeDays === d
                    ? "bg-primary text-white"
                    : "text-ink-muted hover:text-primary",
                )}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="rounded-lg border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-brandbg disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Sub-category tabs */}
      <div className="rounded-2xl border border-line bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setSection(s.key)}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-left transition",
                section === s.key
                  ? "border-primary bg-primary text-white shadow-sm"
                  : "border-line bg-white text-ink hover:border-primary/40",
              )}
            >
              <span className="block text-sm font-bold">{s.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[0.7rem]",
                  section === s.key ? "text-white/80" : "text-ink-muted",
                )}
              >
                {s.hint}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red/20 bg-red/5 px-4 py-3 text-sm text-red">{error}</p>
      ) : loading || !data ? (
        <p className="rounded-xl border border-line bg-white px-4 py-10 text-center text-sm text-ink-muted">
          Loading reports…
        </p>
      ) : (
        <>
          {/* Summary KPIs for current range */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Revenue (range)"
              value={formatPrice(data.summary.revenueRange)}
              hint={`Today ${formatPrice(data.summary.revenueToday)}`}
              tone="from-emerald-50 to-white"
            />
            <StatCard
              label="Orders (range)"
              value={String(data.summary.ordersRange)}
              hint={`${data.summary.ordersNetRange} net (excl. cancelled/pending)`}
              tone="from-[#fff5f0] to-white"
            />
            <StatCard
              label="Catalog live"
              value={String(data.summary.productsActive)}
              hint={`${data.summary.productsHidden} hidden`}
              tone="from-[#fff8ee] to-white"
            />
            <StatCard
              label="Visits (today)"
              value={String(data.summary.todayVisits)}
              hint={`${data.summary.totalVisits} all time`}
              tone="from-sky-50 to-white"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink">{sectionMeta.label}</h2>
              <p className="text-xs text-ink-muted">
                Last {data.rangeDays} days · {sectionMeta.hint}
              </p>
            </div>
            {(section === "sales" || section === "catalog") && categoryOptions.length > 0 && (
              <label className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
                Category
                <select
                  className="input w-auto min-w-[10rem] py-1.5 text-sm font-medium text-ink"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All categories</option>
                  {categoryOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {section === "sales" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Daily revenue
                </h3>
                <BarChart
                  items={data.sales.daily}
                  valueKey="revenue"
                  labelKey="label"
                  formatValue={(n) => (n >= 1000 ? `₹${Math.round(n / 1000)}k` : `₹${n}`)}
                  height={180}
                />
              </section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Sales by category
                </h3>
                <HBarList
                  rows={filteredCategorySales.map((c) => ({
                    label: c.label,
                    value: c.soldAmount,
                    display: `${formatPrice(c.soldAmount)} · ${c.soldQty} pcs`,
                  }))}
                />
              </section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Top products
                </h3>
                <HBarList
                  rows={filteredTopProducts.map((p) => ({
                    label: `${p.name} (${p.categoryLabel})`,
                    value: p.amount,
                    display: `${formatPrice(p.amount)} · ×${p.qty}`,
                  }))}
                />
              </section>
            </div>
          )}

          {section === "orders" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Daily order count
                </h3>
                <BarChart
                  items={data.orders.daily}
                  valueKey="count"
                  labelKey="label"
                  colorClass="bg-gradient-to-t from-sky-600 to-sky-400"
                  height={180}
                />
              </section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  By status (all time)
                </h3>
                <HBarList
                  rows={data.orders.byStatus
                    .slice()
                    .sort((a, b) => b.count - a.count)
                    .map((s, i) => ({
                      label: s.label,
                      value: s.count,
                      display: String(s.count),
                      color: STATUS_COLORS[i % STATUS_COLORS.length],
                    }))}
                />
              </section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  By city (range)
                </h3>
                <HBarList
                  rows={data.orders.byCity.map((c) => ({
                    label: c.city,
                    value: c.revenue,
                    display: `${formatPrice(c.revenue)} · ${c.orders} orders`,
                  }))}
                />
              </section>
            </div>
          )}

          {section === "catalog" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Products per category
                </h3>
                <BarChart
                  items={filteredCatalog.map((c) => ({
                    label: c.label.length > 10 ? `${c.label.slice(0, 9)}…` : c.label,
                    total: c.total,
                    full: c.label,
                  }))}
                  valueKey="total"
                  labelKey="label"
                  colorClass="bg-gradient-to-t from-[#c45c26] to-amber-400"
                  height={180}
                />
              </section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Active vs hidden by category
                </h3>
                <HBarList
                  rows={filteredCatalog.map((c) => ({
                    label: c.label,
                    value: c.total,
                    display: `${c.active} live · ${c.hidden} hidden`,
                    color: "bg-green",
                  }))}
                />
              </section>
            </div>
          )}

          {section === "traffic" && (
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Daily visits
                </h3>
                <BarChart
                  items={data.traffic.dailyVisits}
                  valueKey="count"
                  labelKey="label"
                  colorClass="bg-gradient-to-t from-indigo-600 to-sky-400"
                  height={180}
                />
              </section>
              <section className="rounded-2xl border border-line bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="mb-4 font-display text-base font-semibold text-ink">
                  Top cities (all time)
                </h3>
                <HBarList
                  rows={data.traffic.topCities.map((c) => ({
                    label: c.city,
                    value: c.count,
                    display: String(c.count),
                    color: "bg-sky-500",
                  }))}
                />
              </section>
            </div>
          )}
        </>
      )}
    </div>
  );
}
