import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Resolve the database connection URL.
 * Prefer the standard DATABASE_URL (set locally and in Vercel Project Settings);
 * fall back to the Neon–Vercel integration variables (prefixed `skr_`).
 */
const connectionUrl =
  process.env.DATABASE_URL ??
  process.env["skr_POSTGRES_PRISMA_URL"] ??
  process.env["skr_DATABASE_URL"];

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(connectionUrl ? { datasourceUrl: connectionUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
