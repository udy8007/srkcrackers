import { PrismaClient } from "@prisma/client";

function cleanEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  let next = value.trim();
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }
  return next || undefined;
}

export function resolveDatabaseUrl(): string | undefined {
  return cleanEnv(process.env.DATABASE_URL ?? process.env.srk_DATABASE_URL);
}

export function createPrismaClient(options?: { log?: ("error" | "warn" | "info" | "query")[] }) {
  const log =
    options?.log ?? (process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]);
  const datasourceUrl = resolveDatabaseUrl();

  if (datasourceUrl) {
    return new PrismaClient({ log, datasourceUrl });
  }

  return new PrismaClient({ log });
}
