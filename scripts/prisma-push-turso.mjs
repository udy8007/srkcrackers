/**
 * Push Prisma schema to remote Turso (LibSQL).
 * Prisma CLI requires file: URLs for sqlite, so we generate DDL and apply via @libsql/client.
 */
import { execSync } from "node:child_process";
import { createClient } from "@libsql/client";
import { writeFileSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const TURSO_URL =
  process.env.TURSO_DATABASE_URL ??
  process.env.DATABASE_URL ??
  process.env.srk_TURSO_DATABASE_URL;

const TURSO_TOKEN =
  process.env.TURSO_AUTH_TOKEN ??
  process.env.srk_TURSO_AUTH_TOKEN ??
  "";

if (!TURSO_URL?.includes("turso.io") && !TURSO_URL?.startsWith("libsql://")) {
  console.error("[prisma-push-turso] Set TURSO_DATABASE_URL to a libsql:// URL.");
  process.exit(1);
}

const tmpDb = join(process.cwd(), ".turso-push-temp.db");
const tmpSql = join(process.cwd(), ".turso-push-temp.sql");

function toFileUrl(path) {
  return `file:///${path.replace(/\\/g, "/")}`;
}

function generateSql() {
  writeFileSync(tmpDb, "");
  try {
    execSync(
      `npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script -o "${tmpSql}"`,
      {
        env: { ...process.env, DATABASE_URL: toFileUrl(tmpDb) },
        stdio: ["inherit", "pipe", "inherit"],
      },
    );
    return readFileSync(tmpSql, "utf8");
  } finally {
    for (const f of [tmpDb, tmpSql]) {
      try {
        unlinkSync(f);
      } catch {
        /* ignore */
      }
    }
  }
}

function splitStatements(sql) {
  return sql
    .replace(/\r\n/g, "\n")
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);
}

async function applyToTurso(sql) {
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  const statements = splitStatements(sql);

  let applied = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await client.execute(`${stmt};`);
      applied++;
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (/already exists|duplicate column name/i.test(msg)) {
        skipped++;
        continue;
      }
      console.error(`[prisma-push-turso] Failed on:\n${stmt.slice(0, 200)}...`);
      throw err;
    }
  }

  console.log(`[prisma-push-turso] Applied ${applied} statements, skipped ${skipped} (already exist).`);
  await client.close();
}

const sql = generateSql();
const statements = splitStatements(sql);
console.log(`[prisma-push-turso] Generated ${statements.length} DDL statements`);
await applyToTurso(sql);
