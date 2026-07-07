import { NextRequest, NextResponse } from "next/server";
import { autoDeliverDueOrders } from "@/lib/auto-deliver";
import { runScheduledBackupIfDue } from "@/lib/db-backup";
import { sendPendingOrderReminders, notifyAutoDelivered } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/** Vercel Cron — pending order reminders + auto-deliver. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const [deliveredIds, reminders, backup] = await Promise.all([
      autoDeliverDueOrders(),
      sendPendingOrderReminders(),
      runScheduledBackupIfDue(),
    ]);
    notifyAutoDelivered(deliveredIds);
    return NextResponse.json({
      ok: true,
      delivered: deliveredIds.length,
      reminders: reminders.reminded,
      backup,
    });
  } catch (error) {
    console.error("cron notifications failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
