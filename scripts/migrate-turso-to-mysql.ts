/**
 * One-time migration: export all tables from Turso LibSQL → import into MySQL.
 *
 * Usage (keep Turso env vars until this script finishes):
 *   TURSO_DATABASE_URL="libsql://..." \
 *   TURSO_AUTH_TOKEN="..." \
 *   DATABASE_URL="mysql://..." \
 *   npx tsx scripts/migrate-turso-to-mysql.ts
 */
import { createClient } from "@libsql/client";
import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createPrismaClient } from "../src/lib/create-prisma-client";

function loadEnvFile(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
const MYSQL_URL = process.env.DATABASE_URL;

if (!TURSO_URL?.startsWith("libsql://") && !TURSO_URL?.includes(".turso.io")) {
  if (!process.argv.includes("--import-only")) {
    console.error("Set TURSO_DATABASE_URL to the existing Turso libsql URL.");
    process.exit(1);
  }
}
if (
  (!MYSQL_URL || !/^mysql(s)?:\/\//i.test(MYSQL_URL)) &&
  !process.argv.includes("--dump-only")
) {
  console.error("Set DATABASE_URL to the new mysql:// connection string.");
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
  "Enquiry",
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

const MODEL_MAP: Record<TableName, string> = {
  AdminUser: "adminUser",
  Category: "category",
  Product: "product",
  Order: "order",
  OrderItem: "orderItem",
  ProductReview: "productReview",
  Enquiry: "enquiry",
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

const BOOLEAN_FIELDS: Record<string, string[]> = {
  Category: ["active"],
  Product: ["active"],
  ProductReview: ["visible"],
  EmailSettings: [
    "enabled",
    "enableSsl",
    "notifyCustomerOrderPlaced",
    "notifyCustomerStatusChange",
    "notifyCustomerDelivered",
    "notifyAdminNewOrder",
    "notifyAdminStatusChange",
    "notifyAdminPendingReminder",
    "notifyAdminNewEnquiry",
    "notifyCustomerEnquiryResolved",
    "notifyAdminEnquiryPendingReminder",
  ],
  AdminNotification: ["read"],
  BackupSettings: ["enabled", "includeScreenshots"],
  SchedulerState: ["enabled"],
  ReportEmailSettings: [
    "enabled",
    "includeSales",
    "includeOrders",
    "includeCatalog",
    "includeTraffic",
    "notifyPush",
  ],
  ArchiveSettings: [
    "enabled",
    "emailExportEnabled",
    "includeSiteVisits",
    "includeErrorLogs",
    "includeAuditLogs",
    "includeNotificationLog",
  ],
};

const DATE_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "expectedDeliveryAt",
  "lastPendingReminderAt",
  "resolvedAt",
  "lastBackupAt",
  "lastTickAt",
  "lastDeliverAt",
  "lastReminderAt",
  "lastSentAt",
  "lastArchiveAt",
]);

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    return v === "1" || v === "true" || v === "yes";
  }
  return Boolean(value);
}

function coerceRow(table: TableName, row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const bools = new Set(BOOLEAN_FIELDS[table] ?? []);

  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "bigint") {
      out[key] = Number(value);
      continue;
    }
    if (bools.has(key)) {
      out[key] = toBool(value);
      continue;
    }
    if (DATE_FIELDS.has(key)) {
      if (value instanceof Date) {
        out[key] = value;
      } else if (typeof value === "number") {
        const ms = value < 1e12 ? value * 1000 : value;
        out[key] = new Date(ms);
      } else {
        out[key] = new Date(String(value));
      }
      continue;
    }
    out[key] = value;
  }
  return out;
}

async function exportFromTurso(): Promise<Record<TableName, Record<string, unknown>[]>> {
  const client = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN });
  console.log("[export] Connected to Turso");

  const data = {} as Record<TableName, Record<string, unknown>[]>;

  for (const table of TABLES) {
    try {
      const result = await client.execute(`SELECT * FROM "${table}"`);
      const columns = result.columns;
      const rows = result.rows.map((row) => {
        const obj: Record<string, unknown> = {};
        for (const col of columns) {
          obj[col] = (row as Record<string, unknown>)[col];
        }
        return coerceRow(table, obj);
      });
      data[table] = rows;
      console.log(`[export] ${table}: ${rows.length} rows`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (/no such table/i.test(message)) {
        data[table] = [];
        console.log(`[export] ${table}: skipped (table missing)`);
        continue;
      }
      throw err;
    }
  }

  client.close();
  return data;
}

async function pushSchema() {
  console.log("[schema] Pushing Prisma schema to MySQL...");
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: {
      ...process.env,
      DATABASE_URL: MYSQL_URL!,
    },
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

async function importToMysql(data: Record<TableName, Record<string, unknown>[]>) {
  process.env.DATABASE_URL = MYSQL_URL!;
  const prisma = createPrismaClient();
  console.log("[import] Connected to MySQL via Prisma");

  for (const table of TABLES) {
    const rows = data[table];
    if (!rows.length) {
      console.log(`[import] ${table}: skipped (0 rows)`);
      continue;
    }

    const delegate = MODEL_MAP[table];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const model = (prisma as any)[delegate];
    const batches = chunk(rows, table === "Order" ? 25 : 100);

    for (const batch of batches) {
      await model.createMany({ data: batch, skipDuplicates: true });
    }

    console.log(`[import] ${table}: ${rows.length} rows inserted`);
  }

  await prisma.$disconnect();
}

async function verify(data: Record<TableName, Record<string, unknown>[]>) {
  process.env.DATABASE_URL = MYSQL_URL!;
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
  console.log("=== Turso → MySQL Migration ===\n");

  const dumpPath = process.env.DUMP_PATH ?? "tmp/turso-mysql-dump.json";
  const dumpOnly = process.argv.includes("--dump-only");
  const importOnly = process.argv.includes("--import-only");

  let data: Record<TableName, Record<string, unknown>[]>;

  if (importOnly && existsSync(dumpPath)) {
    data = JSON.parse(readFileSync(dumpPath, "utf8")) as Record<
      TableName,
      Record<string, unknown>[]
    >;
    console.log(`[dump] Loaded ${dumpPath}`);
  } else {
    data = await exportFromTurso();
    const { mkdirSync, writeFileSync } = await import("node:fs");
    mkdirSync("tmp", { recursive: true });
    writeFileSync(dumpPath, JSON.stringify(data));
    console.log(`[dump] Wrote ${dumpPath}`);
  }

  const totalExported = Object.values(data).reduce((s, rows) => s + rows.length, 0);
  console.log(`\n[export] Total rows: ${totalExported}\n`);

  if (dumpOnly) {
    console.log("[done] Dump only — skipping MySQL import.");
    return;
  }

  execSync("npx prisma generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: MYSQL_URL! },
  });

  await pushSchema();
  console.log("");
  await importToMysql(data);
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
