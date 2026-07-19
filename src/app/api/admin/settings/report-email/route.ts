import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  getReportEmailSettings,
  REPORT_EMAIL_SETTINGS_ID,
} from "@/lib/report-email";
import type { ReportEmailFrequency } from "@/lib/db/types";

export const dynamic = "force-dynamic";

const FREQUENCIES = new Set(["DAILY", "WEEKLY", "MONTHLY"]);

function serialize(settings: Awaited<ReturnType<typeof getReportEmailSettings>>) {
  return {
    ...settings,
    lastSentAt: settings.lastSentAt?.toISOString() ?? null,
    createdAt: settings.createdAt.toISOString(),
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getReportEmailSettings();
  return NextResponse.json(serialize(settings));
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<{
    enabled: boolean;
    frequency: string;
    recipientEmail: string;
    runHour: number;
    runDayOfWeek: number;
    runDayOfMonth: number;
    includeSales: boolean;
    includeOrders: boolean;
    includeCatalog: boolean;
    includeTraffic: boolean;
    notifyPush: boolean;
  }>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.frequency === "string" && FREQUENCIES.has(body.frequency)) {
    data.frequency = body.frequency as ReportEmailFrequency;
  }
  if (typeof body.recipientEmail === "string") {
    data.recipientEmail = body.recipientEmail.trim();
  }
  if (typeof body.runHour === "number") {
    data.runHour = Math.max(0, Math.min(23, Math.round(body.runHour)));
  }
  if (typeof body.runDayOfWeek === "number") {
    data.runDayOfWeek = Math.max(0, Math.min(6, Math.round(body.runDayOfWeek)));
  }
  if (typeof body.runDayOfMonth === "number") {
    data.runDayOfMonth = Math.max(1, Math.min(28, Math.round(body.runDayOfMonth)));
  }
  if (typeof body.includeSales === "boolean") data.includeSales = body.includeSales;
  if (typeof body.includeOrders === "boolean") data.includeOrders = body.includeOrders;
  if (typeof body.includeCatalog === "boolean") data.includeCatalog = body.includeCatalog;
  if (typeof body.includeTraffic === "boolean") data.includeTraffic = body.includeTraffic;
  if (typeof body.notifyPush === "boolean") data.notifyPush = body.notifyPush;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await getReportEmailSettings();
  const updated = await prisma.reportEmailSettings.update({
    where: { id: REPORT_EMAIL_SETTINGS_ID },
    data,
  });

  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SETTINGS_REPORT_EMAIL_UPDATE",
    entityType: "settings",
    entityId: REPORT_EMAIL_SETTINGS_ID,
    summary: `Updated email report settings (enabled=${updated.enabled}, ${updated.frequency})`,
    metadata: {
      enabled: updated.enabled,
      frequency: updated.frequency,
      runHour: updated.runHour,
    },
  });

  return NextResponse.json(serialize(updated));
}
