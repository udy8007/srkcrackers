import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient, type Config } from "@libsql/client/http";

/** HTTP Turso client — no native `libsql` binary (Windows build → Linux cPanel). */
class PrismaLibSQLHttp extends PrismaLibSQL {
  override createClient(config: Config) {
    return createClient(config) as ReturnType<PrismaLibSQL["createClient"]>;
  }
}

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

function resolveTursoConfig() {
  const url = cleanEnv(
    process.env.TURSO_DATABASE_URL ??
      process.env.DATABASE_URL ??
      process.env.srk_TURSO_DATABASE_URL,
  );

  const authToken = cleanEnv(
    process.env.TURSO_AUTH_TOKEN ?? process.env.srk_TURSO_AUTH_TOKEN,
  );

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
  const log =
    options?.log ?? (process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]);

  if (turso) {
    const adapter = new PrismaLibSQLHttp({
      url: turso.url,
      authToken: turso.authToken,
    });
    return new PrismaClient({ adapter, log });
  }

  return new PrismaClient({ log });
}

export function getTursoDatabaseUrl(): string | undefined {
  return resolveTursoConfig()?.url;
}

export function getTursoAuthToken(): string | undefined {
  return resolveTursoConfig()?.authToken;
}
