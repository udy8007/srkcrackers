import { NextRequest, NextResponse } from "next/server";
import { autoDeliverDueOrders } from "@/lib/auto-deliver";

export const dynamic = "force-dynamic";

/** Vercel Cron — auto-mark dispatched orders as delivered after expected time. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const delivered = await autoDeliverDueOrders();
    return NextResponse.json({ ok: true, delivered });
  } catch (error) {
    console.error("auto-deliver cron failed:", error);
    return NextResponse.json({ error: "Auto-deliver failed" }, { status: 500 });
  }
}
