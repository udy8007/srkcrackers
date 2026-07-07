import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  EMAIL_SETTINGS_ID,
  getEmailSettings,
  mergeEmailSettings,
  PASSWORD_MASK,
  serializeEmailSettings,
  smtpConfigError,
} from "@/lib/email-settings";
import { prisma } from "@/lib/prisma";
import { sendEmail, verifySmtpConnection } from "@/lib/email";
import { buildTestEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
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

  const saved = await getEmailSettings();
  const settings = mergeEmailSettings(saved, {
    host: typeof body.host === "string" ? body.host : saved.host,
    port: typeof body.port === "number" ? body.port : saved.port,
    enableSsl: typeof body.enableSsl === "boolean" ? body.enableSsl : saved.enableSsl,
    username: typeof body.username === "string" ? body.username : saved.username,
    password: typeof body.password === "string" ? body.password : saved.password,
    fromEmail: typeof body.fromEmail === "string" ? body.fromEmail : saved.fromEmail,
    fromName: typeof body.fromName === "string" ? body.fromName : saved.fromName,
  });

  const to =
    (typeof body.to === "string" ? body.to.trim() : "") ||
    settings.adminNotifyEmail ||
    settings.fromEmail;

  if (!to) {
    return NextResponse.json({ error: "Test recipient email is required" }, { status: 400 });
  }

  const configError = smtpConfigError(settings);
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 400 });
  }

  const verify = await verifySmtpConnection(settings);
  if (!verify.ok) {
    return NextResponse.json({ error: verify.error ?? "SMTP connection failed" }, { status: 400 });
  }

  const { subject, html } = buildTestEmail();
  const result = await sendEmail({
    to,
    subject,
    html,
    trigger: "TEST",
    force: true,
    settings,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send test email" }, { status: 500 });
  }

  // Persist SMTP settings when test succeeds (keeps password if newly entered)
  const password =
    typeof body.password === "string" &&
    body.password.trim() &&
    body.password !== PASSWORD_MASK
      ? body.password.trim()
      : saved.password;

  const adminNotifyEmail = saved.adminNotifyEmail.trim() || to;

  await prisma.emailSettings.upsert({
    where: { id: EMAIL_SETTINGS_ID },
    create: {
      id: EMAIL_SETTINGS_ID,
      host: settings.host,
      port: settings.port,
      enableSsl: settings.enableSsl,
      username: settings.username,
      password,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      adminNotifyEmail,
    },
    update: {
      host: settings.host,
      port: settings.port,
      enableSsl: settings.enableSsl,
      username: settings.username,
      password,
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      adminNotifyEmail,
    },
  });

  return NextResponse.json({
    ok: true,
    to,
    adminNotifyEmail,
    settings: serializeEmailSettings({ ...settings, password, adminNotifyEmail }),
  });
}
