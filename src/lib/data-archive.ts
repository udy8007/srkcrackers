import "server-only";
import { gzipSync } from "node:zlib";
import type { ArchiveSettings } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";
import { getISTParts } from "@/lib/db-backup";
import { getEmailSettings, resolveSiteOrigin } from "@/lib/email-settings";
import { sendEmailWithAttachment } from "@/lib/email";
import { createAdminNotification } from "@/lib/notifications";

export const ARCHIVE_SETTINGS_ID = "default";
const MAX_ATTACHMENT_BYTES = 18 * 1024 * 1024;

export type ArchiveTrigger = "SCHEDULED" | "MANUAL";

export interface ArchiveExportMeta {
  exportedAt: string;
  app: string;
  retentionMonths: number;
  cutoffBefore: string;
  recordCounts: Record<string, number>;
}

export interface ArchiveExport {
  meta: ArchiveExportMeta;
  data: Record<string, unknown[]>;
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

/** First instant of the earliest calendar month kept in the database (IST). */
export function getRetentionCutoff(retentionMonths: number, now = new Date()): Date {
  const { year, month } = getISTParts(now);
  let keepFromMonth = month - retentionMonths + 1;
  let keepFromYear = year;
  while (keepFromMonth <= 0) {
    keepFromMonth += 12;
    keepFromYear -= 1;
  }
  // Midnight IST on the 1st of keepFromMonth
  const istDate = new Date(
    Date.UTC(keepFromYear, keepFromMonth - 1, 1, 0, 0, 0) - 5.5 * 60 * 60 * 1000,
  );
  return istDate;
}

export function formatCutoffLabel(cutoff: Date): string {
  return cutoff.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "short",
    timeStyle: "medium",
  });
}

export function buildCronFromSettings(settings: Pick<
  ArchiveSettings,
  "frequency" | "runHour" | "runDayOfWeek" | "runDayOfMonth"
>): string {
  const h = settings.runHour;
  switch (settings.frequency) {
    case "DAILY":
      return `0 ${h} * * *`;
    case "WEEKLY":
      return `0 ${h} * * ${settings.runDayOfWeek}`;
    case "MONTHLY":
      return `0 ${h} ${settings.runDayOfMonth} * *`;
    default:
      return `0 ${h} 1 * *`;
  }
}

export function parseCronToSettings(cron: string): Partial<
  Pick<ArchiveSettings, "frequency" | "runHour" | "runDayOfWeek" | "runDayOfMonth">
> | null {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5) return null;
  const [, hourPart, domPart, , dowPart] = parts;
  if (!/^\d+$/.test(hourPart ?? "")) return null;
  const hour = Number(hourPart);
  if (hour < 0 || hour > 23) return null;

  if (domPart !== "*" && /^\d+$/.test(domPart)) {
    const dom = Number(domPart);
    if (dom >= 1 && dom <= 28) {
      return { frequency: "MONTHLY", runHour: hour, runDayOfMonth: dom, runDayOfWeek: 0 };
    }
  }
  if (dowPart !== "*" && /^\d+$/.test(dowPart)) {
    const dow = Number(dowPart);
    if (dow >= 0 && dow <= 6) {
      return { frequency: "WEEKLY", runHour: hour, runDayOfWeek: dow, runDayOfMonth: 1 };
    }
  }
  if (domPart === "*" && dowPart === "*") {
    return { frequency: "DAILY", runHour: hour, runDayOfWeek: 0, runDayOfMonth: 1 };
  }
  return null;
}

export function describeCronPreview(
  settings: Pick<
    ArchiveSettings,
    "frequency" | "runHour" | "runDayOfWeek" | "runDayOfMonth" | "cronExpression"
  >,
): string {
  const cron = settings.cronExpression || buildCronFromSettings(settings);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hourLabel = `${pad(settings.runHour % 12 || 12)}:${pad(0)} ${settings.runHour >= 12 ? "PM" : "AM"}`;

  switch (settings.frequency) {
    case "DAILY":
      return `Daily at ${hourLabel} IST — cron: ${cron}`;
    case "WEEKLY": {
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      return `${days[settings.runDayOfWeek]} at ${hourLabel} IST — cron: ${cron}`;
    }
    case "MONTHLY":
      return `Monthly on day ${settings.runDayOfMonth} at ${hourLabel} IST — cron: ${cron}`;
    default:
      return cron;
  }
}

export async function getArchiveSettings(): Promise<ArchiveSettings> {
  const existing = await prisma.archiveSettings.findUnique({
    where: { id: ARCHIVE_SETTINGS_ID },
  });
  if (existing) return existing;

  const email = await getEmailSettings();
  return prisma.archiveSettings.create({
    data: {
      id: ARCHIVE_SETTINGS_ID,
      recipientEmail: email.adminNotifyEmail || email.fromEmail,
    },
  });
}

export function isArchiveDue(settings: ArchiveSettings, now = new Date()): boolean {
  if (!settings.enabled || !settings.emailExportEnabled) return false;

  const { year, month, day, hour } = getISTParts(now);
  if (hour < settings.runHour) return false;

  const last = settings.lastArchiveAt ? getISTParts(settings.lastArchiveAt) : null;
  const sameCalendarDay =
    last && last.year === year && last.month === month && last.day === day;

  switch (settings.frequency) {
    case "DAILY":
      return !sameCalendarDay;
    case "WEEKLY":
      if (istWeekday(now) !== settings.runDayOfWeek) return false;
      return !sameCalendarDay;
    case "MONTHLY":
      if (day !== settings.runDayOfMonth) return false;
      return !sameCalendarDay;
    default:
      return false;
  }
}

function sqlEscape(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

function rowsToSqlInserts(table: string, rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return `-- ${table}: no rows\n`;
  const columns = Object.keys(rows[0]!);
  const header = `-- ${table} (${rows.length} rows)\n`;
  const values = rows
    .map((row) => {
      const vals = columns.map((col) => sqlEscape(row[col])).join(", ");
      return `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${vals});`;
    })
    .join("\n");
  return `${header}${values}\n`;
}

async function collectArchiveData(
  settings: ArchiveSettings,
  cutoff: Date,
): Promise<{ exportData: ArchiveExport; sql: string }> {
  const data: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  if (settings.includeSiteVisits) {
    const rows = await prisma.siteVisit.findMany({
      where: { createdAt: { lt: cutoff } },
    });
    data.siteVisits = rows;
    counts.siteVisits = rows.length;
  }

  if (settings.includeAuditLogs) {
    const rows = await prisma.auditLog.findMany({
      where: { createdAt: { lt: cutoff } },
    });
    data.auditLogs = rows;
    counts.auditLogs = rows.length;
  }

  if (settings.includeErrorLogs) {
    const [emailErrors, pushErrors] = await Promise.all([
      prisma.emailLog.findMany({
        where: { createdAt: { lt: cutoff }, error: { not: null } },
      }),
      prisma.adminPushLog.findMany({
        where: { createdAt: { lt: cutoff }, error: { not: null } },
      }),
    ]);
    data.errorEmailLogs = emailErrors;
    data.errorPushLogs = pushErrors;
    counts.errorEmailLogs = emailErrors.length;
    counts.errorPushLogs = pushErrors.length;
  }

  if (settings.includeNotificationLog) {
    const [emailLogs, pushLogs, notifications] = await Promise.all([
      prisma.emailLog.findMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.adminPushLog.findMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.adminNotification.findMany({ where: { createdAt: { lt: cutoff } } }),
    ]);
    data.emailLogs = emailLogs;
    data.pushLogs = pushLogs;
    data.adminNotifications = notifications;
    counts.emailLogs = emailLogs.length;
    counts.pushLogs = pushLogs.length;
    counts.adminNotifications = notifications.length;
  }

  const meta: ArchiveExportMeta = {
    exportedAt: new Date().toISOString(),
    app: BUSINESS.name,
    retentionMonths: settings.retentionMonths,
    cutoffBefore: cutoff.toISOString(),
    recordCounts: counts,
  };

  const exportData: ArchiveExport = { meta, data };

  let sql = `-- SRK Crackers data archive\n-- Cutoff before: ${meta.cutoffBefore}\n\n`;
  if (data.siteVisits) sql += rowsToSqlInserts("SiteVisit", data.siteVisits as Record<string, unknown>[]);
  if (data.auditLogs) sql += rowsToSqlInserts("AuditLog", data.auditLogs as Record<string, unknown>[]);
  if (data.errorEmailLogs) sql += rowsToSqlInserts("EmailLog", data.errorEmailLogs as Record<string, unknown>[]);
  if (data.errorPushLogs) sql += rowsToSqlInserts("AdminPushLog", data.errorPushLogs as Record<string, unknown>[]);
  if (data.emailLogs) sql += rowsToSqlInserts("EmailLog", data.emailLogs as Record<string, unknown>[]);
  if (data.pushLogs) sql += rowsToSqlInserts("AdminPushLog", data.pushLogs as Record<string, unknown>[]);
  if (data.adminNotifications) {
    sql += rowsToSqlInserts("AdminNotification", data.adminNotifications as Record<string, unknown>[]);
  }

  return { exportData, sql };
}

async function purgeArchivedData(settings: ArchiveSettings, cutoff: Date): Promise<void> {
  if (settings.includeSiteVisits) {
    await prisma.siteVisit.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }
  if (settings.includeAuditLogs) {
    await prisma.auditLog.deleteMany({ where: { createdAt: { lt: cutoff } } });
  }
  if (settings.includeNotificationLog) {
    await Promise.all([
      prisma.emailLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.adminPushLog.deleteMany({ where: { createdAt: { lt: cutoff } } }),
      prisma.adminNotification.deleteMany({ where: { createdAt: { lt: cutoff } } }),
    ]);
  } else if (settings.includeErrorLogs) {
    await Promise.all([
      prisma.emailLog.deleteMany({ where: { createdAt: { lt: cutoff }, error: { not: null } } }),
      prisma.adminPushLog.deleteMany({ where: { createdAt: { lt: cutoff }, error: { not: null } } }),
    ]);
  }
}

function buildArchiveFilename(now = new Date()) {
  const { year, month, day, hour } = getISTParts(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `srkcrackers-archive-${year}${pad(month)}${pad(day)}-${pad(hour)}00-ist.json.gz`;
}

function buildArchiveEmailHtml(meta: ArchiveExportMeta, filename: string, sizeMb: string) {
  const rows = Object.entries(meta.recordCounts)
    .map(
      ([entity, count]) =>
        `<tr><td style="padding:6px 10px;border-bottom:1px solid #eee">${entity}</td><td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${count}</td></tr>`,
    )
    .join("");

  return `
    <h2 style="margin-top:0;color:#9d0208">Data Archive</h2>
    <p>Old log records for <strong>${BUSINESS.name}</strong> were exported and removed from the database.</p>
    <div style="background:#fff8f2;border-radius:8px;padding:16px;margin:16px 0">
      <p><strong>File:</strong> ${filename}</p>
      <p><strong>Size:</strong> ${sizeMb} MB</p>
      <p><strong>Retention:</strong> ${meta.retentionMonths} month(s)</p>
      <p><strong>Cutoff:</strong> before ${formatCutoffLabel(new Date(meta.cutoffBefore))} IST</p>
      <p><strong>Exported:</strong> ${new Date(meta.exportedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#fff4d6"><th style="padding:8px 10px;text-align:left">Entity</th><th style="padding:8px 10px;text-align:right">Rows</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="font-size:12px;color:#6e5f5f;margin-top:20px">Archive contains JSON data and SQL restore statements inside the gzip file.</p>
  `;
}

function totalRecords(counts: Record<string, number>): number {
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

async function logArchive(input: {
  filename: string;
  sizeBytes: number;
  recordCounts: Record<string, number>;
  status: string;
  trigger: string;
  recipient: string;
  error?: string;
}) {
  await prisma.archiveLog.create({
    data: {
      filename: input.filename,
      sizeBytes: input.sizeBytes,
      recordCounts: JSON.stringify(input.recordCounts),
      status: input.status,
      trigger: input.trigger,
      recipient: input.recipient,
      error: input.error,
    },
  });
}

async function updateArchiveStatus(id: string, status: string, error?: string) {
  await prisma.archiveSettings.update({
    where: { id },
    data: {
      lastArchiveAt: new Date(),
      lastArchiveStatus: status,
      lastArchiveError: error ?? null,
    },
  });
}

export async function runDataArchive(
  trigger: ArchiveTrigger,
  options?: { recipientOverride?: string },
): Promise<{ ok: boolean; error?: string; filename?: string; sizeBytes?: number; recordCounts?: Record<string, number> }> {
  const settings = await getArchiveSettings();
  const emailSettings = await getEmailSettings();

  if (trigger === "SCHEDULED" && !settings.enabled) {
    return { ok: false, error: "Scheduled archive is disabled" };
  }

  if (!settings.emailExportEnabled) {
    return { ok: false, error: "Email export is disabled — enable it to archive" };
  }

  const hasEntity =
    settings.includeSiteVisits ||
    settings.includeErrorLogs ||
    settings.includeAuditLogs ||
    settings.includeNotificationLog;
  if (!hasEntity) {
    return { ok: false, error: "Select at least one entity to archive" };
  }

  const recipient =
    options?.recipientOverride?.trim() ||
    settings.recipientEmail.trim() ||
    emailSettings.adminNotifyEmail.trim() ||
    emailSettings.fromEmail.trim();

  if (!recipient) {
    return { ok: false, error: "No archive recipient email configured" };
  }

  if (!emailSettings.host || !emailSettings.username || !emailSettings.password) {
    return { ok: false, error: "SMTP is not configured — set up email in Settings first" };
  }

  const cutoff = getRetentionCutoff(settings.retentionMonths);
  const { exportData, sql } = await collectArchiveData(settings, cutoff);

  if (totalRecords(exportData.meta.recordCounts) === 0) {
    await updateArchiveStatus(settings.id, "SKIPPED", "No records older than retention cutoff");
    return { ok: true, recordCounts: exportData.meta.recordCounts, error: "No records to archive" };
  }

  const archiveBundle = {
    json: exportData,
    sql,
  };
  const json = JSON.stringify(archiveBundle, null, 2);
  const compressed = gzipSync(Buffer.from(json, "utf-8"));
  const filename = buildArchiveFilename();

  if (compressed.byteLength > MAX_ATTACHMENT_BYTES) {
    const error = `Archive too large (${(compressed.byteLength / 1024 / 1024).toFixed(1)} MB). Reduce retention or archive fewer entities.`;
    await logArchive({
      filename,
      sizeBytes: compressed.byteLength,
      recordCounts: exportData.meta.recordCounts,
      status: "FAILED",
      trigger,
      recipient,
      error,
    });
    await updateArchiveStatus(settings.id, "FAILED", error);
    await createAdminNotification({
      type: "DATA_ARCHIVE",
      title: "Data archive failed",
      message: error,
      targetUrl: `${resolveSiteOrigin()}/admin/settings`,
      skipPush: true,
    });
    return { ok: false, error };
  }

  const sizeMb = (compressed.byteLength / 1024 / 1024).toFixed(2);
  const subject = `SRK Crackers Data Archive — ${filename}`;
  const html = buildArchiveEmailHtml(exportData.meta, filename, sizeMb);

  const result = await sendEmailWithAttachment({
    to: recipient,
    subject,
    html,
    trigger: "DATA_ARCHIVE",
    force: true,
    attachments: [
      {
        filename,
        content: compressed,
        contentType: "application/gzip",
      },
    ],
  });

  if (result.ok) {
    await purgeArchivedData(settings, cutoff);
  }

  await logArchive({
    filename,
    sizeBytes: compressed.byteLength,
    recordCounts: exportData.meta.recordCounts,
    status: result.ok ? "SENT" : "FAILED",
    trigger,
    recipient,
    error: result.error,
  });

  await updateArchiveStatus(settings.id, result.ok ? "SENT" : "FAILED", result.error);

  await createAdminNotification({
    type: "DATA_ARCHIVE",
    title: result.ok ? "Data archive sent" : "Data archive failed",
    message: result.ok
      ? `${filename} (${sizeMb} MB) — ${totalRecords(exportData.meta.recordCounts)} rows archived`
      : result.error ?? "Archive email failed",
    targetUrl: `${resolveSiteOrigin()}/admin/settings`,
    skipPush: true,
  });

  return result.ok
    ? {
        ok: true,
        filename,
        sizeBytes: compressed.byteLength,
        recordCounts: exportData.meta.recordCounts,
      }
    : { ok: false, error: result.error };
}

export async function runScheduledArchiveIfDue(): Promise<{ ran: boolean; ok?: boolean; error?: string }> {
  const settings = await getArchiveSettings();
  if (!isArchiveDue(settings)) {
    return { ran: false };
  }

  const result = await runDataArchive("SCHEDULED");
  return { ran: true, ok: result.ok, error: result.error };
}
