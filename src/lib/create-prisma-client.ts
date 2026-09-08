import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

function resolveTursoConfig() {
  const url =
    process.env.TURSO_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.srk_TURSO_DATABASE_URL;

  const authToken =
    process.env.TURSO_AUTH_TOKEN ??
    process.env.srk_TURSO_AUTH_TOKEN;

  if (!url) return null;

  const isTurso =
    url.startsWith("libsql://") ||
    url.startsWith("https://") ||
    url.includes(".turso.io");

  if (!isTurso) return null;

  return { url, authToken };
}

export function createPrismaClient(options?: { log?: ("error" | "warn" | "info" | "query")[] }) {
  const turso = resolveTursoConfig();

  if (turso) {
    const adapter = new PrismaLibSQL({
      url: turso.url,
      authToken: turso.authToken,
    });
    return new PrismaClient({
      adapter,
      log: options?.log ?? (process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]),
    });
  }

  return new PrismaClient({
    log: options?.log ?? (process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]),
  });
}

export function getTursoDatabaseUrl(): string | undefined {
  return resolveTursoConfig()?.url;
}

export function getTursoAuthToken(): string | undefined {
  return resolveTursoConfig()?.authToken;
}
