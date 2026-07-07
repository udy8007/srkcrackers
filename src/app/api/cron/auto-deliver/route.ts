import { NextRequest, NextResponse } from "next/server";
import { runSchedulerTick } from "@/lib/scheduler";

export const dynamic = "force-dynamic";

/** Vercel Cron fallback — delegates to in-app scheduler. */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runSchedulerTick("cron");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("auto-deliver cron failed:", error);
    return NextResponse.json({ error: "Auto-deliver failed" }, { status: 500 });
  }
}
