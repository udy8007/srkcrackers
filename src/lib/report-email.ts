import "server-only";
import type { OrderStatus, ReportEmailSettings } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { BUSINESS, ORDER_STATUS_LABEL } from "@/lib/constants";
import { getISTParts } from "@/lib/db-backup";
import {
  getEmailSettings,
  resolveAdminNotifyEmail,
  resolveSiteOrigin,
  smtpConfigError,
} from "@/lib/email-settings";
import { sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/utils";
import { createAdminNotification } from "@/lib/notifications";

export const REPORT_EMAIL_SETTINGS_ID = "default";

export type ReportEmailTrigger = "SCHEDULED" | "MANUAL";

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function istWeekday(date = new Date()): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
  }).format(date);
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

export async function getReportEmailSettings(): Promise<ReportEmailSettings> {
  const existing = await prisma.reportEmailSettings.findUnique({
    where: { id: REPORT_EMAIL_SETTINGS_ID },
  });
  if (existing) return existing;

  const email = await getEmailSettings();
  return prisma.reportEmailSettings.create({
    data: {
      id: REPORT_EMAIL_SETTINGS_ID,
      recipientEmail: resolveAdminNotifyEmail(email) || email.fromEmail || BUSINESS.email,
    },
  });
}

/** True when a scheduled report should send now (IST calendar + hour window). */
export function isReportEmailDue(settings: ReportEmailSettings, now = new Date()): boolean {
  if (!settings.enabled) return false;

  const { year, month, day, hour } = getISTParts(now);
  if (hour < settings.runHour) return false;

  const last = settings.lastSentAt ? getISTParts(settings.lastSentAt) : null;
  const sameCalendarDay =
    last && last.year === year && last.month === month && last.day === day;

  switch (settings.frequency) {
    case "DAILY":
      if (sameCalendarDay) return false;
      return true;
    case "WEEKLY": {
      if (istWeekday(now) !== settings.runDayOfWeek) return false;
      if (sameCalendarDay) return false;
      return true;
    }
    case "MONTHLY": {
      if (day !== settings.runDayOfMonth) return false;
      if (sameCalendarDay) return false;
      return true;
    }
    default:
      return false;
  }
}

async function buildReportPayload(rangeDays: number) {
  const days: { start: Date; end: Date; label: string }[] = [];
  for (let i = rangeDays - 1; i >= 0; i -= 1) {
    const start = startOfDay();
    start.setDate(start.getDate() - i);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    days.push({
      start,
      end,
      label: start.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
  }
  const rangeStart = days[0]!.start;

  const revenueWhere = {
    status: { notIn: ["CANCELLED", "PAYMENT_PENDING"] as OrderStatus[] },
  };

  const [orders, statusGroups, revenue, categories, products, orderItems, visits, cityGroups] =
    await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: rangeStart } },
        select: { status: true, total: true, city: true, createdAt: true },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { ...revenueWhere, createdAt: { gte: rangeStart } },
      }),
      prisma.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { id: true, label: true },
      }),
      prisma.product.findMany({ select: { active: true, categoryId: true } }),
      prisma.orderItem.findMany({
        where: {
          order: {
            createdAt: { gte: rangeStart },
            status: { notIn: ["CANCELLED", "PAYMENT_PENDING"] },
          },
        },
        select: {
          name: true,
          qty: true,
          amount: true,
          product: { select: { categoryId: true } },
        },
      }),
      prisma.siteVisit
        .count({ where: { createdAt: { gte: rangeStart } } })
        .catch(() => 0),
      prisma.siteVisit
        .groupBy({
          by: ["city"],
          where: { city: { not: null }, createdAt: { gte: rangeStart } },
          _count: { _all: true },
        })
        .catch(() => []),
    ]);

  const netOrders = orders.filter(
    (o) => o.status !== "CANCELLED" && o.status !== "PAYMENT_PENDING",
  );

  const byStatus = statusGroups
    .map((g) => ({
      label: ORDER_STATUS_LABEL[g.status as OrderStatus] ?? g.status,
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const salesByCat = new Map<string, number>();
  for (const item of orderItems) {
    const id = item.product?.categoryId ?? "__none__";
    salesByCat.set(id, (salesByCat.get(id) ?? 0) + item.amount);
  }
  const categorySales = categories
    .map((c) => ({ label: c.label, amount: salesByCat.get(c.id) ?? 0 }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const topProductsMap = new Map<string, { name: string; qty: number; amount: number }>();
  for (const item of orderItems) {
    const cur = topProductsMap.get(item.name) ?? { name: item.name, qty: 0, amount: 0 };
    cur.qty += item.qty;
    cur.amount += item.amount;
    topProductsMap.set(item.name, cur);
  }
  const topProducts = [...topProductsMap.values()]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8);

  const catalogByCat = categories.map((c) => {
    const rows = products.filter((p) => p.categoryId === c.id);
    return {
      label: c.label,
      active: rows.filter((p) => p.active).length,
      hidden: rows.filter((p) => !p.active).length,
    };
  });

  const topCities = cityGroups
    .filter((g) => g.city)
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 8)
    .map((g) => ({ city: g.city as string, count: g._count._all }));

  return {
    rangeDays,
    revenue: revenue._sum.total ?? 0,
    ordersTotal: orders.length,
    ordersNet: netOrders.length,
    visits,
    byStatus,
    categorySales,
    topProducts,
    catalogByCat,
    topCities,
    productsActive: products.filter((p) => p.active).length,
    productsHidden: products.filter((p) => !p.active).length,
  };
}

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function tableHtml(headers: string[], rows: string[][]) {
  if (!rows.length) {
    return `<p style="color:#6e5f5f;font-size:13px;margin:8px 0">No data in this period.</p>`;
  }
  return `
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin:8px 0 16px">
      <thead>
        <tr>
          ${headers
            .map(
              (h) =>
                `<th style="text-align:left;padding:8px;border-bottom:1px solid #e8ddd3;color:#6e5f5f;font-size:11px;text-transform:uppercase">${esc(h)}</th>`,
            )
            .join("")}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r) =>
              `<tr>${r
                .map(
                  (c, i) =>
                    `<td style="padding:8px;border-bottom:1px solid #f0e8e0;${i === r.length - 1 ? "text-align:right;font-weight:700;color:#9d0208" : ""}">${c}</td>`,
                )
                .join("")}</tr>`,
          )
          .join("")}
      </tbody>
    </table>`;
}

function buildReportEmailHtml(
  settings: ReportEmailSettings,
  data: Awaited<ReturnType<typeof buildReportPayload>>,
  trigger: ReportEmailTrigger,
) {
  const origin = resolveSiteOrigin();
  const sections: string[] = [];

  sections.push(`
    <div style="display:flex;flex-wrap:wrap;gap:12px;margin:16px 0 24px">
      <div style="flex:1;min-width:120px;background:#f0fdf4;border-radius:12px;padding:14px">
        <div style="font-size:11px;color:#6e5f5f;text-transform:uppercase;font-weight:700">Revenue</div>
        <div style="font-size:22px;font-weight:800;color:#15803d;margin-top:4px">${esc(formatPrice(data.revenue))}</div>
      </div>
      <div style="flex:1;min-width:120px;background:#fff5f0;border-radius:12px;padding:14px">
        <div style="font-size:11px;color:#6e5f5f;text-transform:uppercase;font-weight:700">Orders</div>
        <div style="font-size:22px;font-weight:800;color:#9d0208;margin-top:4px">${data.ordersNet}</div>
        <div style="font-size:11px;color:#6e5f5f">${data.ordersTotal} total placed</div>
      </div>
      <div style="flex:1;min-width:120px;background:#f0f9ff;border-radius:12px;padding:14px">
        <div style="font-size:11px;color:#6e5f5f;text-transform:uppercase;font-weight:700">Visits</div>
        <div style="font-size:22px;font-weight:800;color:#0369a1;margin-top:4px">${data.visits}</div>
      </div>
    </div>
  `);

  if (settings.includeSales) {
    sections.push(`<h2 style="font-size:16px;color:#2b1f1f;margin:20px 0 8px">Sales by category</h2>`);
    sections.push(
      tableHtml(
        ["Category", "Amount"],
        data.categorySales.map((c) => [esc(c.label), esc(formatPrice(c.amount))]),
      ),
    );
    sections.push(`<h2 style="font-size:16px;color:#2b1f1f;margin:20px 0 8px">Top products</h2>`);
    sections.push(
      tableHtml(
        ["Product", "Qty", "Amount"],
        data.topProducts.map((p) => [esc(p.name), String(p.qty), esc(formatPrice(p.amount))]),
      ),
    );
  }

  if (settings.includeOrders) {
    sections.push(`<h2 style="font-size:16px;color:#2b1f1f;margin:20px 0 8px">Orders by status (all time)</h2>`);
    sections.push(
      tableHtml(
        ["Status", "Count"],
        data.byStatus.map((s) => [esc(s.label), String(s.count)]),
      ),
    );
  }

  if (settings.includeCatalog) {
    sections.push(`<h2 style="font-size:16px;color:#2b1f1f;margin:20px 0 8px">Catalog by category</h2>`);
    sections.push(
      tableHtml(
        ["Category", "Active", "Hidden"],
        data.catalogByCat.map((c) => [esc(c.label), String(c.active), String(c.hidden)]),
      ),
    );
  }

  if (settings.includeTraffic) {
    sections.push(`<h2 style="font-size:16px;color:#2b1f1f;margin:20px 0 8px">Top visitor cities</h2>`);
    sections.push(
      tableHtml(
        ["City", "Visits"],
        data.topCities.map((c) => [esc(c.city), String(c.count)]),
      ),
    );
  }

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f8f4f0;font-family:Segoe UI,system-ui,sans-serif;color:#2b1f1f">
  <div style="max-width:640px;margin:0 auto;padding:24px">
    <div style="background:#9d0208;color:#fff;border-radius:16px 16px 0 0;padding:20px 24px">
      <div style="font-size:12px;opacity:.85;text-transform:uppercase;letter-spacing:.08em">${esc(BUSINESS.name)}</div>
      <h1 style="margin:6px 0 0;font-size:22px">Business report</h1>
      <p style="margin:8px 0 0;opacity:.9;font-size:13px">Last ${data.rangeDays} days · ${trigger === "MANUAL" ? "Manual send" : "Scheduled"} · IST</p>
    </div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:20px 24px;border:1px solid #e8ddd3;border-top:0">
      ${sections.join("\n")}
      <p style="margin:24px 0 0;font-size:13px">
        <a href="${esc(origin)}/admin/reports" style="color:#9d0208;font-weight:700">Open full Reports →</a>
      </p>
      <p style="margin:16px 0 0;font-size:11px;color:#6e5f5f">
        Configure schedule in Admin → Reports → Email report settings.
      </p>
    </div>
  </div>
</body></html>`;
}

export async function sendBusinessReportEmail(
  trigger: ReportEmailTrigger = "MANUAL",
): Promise<{ ok: boolean; error?: string; recipient?: string }> {
  const settings = await getReportEmailSettings();
  const emailSettings = await getEmailSettings();
  const recipient =
    settings.recipientEmail.trim() || resolveAdminNotifyEmail(emailSettings);

  if (!recipient) {
    return { ok: false, error: "No recipient email configured" };
  }

  const smtpError = smtpConfigError(emailSettings);
  if (smtpError) {
    await prisma.reportEmailSettings.update({
      where: { id: REPORT_EMAIL_SETTINGS_ID },
      data: { lastStatus: "FAILED", lastError: smtpError },
    });
    return { ok: false, error: smtpError };
  }

  if (!emailSettings.enabled && trigger === "SCHEDULED") {
    return { ok: false, error: "SMTP email sending is disabled in Settings" };
  }

  const rangeDays =
    settings.frequency === "DAILY" ? 1 : settings.frequency === "WEEKLY" ? 7 : 30;

  try {
    const data = await buildReportPayload(rangeDays);
    const html = buildReportEmailHtml(settings, data, trigger);
    const freqLabel =
      settings.frequency === "DAILY"
        ? "Daily"
        : settings.frequency === "WEEKLY"
          ? "Weekly"
          : "Monthly";

    const result = await sendEmail({
      to: recipient,
      subject: `${freqLabel} report — ${BUSINESS.name} (${formatPrice(data.revenue)})`,
      html,
      trigger: "REPORT_EMAIL",
      force: trigger === "MANUAL",
    });

    if (!result.ok) {
      await prisma.reportEmailSettings.update({
        where: { id: REPORT_EMAIL_SETTINGS_ID },
        data: {
          lastStatus: "FAILED",
          lastError: result.error ?? "Send failed",
        },
      });
      return { ok: false, error: result.error, recipient };
    }

    await prisma.reportEmailSettings.update({
      where: { id: REPORT_EMAIL_SETTINGS_ID },
      data: {
        lastSentAt: new Date(),
        lastStatus: "SENT",
        lastError: null,
      },
    });

    if (settings.notifyPush !== false) {
      const reportsUrl = `${resolveSiteOrigin()}/admin/reports`;
      await createAdminNotification({
        type: "REPORT_READY",
        title: `${freqLabel} report ready`,
        message: `Revenue ${formatPrice(data.revenue)} · ${data.ordersNet} orders · tap to open Reports`,
        targetUrl: reportsUrl,
        pushTitle: `${BUSINESS.name} — ${freqLabel} report`,
        pushBody: `Revenue ${formatPrice(data.revenue)}. Open Reports for details.`,
      });
    }

    return { ok: true, recipient };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Report send failed";
    await prisma.reportEmailSettings.update({
      where: { id: REPORT_EMAIL_SETTINGS_ID },
      data: { lastStatus: "FAILED", lastError: message },
    });
    return { ok: false, error: message, recipient };
  }
}

export async function runScheduledReportEmailIfDue(): Promise<{
  ran: boolean;
  ok?: boolean;
  error?: string;
}> {
  const settings = await getReportEmailSettings();
  if (!isReportEmailDue(settings)) {
    return { ran: false };
  }
  const result = await sendBusinessReportEmail("SCHEDULED");
  return { ran: true, ok: result.ok, error: result.error };
}
