import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { runDataArchive } from "@/lib/data-archive";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDataArchive("MANUAL");

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Archive failed" }, { status: 500 });
  }

  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SETTINGS_ARCHIVE_RUN",
    entityType: "settings",
    summary: `Ran manual data archive (${result.filename ?? "no file"})`,
    metadata: {
      filename: result.filename,
      sizeBytes: result.sizeBytes,
      recordCounts: result.recordCounts,
    },
  });

  return NextResponse.json({
    ok: true,
    filename: result.filename,
    sizeBytes: result.sizeBytes,
    recordCounts: result.recordCounts,
  });
}
