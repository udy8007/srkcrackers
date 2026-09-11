/**
 * Push Prisma schema to remote Turso (LibSQL).
 * Prisma CLI requires file: URLs for sqlite, so we mirror remote DDL into a temp
 * local DB, diff against schema.prisma, then apply incremental SQL via @libsql/client.
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

function cleanupTempFiles() {
  for (const f of [tmpDb, tmpSql]) {
    try {
      unlinkSync(f);
    } catch {
      /* ignore */
    }
  }
}

/** Mirror remote Turso tables into a temp local SQLite file for accurate diffs. */
async function mirrorRemoteToLocal(remoteClient) {
  writeFileSync(tmpDb, "");
  const localClient = createClient({ url: toFileUrl(tmpDb) });

  try {
    await localClient.execute("PRAGMA foreign_keys=OFF");

    const result = await remoteClient.execute(`
      SELECT sql FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
        AND name NOT LIKE '_prisma_%'
        AND sql IS NOT NULL
      ORDER BY name
    `);

    let mirrored = 0;
    for (const row of result.rows) {
      const ddl = String(row.sql ?? "").trim();
      if (!ddl) continue;
      try {
        await localClient.execute(ddl);
        mirrored++;
      } catch (err) {
        const msg = String(err?.message ?? err);
        console.warn(`[prisma-push-turso] Skipped mirror DDL (${msg.slice(0, 80)}…)`);
      }
    }

    console.log(`[prisma-push-turso] Mirrored ${mirrored} remote table(s) into temp DB`);
  } finally {
    await localClient.close();
  }
}

function generateIncrementalSql() {
  execSync(
    `npx prisma migrate diff --from-url "${toFileUrl(tmpDb)}" --to-schema-datamodel prisma/schema.prisma --script -o "${tmpSql}"`,
    {
      env: { ...process.env, DATABASE_URL: toFileUrl(tmpDb) },
      stdio: ["inherit", "pipe", "inherit"],
    },
  );
  return readFileSync(tmpSql, "utf8");
}

async function applyToTurso(remoteClient, sql) {
  const statements = splitStatements(sql);

  let applied = 0;
  let skipped = 0;

  for (const stmt of statements) {
    try {
      await remoteClient.execute(`${stmt};`);
      applied++;
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (/already exists|duplicate column name|duplicate index name/i.test(msg)) {
        skipped++;
        continue;
      }
      console.error(`[prisma-push-turso] Failed on:\n${stmt.slice(0, 200)}...`);
      throw err;
    }
  }

  console.log(`[prisma-push-turso] Applied ${applied} statements, skipped ${skipped} (already exist).`);
}

const remoteClient = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });

try {
  await mirrorRemoteToLocal(remoteClient);
  const sql = generateIncrementalSql();
  const statements = splitStatements(sql);
  console.log(`[prisma-push-turso] Generated ${statements.length} incremental DDL statement(s)`);

  if (statements.length === 0) {
    console.log("[prisma-push-turso] Schema is already up to date.");
  } else {
    await applyToTurso(remoteClient, sql);
  }
} finally {
  await remoteClient.close();
  cleanupTempFiles();
}
