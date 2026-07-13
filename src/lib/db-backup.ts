import "server-only";
import { gzipSync } from "node:zlib";
import type { BackupSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";
import { getEmailSettings, resolveSiteOrigin } from "@/lib/email-settings";
import { sendEmailWithAttachment } from "@/lib/email";
import { createAdminNotification } from "@/lib/notifications";

export const BACKUP_SETTINGS_ID = "default";
const MAX_ATTACHMENT_BYTES = 18 * 1024 * 1024; // ~18 MB — safe for most SMTP providers

export type BackupTrigger = "SCHEDULED" | "MANUAL";

export interface BackupExportMeta {
  exportedAt: string;
  app: string;
  version: string;
  includeScreenshots: boolean;
  tableCounts: Record<string, number>;
}

export interface BackupExport {
  meta: BackupExportMeta;
  data: Record<string, unknown[]>;
}

/** Current date/time parts in India (IST). */
export function getISTParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
  };
}

export async function getBackupSettings(): Promise<BackupSettings> {
  const existing = await prisma.backupSettings.findUnique({
    where: { id: BACKUP_SETTINGS_ID },
  });
  if (existing) return existing;

  const email = await getEmailSettings();
  return prisma.backupSettings.create({
    data: {
      id: BACKUP_SETTINGS_ID,
      recipientEmail: email.adminNotifyEmail || email.fromEmail,
    },
  });
}

export function isBackupDue(settings: BackupSettings, now = new Date()): boolean {
  if (!settings.enabled) return false;

  const { year, month, day } = getISTParts(now);
  const last = settings.lastBackupAt ? getISTParts(settings.lastBackupAt) : null;

  // Vercel Hobby cron runs once per day (~2:00 AM IST). Hour is informational in admin UI.
  switch (settings.frequency) {
    case "DAILY":
      if (!last) return true;
      return last.year !== year || last.month !== month || last.day !== day;
    case "MONTHLY":
      if (day !== settings.runDayOfMonth) return false;
      if (!last) return true;
      return last.year !== year || last.month !== month;
    case "YEARLY":
      if (month !== settings.runMonth || day !== settings.runDayOfYear) return false;
      if (!last) return true;
      return last.year !== year;
    default:
      return false;
  }
}

function stripScreenshots<T extends { paymentScreenshot?: string | null }>(rows: T[]): T[] {
  return rows.map((row) => ({
    ...row,
    paymentScreenshot: row.paymentScreenshot ? "[EXCLUDED — enable in backup settings]" : null,
  }));
}

/** Export all application tables to a JSON document. */
export async function exportDatabase(includeScreenshots: boolean): Promise<BackupExport> {
  const [
    adminUsers,
    categories,
    products,
    orders,
    orderItems,
    orderStatusHistory,
    siteVisits,
    emailSettings,
    emailLogs,
    adminNotifications,
    backupSettings,
    dbBackupLogs,
  ] = await Promise.all([
    prisma.adminUser.findMany(),
    prisma.category.findMany(),
    prisma.product.findMany(),
    prisma.order.findMany(),
    prisma.orderItem.findMany(),
    prisma.orderStatusHistory.findMany(),
    prisma.siteVisit.findMany(),
    prisma.emailSettings.findMany(),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.adminNotification.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.backupSettings.findMany(),
    prisma.dbBackupLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }),
  ]);

  const safeEmailSettings = emailSettings.map((s) => ({
    ...s,
    password: s.password ? "[REDACTED]" : "",
  }));

  const orderData = includeScreenshots ? orders : stripScreenshots(orders);

  const data: Record<string, unknown[]> = {
    adminUsers,
    categories,
    products,
    orders: orderData,
    orderItems,
    orderStatusHistory,
    siteVisits,
    emailSettings: safeEmailSettings,
    emailLogs,
    adminNotifications,
    backupSettings,
    dbBackupLogs,
  };

  const tableCounts = Object.fromEntries(
    Object.entries(data).map(([key, rows]) => [key, rows.length]),
  );

  return {
    meta: {
      exportedAt: new Date().toISOString(),
      app: BUSINESS.name,
      version: "1.0",
      includeScreenshots,
      tableCounts,
    },
    data,
  };
}

function buildBackupFilename(now = new Date()) {
  const { year, month, day, hour } = getISTParts(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `srkcrackers-db-${year}${pad(month)}${pad(day)}-${pad(hour)}00-ist.json.gz`;
}

function buildBackupEmailHtml(meta: BackupExportMeta, filename: string, sizeMb: string) {
  const rows = Object.entries(meta.tableCounts)
    .map(([table, count]) => `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${table}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${count}</td></tr>`)
    .join("");

  return `
    <h2 style="margin-top:0;color:#9d0208">Database Backup</h2>
    <p>Your scheduled database backup for <strong>${BUSINESS.name}</strong> is attached.</p>
    <div style="background:#fff8f2;border-radius:8px;padding:16px;margin:16px 0">
      <p><strong>File:</strong> ${filename}</p>
      <p><strong>Size:</strong> ${sizeMb} MB</p>
      <p><strong>Exported:</strong> ${new Date(meta.exportedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
      <p><strong>Payment screenshots:</strong> ${meta.includeScreenshots ? "Included" : "Excluded (smaller file)"}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#fff4d6"><th style="padding:8px 10px;text-align:left">Table</th><th style="padding:8px 10px;text-align:right">Rows</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:#6e5f5f;margin-top:20px">Store this file securely. It contains business and customer data.</p>
  `;
}

export async function runDatabaseBackup(
  trigger: BackupTrigger,
  options?: { recipientOverride?: string },
): Promise<{ ok: boolean; error?: string; filename?: string; sizeBytes?: number }> {
  const settings = await getBackupSettings();
  const emailSettings = await getEmailSettings();

  if (trigger === "SCHEDULED" && !settings.enabled) {
    return { ok: false, error: "Scheduled backup is disabled" };
  }

  const recipient =
    options?.recipientOverride?.trim() ||
    settings.recipientEmail.trim() ||
    emailSettings.adminNotifyEmail.trim() ||
    emailSettings.fromEmail.trim();

  if (!recipient) {
    return { ok: false, error: "No backup recipient email configured" };
  }

  if (!emailSettings.host || !emailSettings.username || !emailSettings.password) {
    return { ok: false, error: "SMTP is not configured — set up email in Settings first" };
  }

  const exportData = await exportDatabase(settings.includeScreenshots);
  const json = JSON.stringify(exportData, null, 2);
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  const filename = buildBackupFilename();

  if (compressed.byteLength > MAX_ATTACHMENT_BYTES) {
    const error = `Backup too large (${(compressed.byteLength / 1024 / 1024).toFixed(1)} MB). Disable payment screenshots or clear old data.`;
    await logBackup({
      filename,
      sizeBytes: compressed.byteLength,
      tableCounts: exportData.meta.tableCounts,
      status: "FAILED",
      trigger,
      recipient,
      error,
    });
    await updateBackupStatus(settings.id, "FAILED", error);
    await createAdminNotification({
      type: "DB_BACKUP",
      title: "Database backup failed",
      message: error,
      targetUrl: `${resolveSiteOrigin()}/admin/settings`,
      pushTitle: "Database backup failed",
      pushBody: error.slice(0, 180),
    });
    return { ok: false, error };
  }

  const sizeMb = (compressed.byteLength / 1024 / 1024).toFixed(2);
  const subject = `SRK Crackers DB Backup — ${filename}`;
  const html = buildBackupEmailHtml(exportData.meta, filename, sizeMb);

  const result = await sendEmailWithAttachment({
    to: recipient,
    subject,
    html,
    trigger: "DB_BACKUP",
    force: true,
    attachments: [
      {
        filename,
        content: compressed,
        contentType: "application/gzip",
      },
    ],
  });

  await logBackup({
    filename,
    sizeBytes: compressed.byteLength,
    tableCounts: exportData.meta.tableCounts,
    status: result.ok ? "SENT" : "FAILED",
    trigger,
    recipient,
    error: result.error,
  });

  await updateBackupStatus(settings.id, result.ok ? "SENT" : "FAILED", result.error);

  await createAdminNotification({
    type: "DB_BACKUP",
    title: result.ok ? "Database backup sent" : "Database backup failed",
    message: result.ok
      ? `${filename} (${sizeMb} MB) emailed to ${recipient}`
      : result.error ?? "Backup email failed",
    targetUrl: `${resolveSiteOrigin()}/admin/settings`,
    pushTitle: result.ok ? "Database backup sent" : "Database backup failed",
    pushBody: result.ok
      ? `${filename} (${sizeMb} MB)`
      : (result.error ?? "Backup email failed").slice(0, 180),
  });

  return result.ok
    ? { ok: true, filename, sizeBytes: compressed.byteLength }
    : { ok: false, error: result.error };
}

async function logBackup(input: {
  filename: string;
  sizeBytes: number;
  tableCounts: Record<string, number>;
  status: string;
  trigger: string;
  recipient: string;
  error?: string;
}) {
  await prisma.dbBackupLog.create({
    data: {
      filename: input.filename,
      sizeBytes: input.sizeBytes,
      tableCounts: JSON.stringify(input.tableCounts),
      status: input.status,
      trigger: input.trigger,
      recipient: input.recipient,
      error: input.error,
    },
  });
}

async function updateBackupStatus(id: string, status: string, error?: string) {
  await prisma.backupSettings.update({
    where: { id },
    data: {
      lastBackupAt: new Date(),
      lastBackupStatus: status,
      lastBackupError: error ?? null,
    },
  });
}

/** Called from daily Vercel cron — runs backup when schedule matches. */
export async function runScheduledBackupIfDue(): Promise<{ ran: boolean; ok?: boolean; error?: string }> {
  const settings = await getBackupSettings();
  if (!isBackupDue(settings)) {
    return { ran: false };
  }

  const result = await runDatabaseBackup("SCHEDULED");
  return { ran: true, ok: result.ok, error: result.error };
}
