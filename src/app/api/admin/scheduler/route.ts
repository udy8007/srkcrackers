import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import {
  getSchedulerSettings,
  runSchedulerTick,
  updateSchedulerSettings,
} from "@/lib/scheduler";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await getSchedulerSettings();
  return NextResponse.json({
    enabled: state.enabled,
    tickIntervalMinutes: state.tickIntervalMinutes,
    lastTickAt: state.lastTickAt?.toISOString() ?? null,
    lastDeliverAt: state.lastDeliverAt?.toISOString() ?? null,
    lastReminderAt: state.lastReminderAt?.toISOString() ?? null,
  });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { enabled?: boolean; tickIntervalMinutes?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const updated = await updateSchedulerSettings(body);
  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SETTINGS_SCHEDULER_UPDATE",
    entityType: "settings",
    summary: `Updated scheduler (enabled=${updated.enabled}, interval=${updated.tickIntervalMinutes}m)`,
    metadata: {
      enabled: updated.enabled,
      tickIntervalMinutes: updated.tickIntervalMinutes,
    },
  });
  return NextResponse.json({
    enabled: updated.enabled,
    tickIntervalMinutes: updated.tickIntervalMinutes,
    lastTickAt: updated.lastTickAt?.toISOString() ?? null,
    lastDeliverAt: updated.lastDeliverAt?.toISOString() ?? null,
    lastReminderAt: updated.lastReminderAt?.toISOString() ?? null,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSchedulerTick("admin");
  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SETTINGS_SCHEDULER_TICK",
    entityType: "settings",
    summary: "Ran scheduler tick manually",
  });
  return NextResponse.json(result);
}
