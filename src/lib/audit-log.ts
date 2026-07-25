import { prisma } from "@/lib/prisma";

export type AuditEntityType =
  | "product"
  | "order"
  | "category"
  | "settings"
  | "account"
  | "system"
  | "review";

export type AuditActor = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

export type WriteAuditLogInput = {
  actor?: AuditActor | null;
  action: string;
  entityType: AuditEntityType;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

/** Best-effort audit write — never throws to callers. */
export async function writeAuditLog(input: WriteAuditLogInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actor?.id ?? null,
        actorEmail: input.actor?.email ?? null,
        actorName: input.actor?.name ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary.slice(0, 500),
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  } catch (error) {
    console.error("writeAuditLog failed:", error);
  }
}

export function actorFromSession(user: {
  id?: string | null;
  email?: string | null;
  name?: string | null;
} | null | undefined): AuditActor | null {
  if (!user) return null;
  return {
    id: user.id ?? null,
    email: user.email ?? null,
    name: user.name ?? null,
  };
}
