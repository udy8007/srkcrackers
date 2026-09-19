import "server-only";
import { prisma } from "@/lib/prisma";
import { isRazorpayConfigured } from "@/lib/razorpay";

export const PAYMENT_SETTINGS_ID = "default";

export type PaymentSettingsState = {
  razorpayEnabled: boolean;
  keysConfigured: boolean;
};

async function ensureTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`PaymentSettings\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`razorpayEnabled\` BOOLEAN NOT NULL DEFAULT false,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

function asBool(value: unknown): boolean {
  return value === true || value === 1 || value === "1";
}

export async function getPaymentSettings(): Promise<PaymentSettingsState> {
  const keysConfigured = isRazorpayConfigured();
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ razorpayEnabled: unknown }>>(
      "SELECT `razorpayEnabled` FROM `PaymentSettings` WHERE `id` = ? LIMIT 1",
      PAYMENT_SETTINGS_ID,
    );
    if (!rows[0]) {
      await prisma.$executeRawUnsafe(
        "INSERT INTO `PaymentSettings` (`id`, `razorpayEnabled`, `createdAt`, `updatedAt`) VALUES (?, 0, NOW(3), NOW(3))",
        PAYMENT_SETTINGS_ID,
      );
      return { razorpayEnabled: false, keysConfigured };
    }
    return { razorpayEnabled: asBool(rows[0].razorpayEnabled), keysConfigured };
  } catch (error) {
    console.error("getPaymentSettings failed:", error);
    return { razorpayEnabled: false, keysConfigured };
  }
}

/** Checkout shows Razorpay only when the admin switch is on and API keys are set. */
export async function isRazorpayCheckoutEnabled(): Promise<boolean> {
  const settings = await getPaymentSettings();
  return settings.razorpayEnabled && settings.keysConfigured;
}

export async function setRazorpayEnabled(enabled: boolean): Promise<PaymentSettingsState> {
  await ensureTable();
  await prisma.$executeRawUnsafe(
    `INSERT INTO \`PaymentSettings\` (\`id\`, \`razorpayEnabled\`, \`createdAt\`, \`updatedAt\`)
     VALUES (?, ?, NOW(3), NOW(3))
     ON DUPLICATE KEY UPDATE \`razorpayEnabled\` = VALUES(\`razorpayEnabled\`), \`updatedAt\` = NOW(3)`,
    PAYMENT_SETTINGS_ID,
    enabled ? 1 : 0,
  );
  return getPaymentSettings();
}
