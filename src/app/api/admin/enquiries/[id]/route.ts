import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { dispatchNotification, notifyEnquiryResolved } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function serializeEnquiry(enquiry: {
  id: string;
  enquiryNumber: string;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: "PENDING" | "RESOLVED";
  adminNote: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: enquiry.id,
    enquiryNumber: enquiry.enquiryNumber,
    name: enquiry.name,
    phone: enquiry.phone,
    email: enquiry.email,
    message: enquiry.message,
    status: enquiry.status,
    adminNote: enquiry.adminNote,
    resolvedAt: enquiry.resolvedAt?.toISOString() ?? null,
    createdAt: enquiry.createdAt.toISOString(),
    updatedAt: enquiry.updatedAt.toISOString(),
  };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }

  return NextResponse.json(serializeEnquiry(enquiry));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.enquiry.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const nextStatus =
    body.status === "RESOLVED" || body.status === "PENDING" ? body.status : existing.status;
  const adminNote =
    typeof body.adminNote === "string" ? body.adminNote.trim() || null : existing.adminNote;
  const wasPending = existing.status === "PENDING";
  const nowResolved = nextStatus === "RESOLVED";

  const enquiry = await prisma.enquiry.update({
    where: { id },
    data: {
      status: nextStatus,
      adminNote,
      resolvedAt: nowResolved ? existing.resolvedAt ?? new Date() : null,
    },
  });

  if (wasPending && nowResolved) {
    dispatchNotification(() => notifyEnquiryResolved(enquiry.id));
  }

  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "ENQUIRY_STATUS_CHANGE",
    entityType: "enquiry",
    entityId: enquiry.id,
    summary: `Enquiry ${enquiry.enquiryNumber} marked ${enquiry.status.toLowerCase()}`,
    metadata: { status: enquiry.status, adminNote: enquiry.adminNote },
  });

  return NextResponse.json(serializeEnquiry(enquiry));
}
