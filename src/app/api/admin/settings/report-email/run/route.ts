import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { sendBusinessReportEmail } from "@/lib/report-email";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendBusinessReportEmail("MANUAL");
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send report" }, { status: 500 });
  }

  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SETTINGS_REPORT_EMAIL_SEND",
    entityType: "settings",
    summary: `Sent business report email to ${result.recipient}`,
    metadata: { recipient: result.recipient },
  });

  return NextResponse.json({
    ok: true,
    recipient: result.recipient,
    message: `Report emailed to ${result.recipient}`,
  });
}
