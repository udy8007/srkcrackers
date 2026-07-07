import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmailSettings } from "@/lib/email-settings";
import { sendEmail, verifySmtpConnection } from "@/lib/email";
import { buildTestEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { to?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const settings = await getEmailSettings();
  const to = body.to?.trim() || settings.adminNotifyEmail || settings.fromEmail;

  if (!to) {
    return NextResponse.json({ error: "No recipient email configured" }, { status: 400 });
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
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Failed to send test email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, to });
}
