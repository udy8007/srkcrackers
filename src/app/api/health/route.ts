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
        DATABASE_URL: envSet("DATABASE_URL"),
        AUTH_SECRET: envSet("AUTH_SECRET"),
        NEXTAUTH_SECRET: envSet("NEXTAUTH_SECRET"),
        AUTH_TRUST_HOST: envSet("AUTH_TRUST_HOST"),
        CRON_SECRET: envSet("CRON_SECRET"),
        RAZORPAY_KEY_ID: envSet("RAZORPAY_KEY_ID") || envSet("NEXT_PUBLIC_RAZORPAY_KEY_ID"),
        RAZORPAY_KEY_SECRET: envSet("RAZORPAY_KEY_SECRET"),
      },
      error,
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
