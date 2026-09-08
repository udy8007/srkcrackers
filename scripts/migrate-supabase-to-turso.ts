/**
 * One-time migration: export all tables from Supabase Postgres → import into Turso LibSQL.
 *
 * Usage:
 *   SUPABASE_DATABASE_URL="postgresql://..." \
 *   TURSO_DATABASE_URL="libsql://..." \
 *   TURSO_AUTH_TOKEN="..." \
 *   npx tsx scripts/migrate-supabase-to-turso.ts
 */
import pg from "pg";
import { createPrismaClient } from "../src/lib/create-prisma-client";

const SUPABASE_URL =
  process.env.SUPABASE_DATABASE_URL ??
  process.env.DIRECT_URL ??
  process.env.DATABASE_URL;

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!SUPABASE_URL?.startsWith("postgres")) {
  console.error("Set SUPABASE_DATABASE_URL (or DIRECT_URL) to the old Supabase Postgres URL.");
  process.exit(1);
}
if (!TURSO_URL) {
  console.error("Set TURSO_DATABASE_URL to the new Turso libsql URL.");
  process.exit(1);
}

/** Tables in FK-safe insert order. */
const TABLES = [
  "AdminUser",
  "Category",
  "Product",
  "Order",
  "OrderItem",
  "ProductReview",
  "SiteVisit",
  "OrderStatusHistory",
  "EmailSettings",
  "EmailLog",
  "AdminNotification",
  "AdminPushLog",
  "BackupSettings",
  "DbBackupLog",
  "SchedulerState",
  "AdminDeviceToken",
  "FirebaseSettings",
  "AuditLog",
  "ReportEmailSettings",
  "ArchiveSettings",
  "ArchiveLog",
] as const;

type TableName = (typeof TABLES)[number];

/** Prisma model delegate map for createMany. */
const MODEL_MAP: Record<TableName, string> = {
  AdminUser: "adminUser",
  Category: "category",
  Product: "product",
  Order: "order",
  OrderItem: "orderItem",
  ProductReview: "productReview",
  SiteVisit: "siteVisit",
  OrderStatusHistory: "orderStatusHistory",
  EmailSettings: "emailSettings",
  EmailLog: "emailLog",
  AdminNotification: "adminNotification",
  AdminPushLog: "adminPushLog",
  BackupSettings: "backupSettings",
  DbBackupLog: "dbBackupLog",
  SchedulerState: "schedulerState",
  AdminDeviceToken: "adminDeviceToken",
  FirebaseSettings: "firebaseSettings",
  AuditLog: "auditLog",
  ReportEmailSettings: "reportEmailSettings",
  ArchiveSettings: "archiveSettings",
  ArchiveLog: "archiveLog",
};

function coerceRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value instanceof Date) {
      out[key] = value.toISOString();
    } else {
      out[key] = value;
    }
  }
  return out;
}

async function exportFromPostgres(): Promise<Record<TableName, Record<string, unknown>[]>> {
  const connUrl = SUPABASE_URL!.replace(/[?&]sslmode=[^&]*/g, "").replace(/\?$/, "");
  const client = new pg.Client({
    connectionString: connUrl,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log("[export] Connected to Supabase Postgres");

  const data = {} as Record<TableName, Record<string, unknown>[]>;

  for (const table of TABLES) {
    const result = await client.query(`SELECT * FROM "${table}"`);
    data[table] = result.rows.map(coerceRow);
    console.log(`[export] ${table}: ${result.rows.length} rows`);
  }

  await client.end();
  return data;
}

async function pushSchema() {
  const { execSync } = await import("node:child_process");
  console.log("[schema] Pushing schema to Turso...");
  execSync("node scripts/prisma-push-turso.mjs", {
    stdio: "inherit",
    env: {
      ...process.env,
      TURSO_DATABASE_URL: TURSO_URL!,
      TURSO_AUTH_TOKEN: TURSO_TOKEN ?? "",
    },
  });
}

async function importToTurso(data: Record<TableName, Record<string, unknown>[]>) {
  process.env.DATABASE_URL = TURSO_URL!;
  process.env.TURSO_DATABASE_URL = TURSO_URL!;
  process.env.TURSO_AUTH_TOKEN = TURSO_TOKEN ?? "";

  const prisma = createPrismaClient();
  console.log("[import] Connected to Turso via Prisma");

  for (const table of TABLES) {
    const rows = data[table];
    if (!rows.length) {
      console.log(`[import] ${table}: skipped (0 rows)`);
      continue;
    }

    const delegate = MODEL_MAP[table];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[delegate];

    await model.createMany({
      data: rows,
    });

    console.log(`[import] ${table}: ${rows.length} rows inserted`);
  }

  await prisma.$disconnect();
}

async function verify(data: Record<TableName, Record<string, unknown>[]>) {
  process.env.DATABASE_URL = TURSO_URL!;
  process.env.TURSO_DATABASE_URL = TURSO_URL!;
  process.env.TURSO_AUTH_TOKEN = TURSO_TOKEN ?? "";

  const prisma = createPrismaClient();
  let ok = true;

  for (const table of TABLES) {
    const delegate = MODEL_MAP[table];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const count = await (prisma as any)[delegate].count();
    const expected = data[table].length;
    const match = count === expected;
    if (!match) ok = false;
    console.log(`[verify] ${table}: ${count}/${expected} ${match ? "OK" : "MISMATCH"}`);
  }

  await prisma.$disconnect();
  return ok;
}

async function main() {
  console.log("=== Supabase → Turso Migration ===\n");

  const data = await exportFromPostgres();
  const totalExported = Object.values(data).reduce((s, rows) => s + rows.length, 0);
  console.log(`\n[export] Total rows exported: ${totalExported}\n`);

  await pushSchema();
  console.log("");
  await importToTurso(data);
  console.log("");
  const ok = await verify(data);

  if (!ok) {
    console.error("\n[done] Migration completed with row count mismatches — review above.");
    process.exit(1);
  }

  console.log("\n[done] Migration completed successfully.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
