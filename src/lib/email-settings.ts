import type { EmailSettings } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUSINESS } from "@/lib/constants";

export const EMAIL_SETTINGS_ID = "default";
export const PASSWORD_MASK = "••••••••";

export type EmailSettingsDTO = Omit<EmailSettings, "password"> & {
  password: string;
  hasPassword: boolean;
};

export async function getEmailSettings(): Promise<EmailSettings> {
  const existing = await prisma.emailSettings.findUnique({
    where: { id: EMAIL_SETTINGS_ID },
  });
  if (existing) return existing;

  return prisma.emailSettings.create({
    data: {
      id: EMAIL_SETTINGS_ID,
      fromEmail: BUSINESS.email,
      fromName: BUSINESS.name,
      adminNotifyEmail: BUSINESS.email,
    },
  });
}

export function serializeEmailSettings(settings: EmailSettings): EmailSettingsDTO {
  return {
    ...settings,
    password: settings.password ? PASSWORD_MASK : "",
    hasPassword: Boolean(settings.password),
  };
}

/** Merge saved settings with form/API overrides (e.g. test before save). */
export function mergeEmailSettings(
  base: EmailSettings,
  overrides: Partial<EmailSettings> & { password?: string },
): EmailSettings {
  const password =
    typeof overrides.password === "string" &&
    overrides.password.trim() &&
    overrides.password !== PASSWORD_MASK
      ? overrides.password.trim()
      : base.password;

  return {
    ...base,
    host: typeof overrides.host === "string" ? overrides.host.trim() : base.host,
    port: typeof overrides.port === "number" ? overrides.port : base.port,
    enableSsl: typeof overrides.enableSsl === "boolean" ? overrides.enableSsl : base.enableSsl,
    username: typeof overrides.username === "string" ? overrides.username.trim() : base.username,
    password,
    fromEmail:
      typeof overrides.fromEmail === "string" ? overrides.fromEmail.trim() : base.fromEmail,
    fromName: typeof overrides.fromName === "string" ? overrides.fromName.trim() : base.fromName,
  };
}

export function smtpConfigError(settings: EmailSettings): string | null {
  if (!settings.host?.trim()) return "SMTP host is required";
  if (!settings.username?.trim()) return "SMTP username is required";
  if (!settings.password?.trim()) {
    return "SMTP password is required — enter your password below, then Save or Send test";
  }
  return null;
}

export function resolveSiteOrigin(): string {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL?.replace(/^/, "https://") ||
    BUSINESS.url
  );
}
