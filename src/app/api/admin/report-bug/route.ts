import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { buildBugReportNtfy, sendNtfyNotification } from "@/lib/ntfy";

export const dynamic = "force-dynamic";

const AREAS = [
  "Dashboard",
  "Orders",
  "Products",
  "Categories",
  "Analytics",
  "Notifications",
  "Settings",
  "Storefront / Checkout",
  "Push notifications",
  "Other",
] as const;

const SEVERITIES = ["Low", "Medium", "High"] as const;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    area?: string;
    description?: string;
    steps?: string;
    severity?: string;
    pageUrl?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const area = body.area?.trim() ?? "";
  const description = body.description?.trim() ?? "";
  const steps = body.steps?.trim() ?? "";
  const severity = body.severity?.trim() ?? "Medium";
  const pageUrl = body.pageUrl?.trim() ?? "";

  if (!AREAS.includes(area as (typeof AREAS)[number])) {
    return NextResponse.json({ error: "Please choose a valid area." }, { status: 400 });
  }
  if (description.length < 10) {
    return NextResponse.json(
      { error: "Please describe the bug in at least 10 characters." },
      { status: 400 },
    );
  }
  if (description.length > 4000) {
    return NextResponse.json({ error: "Description is too long." }, { status: 400 });
  }
  if (steps.length > 2000) {
    return NextResponse.json({ error: "Steps to reproduce are too long." }, { status: 400 });
  }
  if (!SEVERITIES.includes(severity as (typeof SEVERITIES)[number])) {
    return NextResponse.json({ error: "Invalid severity." }, { status: 400 });
  }

  const reporterName = session.user.name?.trim() || "Admin user";
  const reporterEmail = session.user.email?.trim() || "unknown";

  const payload = buildBugReportNtfy({
    reporterName,
    reporterEmail,
    area,
    description,
    steps: steps || undefined,
    severity,
    pageUrl: pageUrl || undefined,
  });

  const result = await sendNtfyNotification(payload);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error ?? "Could not send bug report notification." },
      { status: 502 },
    );
  }

  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SYSTEM_BUG_REPORT",
    entityType: "system",
    summary: `Submitted bug report (${area}, ${severity})`,
    metadata: { area, severity },
  });

  return NextResponse.json({ ok: true });
}
