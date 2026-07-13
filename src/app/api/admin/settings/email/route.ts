import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  EMAIL_SETTINGS_ID,
  getEmailSettings,
  PASSWORD_MASK,
  serializeEmailSettings,
} from "@/lib/email-settings";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getEmailSettings();
  return NextResponse.json(serializeEmailSettings(settings));
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await getEmailSettings();
  const password =
    typeof body.password === "string" &&
    body.password.trim() &&
    body.password !== PASSWORD_MASK
      ? body.password.trim()
      : existing.password;

  const data = {
    enabled: typeof body.enabled === "boolean" ? body.enabled : existing.enabled,
    host: typeof body.host === "string" ? body.host.trim() : existing.host,
    port: typeof body.port === "number" ? body.port : existing.port,
    enableSsl: typeof body.enableSsl === "boolean" ? body.enableSsl : existing.enableSsl,
    username: typeof body.username === "string" ? body.username.trim() : existing.username,
    password,
    fromEmail: typeof body.fromEmail === "string" ? body.fromEmail.trim() : existing.fromEmail,
    fromName: typeof body.fromName === "string" ? body.fromName.trim() : existing.fromName,
    adminNotifyEmail:
      typeof body.adminNotifyEmail === "string"
        ? body.adminNotifyEmail.trim()
        : existing.adminNotifyEmail,
    notifyCustomerOrderPlaced:
      typeof body.notifyCustomerOrderPlaced === "boolean"
        ? body.notifyCustomerOrderPlaced
        : existing.notifyCustomerOrderPlaced,
    notifyCustomerStatusChange:
      typeof body.notifyCustomerStatusChange === "boolean"
        ? body.notifyCustomerStatusChange
        : existing.notifyCustomerStatusChange,
    notifyCustomerDelivered:
      typeof body.notifyCustomerDelivered === "boolean"
        ? body.notifyCustomerDelivered
        : existing.notifyCustomerDelivered,
    notifyAdminNewOrder:
      typeof body.notifyAdminNewOrder === "boolean"
        ? body.notifyAdminNewOrder
        : existing.notifyAdminNewOrder,
    notifyAdminStatusChange: false, // status emails go to customer only
    notifyAdminPendingReminder:
      typeof body.notifyAdminPendingReminder === "boolean"
        ? body.notifyAdminPendingReminder
        : existing.notifyAdminPendingReminder,
    pendingReminderHours:
      typeof body.pendingReminderHours === "number"
        ? Math.max(1, Math.min(72, body.pendingReminderHours))
        : existing.pendingReminderHours,
  };

  const updated = await prisma.emailSettings.upsert({
    where: { id: EMAIL_SETTINGS_ID },
    create: { id: EMAIL_SETTINGS_ID, ...data },
    update: data,
  });

  return NextResponse.json(serializeEmailSettings(updated));
}
