import { createPrismaClient } from "@/lib/create-prisma-client";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

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
  AdminPushLog,
  BackupSettings,
  DbBackupLog,
  SchedulerState,
  AdminDeviceToken,
  FirebaseSettings,
  OrderStatus,
  UserRole,
  BackupFrequency,
} from "@prisma/client";
