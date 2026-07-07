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

export function resolveSiteOrigin(): string {
  return (
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    process.env.VERCEL_URL?.replace(/^/, "https://") ||
    BUSINESS.url
  );
}
