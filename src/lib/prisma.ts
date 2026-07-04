import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Resolve the database connection URL.
 * Production uses the Neon–Vercel integration variables (prefixed `skr_`),
 * which cannot be renamed; local dev / Prisma CLI use the standard names.
 */
const connectionUrl =
  process.env["skr_POSTGRES_PRISMA_URL"] ??
  process.env["skr_DATABASE_URL"] ??
  process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(connectionUrl ? { datasourceUrl: connectionUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
