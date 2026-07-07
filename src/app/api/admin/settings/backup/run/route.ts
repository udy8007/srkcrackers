import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runDatabaseBackup } from "@/lib/db-backup";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDatabaseBackup("MANUAL");

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Backup failed" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    filename: result.filename,
    sizeBytes: result.sizeBytes,
  });
}
