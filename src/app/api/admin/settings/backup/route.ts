import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { BACKUP_SETTINGS_ID, getBackupSettings } from "@/lib/db-backup";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getBackupSettings();
  const recentLogs = await prisma.dbBackupLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    ...settings,
    lastBackupAt: settings.lastBackupAt?.toISOString() ?? null,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
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

  const existing = await getBackupSettings();
  const frequency =
    body.frequency === "DAILY" || body.frequency === "MONTHLY" || body.frequency === "YEARLY"
      ? body.frequency
      : existing.frequency;

  const data = {
    enabled: typeof body.enabled === "boolean" ? body.enabled : existing.enabled,
    frequency,
    recipientEmail:
      typeof body.recipientEmail === "string"
        ? body.recipientEmail.trim()
        : existing.recipientEmail,
    runHour:
      typeof body.runHour === "number"
        ? Math.max(0, Math.min(23, body.runHour))
        : existing.runHour,
    runDayOfMonth:
      typeof body.runDayOfMonth === "number"
        ? Math.max(1, Math.min(28, body.runDayOfMonth))
        : existing.runDayOfMonth,
    runMonth:
      typeof body.runMonth === "number"
        ? Math.max(1, Math.min(12, body.runMonth))
        : existing.runMonth,
    runDayOfYear:
      typeof body.runDayOfYear === "number"
        ? Math.max(1, Math.min(28, body.runDayOfYear))
        : existing.runDayOfYear,
    includeScreenshots:
      typeof body.includeScreenshots === "boolean"
        ? body.includeScreenshots
        : existing.includeScreenshots,
  };

  const updated = await prisma.backupSettings.upsert({
    where: { id: BACKUP_SETTINGS_ID },
    create: { id: BACKUP_SETTINGS_ID, ...data },
    update: data,
  });

  return NextResponse.json({
    ...updated,
    lastBackupAt: updated.lastBackupAt?.toISOString() ?? null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
}
