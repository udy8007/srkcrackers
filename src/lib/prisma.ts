import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prefer DATABASE_URL (local / Vercel); fall back to Supabase integration vars (`srk_POSTGRES_*`).
 */
const connectionUrl =
  process.env.DATABASE_URL ??
  process.env.srk_POSTGRES_PRISMA_URL ??
  process.env.srk_POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  process.env.POSTGRES_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(connectionUrl ? { datasourceUrl: connectionUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type {
  AdminUser,
  Category,
  Product,
  Order,
  OrderItem,
  OrderStatusHistory,
  SiteVisit,
  EmailSettings,
  EmailLog,
  AdminNotification,
  BackupSettings,
  DbBackupLog,
  SchedulerState,
  AdminDeviceToken,
  FirebaseSettings,
  OrderStatus,
  UserRole,
  BackupFrequency,
} from "@prisma/client";
