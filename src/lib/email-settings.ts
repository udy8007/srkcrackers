import { headers } from "next/headers";
import type { EmailSettings } from "@/lib/db/types";
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

function stripTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, "");
}

/** Default scheme for a host when no proxy proto header is present. */
function defaultSchemeFor(host: string): string {
  return /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(host) ? "http" : "https";
}

/**
 * Resolve the public site origin dynamically from the incoming request
 * (no AUTH_URL / NEXTAUTH_URL needed). Falls back to BUSINESS.url when called
 * outside a request scope (e.g. build time).
 */
export async function resolveSiteOrigin(): Promise<string> {
  try {
    const requestHeaders = await headers();
    const host =
      requestHeaders.get("x-forwarded-host")?.trim() ||
      requestHeaders.get("host")?.trim();
    if (host) {
      const proto =
        (requestHeaders.get("x-forwarded-proto") ?? "").split(",")[0]?.trim() ||
        requestHeaders.get("x-forwarded-scheme")?.trim() ||
        defaultSchemeFor(host);
      return stripTrailingSlash(`${proto}://${host}`);
    }
  } catch {
    // No active request scope — fall through to the default origin.
  }
  return stripTrailingSlash(BUSINESS.url);
}

/** Admin alert recipient — falls back when adminNotifyEmail was not saved. */
export function resolveAdminNotifyEmail(settings: EmailSettings): string {
  return (
    settings.adminNotifyEmail.trim() ||
    settings.fromEmail.trim() ||
    settings.username.trim() ||
    BUSINESS.email
  );
}
