import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import {
  ARCHIVE_SETTINGS_ID,
  buildCronFromSettings,
  getArchiveSettings,
  getRetentionCutoff,
  formatCutoffLabel,
  parseCronToSettings,
} from "@/lib/data-archive";
import { getEmailSettings } from "@/lib/email-settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings, recentLogs, emailSettings] = await Promise.all([
    getArchiveSettings(),
    prisma.archiveLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    getEmailSettings(),
  ]);

  const cutoff = getRetentionCutoff(settings.retentionMonths);

  return NextResponse.json({
    ...settings,
    lastArchiveAt: settings.lastArchiveAt?.toISOString() ?? null,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
    cutoffLabel: formatCutoffLabel(cutoff),
    adminNotifyEmail: emailSettings.adminNotifyEmail || emailSettings.fromEmail,
    recentLogs: recentLogs.map((log) => ({
      id: log.id,
      filename: log.filename,
      sizeBytes: log.sizeBytes,
      status: log.status,
      trigger: log.trigger,
      recipient: log.recipient,
      error: log.error,
      createdAt: log.createdAt.toISOString(),
    })),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await getArchiveSettings();

  const frequency =
    body.frequency === "DAILY" || body.frequency === "WEEKLY" || body.frequency === "MONTHLY"
      ? body.frequency
      : existing.frequency;

  let runHour =
    typeof body.runHour === "number"
      ? Math.max(0, Math.min(23, body.runHour))
      : existing.runHour;
  let runDayOfWeek =
    typeof body.runDayOfWeek === "number"
      ? Math.max(0, Math.min(6, body.runDayOfWeek))
      : existing.runDayOfWeek;
  let runDayOfMonth =
    typeof body.runDayOfMonth === "number"
      ? Math.max(1, Math.min(28, body.runDayOfMonth))
      : existing.runDayOfMonth;

  let cronExpression =
    typeof body.cronExpression === "string" ? body.cronExpression.trim() : existing.cronExpression;

  if (typeof body.cronExpression === "string" && body.cronExpression.trim()) {
    const parsed = parseCronToSettings(body.cronExpression.trim());
    if (parsed?.frequency) {
      runHour = parsed.runHour ?? runHour;
      runDayOfWeek = parsed.runDayOfWeek ?? runDayOfWeek;
      runDayOfMonth = parsed.runDayOfMonth ?? runDayOfMonth;
    }
  } else if (
    body.frequency !== undefined ||
    body.runHour !== undefined ||
    body.runDayOfWeek !== undefined ||
    body.runDayOfMonth !== undefined
  ) {
    cronExpression = buildCronFromSettings({
      frequency,
      runHour,
      runDayOfWeek,
      runDayOfMonth,
    });
  }

  const data = {
    enabled: typeof body.enabled === "boolean" ? body.enabled : existing.enabled,
    emailExportEnabled:
      typeof body.emailExportEnabled === "boolean"
        ? body.emailExportEnabled
        : existing.emailExportEnabled,
    frequency,
    recipientEmail:
      typeof body.recipientEmail === "string"
        ? body.recipientEmail.trim()
        : existing.recipientEmail,
    runHour,
    runDayOfWeek,
    runDayOfMonth,
    cronExpression,
    retentionMonths:
      typeof body.retentionMonths === "number"
        ? Math.max(1, Math.min(24, body.retentionMonths))
        : existing.retentionMonths,
    includeSiteVisits:
      typeof body.includeSiteVisits === "boolean"
        ? body.includeSiteVisits
        : existing.includeSiteVisits,
    includeErrorLogs:
      typeof body.includeErrorLogs === "boolean"
        ? body.includeErrorLogs
        : existing.includeErrorLogs,
    includeAuditLogs:
      typeof body.includeAuditLogs === "boolean"
        ? body.includeAuditLogs
        : existing.includeAuditLogs,
    includeNotificationLog:
      typeof body.includeNotificationLog === "boolean"
        ? body.includeNotificationLog
        : existing.includeNotificationLog,
  };

  const updated = await prisma.archiveSettings.upsert({
    where: { id: ARCHIVE_SETTINGS_ID },
    create: { id: ARCHIVE_SETTINGS_ID, ...data },
    update: data,
  });

  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SETTINGS_ARCHIVE_UPDATE",
    entityType: "settings",
    entityId: ARCHIVE_SETTINGS_ID,
    summary: "Updated data archive settings",
  });

  const cutoff = getRetentionCutoff(updated.retentionMonths);

  return NextResponse.json({
    ...updated,
    lastArchiveAt: updated.lastArchiveAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    cutoffLabel: formatCutoffLabel(cutoff),
  });
}
