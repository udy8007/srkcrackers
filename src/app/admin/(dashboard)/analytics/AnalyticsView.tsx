"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/utils";

interface AnalyticsData {
  totalVisits: number;
  todayVisits: number;
  topCities: { city: string; count: number }[];
  dailyVisits: { date: string; count: number }[];
  recentVisits: {
    id: string;
    path: string;
    city: string | null;
    region: string | null;
    country: string | null;
    createdAt: string;
  }[];
}

function locationLabel(city: string | null, region: string | null, country: string | null) {
  const parts = [city, region, country].filter(Boolean);
  return parts.length ? parts.join(", ") : "Unknown";
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-ink-muted">Loading analytics...</p>;
  }

  if (!data) {
    return <p className="text-red">Failed to load analytics.</p>;
  }

  const maxDaily = Math.max(...data.dailyVisits.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Analytics</h1>
        <p className="text-sm text-ink-muted">Storefront visitor traffic and geography</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total Visits" value={data.totalVisits} accent="text-purple-600" />
        <StatCard label="Visits Today" value={data.todayVisits} accent="text-indigo-600" />
      </div>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Last 14 Days</h2>
        <div className="flex items-end gap-1.5" style={{ height: 120 }}>
          {data.dailyVisits.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[0.65rem] font-semibold text-primary">{day.count || ""}</span>
              <div
                className="w-full rounded-t bg-primary/80 transition-all"
                style={{ height: `${Math.max((day.count / maxDaily) * 90, day.count ? 4 : 1)}px` }}
                title={`${day.date}: ${day.count} visits`}
              />
              <span className="text-[0.6rem] text-ink-muted">
                {new Date(day.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">Top Cities</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">City</th>
                  <th className="px-5 py-3 text-right font-semibold">Visits</th>
                </tr>
              </thead>
              <tbody>
                {data.topCities.map((row) => (
                  <tr key={row.city} className="border-b border-line last:border-0 hover:bg-brandbg">
                    <td className="px-5 py-3 font-medium">{row.city}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">{row.count}</td>
                  </tr>
                ))}
                {data.topCities.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-5 py-8 text-center text-ink-muted">
                      No city data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-white shadow-sm">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">Recent Visits</h2>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Page</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.recentVisits.map((v) => (
                  <tr key={v.id} className="border-b border-line last:border-0 hover:bg-brandbg">
                    <td className="px-5 py-3">
                      {locationLabel(v.city, v.region, v.country)}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-ink-muted">{v.path}</td>
                    <td className="px-5 py-3 text-ink-muted">{formatDateTime(v.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${accent}`}>{value}</div>
    </div>
  );
}
