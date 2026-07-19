import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await prisma.adminPushLog.deleteMany();
  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "SYSTEM_CLEAR_PUSH_LOGS",
    entityType: "system",
    summary: `Cleared push logs (${result.count})`,
    metadata: { deleted: result.count },
  });
  return NextResponse.json({ ok: true, deleted: result.count });
}
