import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { EmailSettings } from "@/lib/db/types";
import { prisma } from "@/lib/prisma";
import { getEmailSettings, smtpConfigError } from "@/lib/email-settings";
import { outboundNotificationsDisabled } from "@/lib/dev-safety";

export type EmailTrigger =
  | "ORDER_PLACED_CUSTOMER"
  | "ORDER_PLACED_ADMIN"
  | "STATUS_CHANGE_CUSTOMER"
  | "STATUS_CHANGE_ADMIN"
  | "DELIVERED_CUSTOMER"
  | "PENDING_REMINDER_ADMIN"
  | "DB_BACKUP"
  | "DATA_ARCHIVE"
  | "REPORT_EMAIL"
  | "TEST";

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

let cachedTransport: Transporter | null = null;
let cachedConfigKey = "";

function configKey(settings: EmailSettings): string {
  return `${settings.host}:${settings.port}:${settings.username}:${settings.password}:${settings.enableSsl}`;
}

function createTransport(settings: EmailSettings): Transporter {
  const port = settings.port || 465;
  const secure = port === 465;

  return nodemailer.createTransport({
    host: settings.host,
    port,
    secure,
    auth: {
      user: settings.username,
      pass: settings.password,
    },
    ...(port === 587 ? { requireTLS: true } : {}),
    tls: {
      minVersion: "TLSv1.2",
      rejectUnauthorized: true,
    },
  });
}

async function getTransport(settings: EmailSettings): Promise<Transporter | null> {
  if (!settings.host || !settings.username || !settings.password) {
    return null;
  }

  const key = configKey(settings);
  if (cachedTransport && cachedConfigKey === key) {
    return cachedTransport;
  }

  cachedTransport = createTransport(settings);
  cachedConfigKey = key;
  return cachedTransport;
}

async function deliverMail(
  options: {
    to: string;
    subject: string;
    html: string;
    trigger: EmailTrigger;
    orderId?: string;
    force?: boolean;
    attachments?: EmailAttachment[];
  },
  settings: EmailSettings,
): Promise<{ ok: boolean; error?: string }> {
  if (outboundNotificationsDisabled()) {
    console.warn(
      `[email] Skipped (${options.trigger} → ${options.to}): DISABLE_OUTBOUND_NOTIFICATIONS=true`,
    );
    return { ok: true };
  }

  if (!settings.enabled && !options.force) {
    return { ok: false, error: "Email notifications are disabled" };
  }

  const transport = await getTransport(settings);
  if (!transport) {
    return { ok: false, error: "SMTP is not configured" };
  }

  const from = settings.fromName
    ? `"${settings.fromName}" <${settings.fromEmail || settings.username}>`
    : settings.fromEmail || settings.username;

  try {
    await transport.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
      })),
    });

    await prisma.emailLog.create({
      data: {
        orderId: options.orderId,
        trigger: options.trigger,
        recipient: options.to,
        subject: options.subject,
        status: "SENT",
      },
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed";
    console.error(`Email [${options.trigger}] to ${options.to} failed:`, error);

    await prisma.emailLog.create({
      data: {
        orderId: options.orderId,
        trigger: options.trigger,
        recipient: options.to,
        subject: options.subject,
        status: "FAILED",
        error: message,
      },
    });

    return { ok: false, error: message };
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  trigger: EmailTrigger;
  orderId?: string;
  /** Skip global enabled check (test emails only). */
  force?: boolean;
  settings?: EmailSettings;
}): Promise<{ ok: boolean; error?: string }> {
  const settings = options.settings ?? (await getEmailSettings());
  return deliverMail(
    {
      to: options.to,
      subject: options.subject,
      html: options.html,
      trigger: options.trigger,
      orderId: options.orderId,
      force: options.force,
    },
    settings,
  );
}

export async function sendEmailWithAttachment(options: {
  to: string;
  subject: string;
  html: string;
  trigger: EmailTrigger;
  attachments: EmailAttachment[];
  force?: boolean;
  settings?: EmailSettings;
}): Promise<{ ok: boolean; error?: string }> {
  const settings = options.settings ?? (await getEmailSettings());
  return deliverMail(
    {
      to: options.to,
      subject: options.subject,
      html: options.html,
      trigger: options.trigger,
      attachments: options.attachments,
      force: options.force,
    },
    settings,
  );
}

/** Verify SMTP connection (used by admin test button). */
export async function verifySmtpConnection(
  settings: EmailSettings,
): Promise<{ ok: boolean; error?: string }> {
  const configError = smtpConfigError(settings);
  if (configError) {
    return { ok: false, error: configError };
  }

  const transport = await getTransport(settings);
  if (!transport) {
    return { ok: false, error: "SMTP is not fully configured" };
  }

  try {
    await transport.verify();
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed";
    return { ok: false, error: message };
  }
}
