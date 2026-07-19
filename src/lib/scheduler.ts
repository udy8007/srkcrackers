import "server-only";
import { prisma } from "@/lib/prisma";
import { autoDeliverDueOrders } from "@/lib/auto-deliver";
import { runScheduledBackupIfDue } from "@/lib/db-backup";
import { getEmailSettings } from "@/lib/email-settings";
import {
  notifyAutoDelivered,
  sendIncompleteCheckoutReminders,
  sendPendingOrderReminders,
} from "@/lib/notifications";
import { runScheduledReportEmailIfDue } from "@/lib/report-email";
export const SCHEDULER_ID = "default";
const MIN_TICK_GAP_MS = 5 * 60 * 1000; // debounce — max once per 5 min globally
const DELIVER_INTERVAL_MS = 15 * 60 * 1000;

export type SchedulerSource = "cron" | "admin" | "track" | "overview";

export interface SchedulerTickResult {
  skipped?: boolean;
  source: SchedulerSource;
  delivered?: number;
  reminded?: number;
  backup?: { ran: boolean; ok?: boolean };
  reportEmail?: { ran: boolean; ok?: boolean; error?: string };
}

async function getSchedulerState() {
  const existing = await prisma.schedulerState.findUnique({
    where: { id: SCHEDULER_ID },
  });
  if (existing) return existing;

  return prisma.schedulerState.create({
    data: { id: SCHEDULER_ID },
  });
}

/** Run due scheduled jobs (deliver, reminders, backup). Safe to call from many places. */
export async function runSchedulerTick(
  source: SchedulerSource,
): Promise<SchedulerTickResult> {
  const state = await getSchedulerState();
  if (!state.enabled) {
    return { skipped: true, source };
  }

  const now = Date.now();
  if (state.lastTickAt && now - state.lastTickAt.getTime() < MIN_TICK_GAP_MS) {
    return { skipped: true, source };
  }

  const result: SchedulerTickResult = { source, delivered: 0, reminded: 0 };
  const updates: {
    lastTickAt: Date;
    lastDeliverAt?: Date;
    lastReminderAt?: Date;
  } = { lastTickAt: new Date() };

  // Auto-deliver dispatched orders (every 15 min)
  const deliverDue =
    !state.lastDeliverAt || now - state.lastDeliverAt.getTime() >= DELIVER_INTERVAL_MS;
  if (deliverDue) {
    const deliveredIds = await autoDeliverDueOrders();
    notifyAutoDelivered(deliveredIds);
    result.delivered = deliveredIds.length;
    updates.lastDeliverAt = new Date();
  }

  // Pending + incomplete-checkout reminders (interval from email settings)
  const emailSettings = await getEmailSettings();
  const reminderMs = Math.max(1, emailSettings.pendingReminderHours) * 60 * 60 * 1000;
  const reminderDue =
    !state.lastReminderAt || now - state.lastReminderAt.getTime() >= reminderMs;
  if (reminderDue && emailSettings.notifyAdminPendingReminder) {
    const pending = await sendPendingOrderReminders();
    const incomplete = await sendIncompleteCheckoutReminders();
    result.reminded = pending.reminded + incomplete.reminded;
    updates.lastReminderAt = new Date();
  }

  // Scheduled DB backup (daily / monthly / yearly logic in db-backup.ts)
  result.backup = await runScheduledBackupIfDue();

  // Scheduled business report email
  result.reportEmail = await runScheduledReportEmailIfDue();

  await prisma.schedulerState.update({
    where: { id: SCHEDULER_ID },
    data: updates,
  });

  return result;
}

export async function getSchedulerSettings() {
  return getSchedulerState();
}

export async function updateSchedulerSettings(input: {
  enabled?: boolean;
  tickIntervalMinutes?: number;
}) {
  const existing = await getSchedulerState();
  return prisma.schedulerState.update({
    where: { id: SCHEDULER_ID },
    data: {
      enabled: input.enabled ?? existing.enabled,
      tickIntervalMinutes:
        input.tickIntervalMinutes != null
          ? Math.max(5, Math.min(1440, input.tickIntervalMinutes))
          : existing.tickIntervalMinutes,
    },
  });
}

/** Fire-and-forget scheduler tick — never blocks the caller. */
export function dispatchSchedulerTick(source: SchedulerSource) {
  void runSchedulerTick(source).catch((error) => {
    console.error(`Scheduler tick [${source}] failed:`, error);
  });
}
