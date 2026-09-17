import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** Lightweight liveness check — call GET /api/health to verify the app is up. */
function envSet(name: string): boolean {
  const value = process.env[name]?.trim();
  return Boolean(value);
}

export async function GET() {
  let database: "up" | "down" = "down";
  let error: string | null = null;

  try {
    await prisma.$queryRaw`SELECT 1`;
    database = "up";
  } catch (err) {
    database = "down";
    error = err instanceof Error ? err.message : "unknown";
  }

  const ok = database === "up";

  return NextResponse.json(
    {
      status: ok ? "ok" : "degraded",
      database,
      env: {
        TURSO_DATABASE_URL: envSet("TURSO_DATABASE_URL"),
        TURSO_AUTH_TOKEN: envSet("TURSO_AUTH_TOKEN"),
        DATABASE_URL: envSet("DATABASE_URL"),
        AUTH_SECRET: envSet("AUTH_SECRET"),
        NEXTAUTH_SECRET: envSet("NEXTAUTH_SECRET"),
        AUTH_TRUST_HOST: envSet("AUTH_TRUST_HOST"),
        NEXTAUTH_URL: envSet("NEXTAUTH_URL"),
        AUTH_URL: envSet("AUTH_URL"),
        CRON_SECRET: envSet("CRON_SECRET"),
      },
      error,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
