import "server-only";
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
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
  | "ENQUIRY_PLACED_ADMIN"
  | "ENQUIRY_RESOLVED_CUSTOMER"
  | "ENQUIRY_PENDING_REMINDER_ADMIN"
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
let lastConnectError = "";

type SmtpEndpoint = {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
};

function configKey(settings: EmailSettings): string {
  return `${settings.host}:${settings.port}:${settings.username}:${settings.password}:${settings.enableSsl}`;
}

function mailboxDomain(settings: EmailSettings): string {
  const from = (settings.fromEmail || settings.username || "").trim();
  const at = from.lastIndexOf("@");
  return at >= 0 ? from.slice(at + 1).toLowerCase() : "";
}

function smtpEndpoints(settings: EmailSettings): SmtpEndpoint[] {
  const host = settings.host.trim();
  const port = settings.port || 587;
  const seen = new Set<string>();
  const list: SmtpEndpoint[] = [];
  const add = (endpoint: SmtpEndpoint) => {
    const key = `${endpoint.host}:${endpoint.port}:${endpoint.secure}:${endpoint.requireTLS}`;
    if (!endpoint.host || seen.has(key)) return;
    seen.add(key);
    list.push(endpoint);
  };

  const implicitSsl = port === 465;
  add({
    host,
    port,
    secure: implicitSsl,
    requireTLS: !implicitSsl && (port === 587 || settings.enableSsl),
  });

  const publicHostinger = /(?:^|\.)hostinger\.com$/i.test(host);
  const domain = mailboxDomain(settings);
  const localDomain = domain && !/(?:^|\.)hostinger\.com$/i.test(domain) ? domain : "";

  if (publicHostinger) {
    add({ host: "localhost", port: 587, secure: false, requireTLS: false });
    add({ host: "127.0.0.1", port: 587, secure: false, requireTLS: false });
    if (localDomain) {
      add({ host: localDomain, port: 587, secure: false, requireTLS: true });
    }
    add({ host: "localhost", port: 25, secure: false, requireTLS: false });
    return list;
  }

  add({ host, port: 587, secure: false, requireTLS: true });
  add({ host, port: 465, secure: true, requireTLS: false });
  if (localDomain) {
    add({ host: `mail.${localDomain}`, port: 587, secure: false, requireTLS: true });
    add({ host: localDomain, port: 587, secure: false, requireTLS: true });
  }
  add({ host: "localhost", port: 587, secure: false, requireTLS: false });
  add({ host: "127.0.0.1", port: 587, secure: false, requireTLS: false });
  add({ host: "localhost", port: 25, secure: false, requireTLS: false });

  return list;
}

function createTransport(settings: EmailSettings, endpoint: SmtpEndpoint): Transporter {
  const local = endpoint.host === "localhost" || endpoint.host === "127.0.0.1";
  const options: SMTPTransport.Options = {
    host: endpoint.host,
    port: endpoint.port,
    secure: endpoint.secure,
    requireTLS: endpoint.requireTLS && !endpoint.secure,
    auth: {
      user: settings.username,
      pass: settings.password,
    },
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 20_000,
    tls: {
      minVersion: "TLSv1.2",
      servername: local ? undefined : endpoint.host,
      rejectUnauthorized: !local,
    },
  };
  return nodemailer.createTransport(options);
}

function applyEndpoint(settings: EmailSettings, endpoint: SmtpEndpoint): EmailSettings {
  return {
    ...settings,
    host: endpoint.host,
    port: endpoint.port,
    enableSsl: endpoint.secure || endpoint.requireTLS,
  };
}

function friendlySmtpError(errors: string[]): string {
  const joined = errors.slice(0, 4).join(" | ");
  if (errors.some((line) => /ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH/i.test(line))) {
    return (
      "Hostinger refused SMTP on this server (port 465 to smtp.hostinger.com often hits Cloudflare). " +
      "Use Port 587, keep SSL/TLS on (STARTTLS), and try host localhost or srkcrackers.in. " +
      joined
    );
  }
  return joined || "SMTP connection failed";
}

async function connectSmtp(
  settings: EmailSettings,
): Promise<{ ok: true; transport: Transporter; settings: EmailSettings } | { ok: false; error: string }> {
  const errors: string[] = [];
  for (const endpoint of smtpEndpoints(settings)) {
    const transport = createTransport(settings, endpoint);
    try {
      await transport.verify();
      return { ok: true, transport, settings: applyEndpoint(settings, endpoint) };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection failed";
      errors.push(`${endpoint.host}:${endpoint.port} ${message}`);
    }
  }
  return { ok: false, error: friendlySmtpError(errors) };
}

async function getTransport(settings: EmailSettings): Promise<Transporter | null> {
  if (!settings.host || !settings.username || !settings.password) {
    return null;
  }

  const key = configKey(settings);
  if (cachedTransport && cachedConfigKey === key) {
    return cachedTransport;
  }

  const connected = await connectSmtp(settings);
  if (!connected.ok) {
    cachedTransport = null;
    cachedConfigKey = "";
    lastConnectError = connected.error;
    return null;
  }

  cachedTransport = connected.transport;
  cachedConfigKey = key;
  lastConnectError = "";
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
  if (outboundNotificationsDisabled() && !options.force) {
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
    return { ok: false, error: lastConnectError || "SMTP is not configured" };
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
): Promise<{ ok: boolean; error?: string; settings?: EmailSettings }> {
  const configError = smtpConfigError(settings);
  if (configError) {
    return { ok: false, error: configError };
  }

  const connected = await connectSmtp(settings);
  if (!connected.ok) {
    cachedTransport = null;
    cachedConfigKey = "";
    lastConnectError = connected.error;
    return { ok: false, error: connected.error };
  }

  cachedTransport = connected.transport;
  cachedConfigKey = configKey(settings);
  lastConnectError = "";
  return { ok: true, settings: connected.settings };
}
