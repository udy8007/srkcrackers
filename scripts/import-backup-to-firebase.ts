/**
 * Import winter-sun Neon backup (or live Neon dump) into Firebase Firestore + Storage.
 *
 * Usage:
 *   npx tsx scripts/import-backup-to-firebase.ts [path-to-backup.json]
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in env (.env / .env.local).
 * Admin user: set ADMIN_EMAIL + ADMIN_PASSWORD to create/reset login after import
 * (backup password hashes are redacted).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import bcrypt from "bcryptjs";
import { initializeApp, cert, getApps, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    const p = join(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq < 0) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  }
}

loadEnvFiles();

function parseSa() {
  const file =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (file) {
    const abs = resolve(process.cwd(), file);
    if (!existsSync(abs)) throw new Error(`FIREBASE_SERVICE_ACCOUNT_FILE not found: ${abs}`);
    return JSON.parse(readFileSync(abs, "utf8")) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) {
    throw new Error(
      "Set FIREBASE_SERVICE_ACCOUNT_FILE=.firebase-service-account.json (or FIREBASE_SERVICE_ACCOUNT_JSON)",
    );
  }
  return JSON.parse(raw) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
}

function toTs(value: unknown): Timestamp | null {
  if (value == null) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return Timestamp.fromDate(d);
}

function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === undefined) continue;
    if (
      k.endsWith("At") ||
      k === "createdAt" ||
      k === "updatedAt" ||
      k === "expectedDeliveryAt" ||
      k === "lastPendingReminderAt" ||
      k === "lastBackupAt" ||
      k === "lastTickAt" ||
      k === "lastDeliverAt" ||
      k === "lastReminderAt"
    ) {
      out[k] = toTs(v) ?? v;
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function writeCollection(
  name: string,
  rows: Record<string, unknown>[],
) {
  const db = getFirestore();
  let written = 0;
  for (let i = 0; i < rows.length; i += 400) {
    const chunk = rows.slice(i, i + 400);
    const batch = db.batch();
    for (const row of chunk) {
      const id = String(row.id ?? db.collection(name).doc().id);
      const ref = db.collection(name).doc(id);
      batch.set(ref, serializeRow({ ...row, id }), { merge: true });
      written += 1;
    }
    await batch.commit();
  }
  console.log(`  ${name}: ${written}`);
}

async function uploadLocalImage(
  productId: string,
  imageUrl: string,
): Promise<string> {
  if (!imageUrl.startsWith("/")) return imageUrl;
  const abs = join(process.cwd(), "public", imageUrl.replace(/^\//, ""));
  if (!existsSync(abs)) return imageUrl;
  const bucket = getStorage().bucket();
  const ext = imageUrl.split(".").pop() || "jpg";
  const dest = `products/${productId}/imported.${ext}`;
  await bucket.upload(abs, {
    destination: dest,
    metadata: {
      contentType:
        ext === "png"
          ? "image/png"
          : ext === "svg"
            ? "image/svg+xml"
            : ext === "webp"
              ? "image/webp"
              : "image/jpeg",
    },
    public: true,
  });
  try {
    await bucket.file(dest).makePublic();
  } catch {
    /* ignore */
  }
  return `https://storage.googleapis.com/${bucket.name}/${dest}`;
}

function findLatestBackup(explicit?: string): string {
  if (explicit) return resolve(explicit);
  const dir = join(process.cwd(), "backups");
  if (!existsSync(dir)) {
    throw new Error("No backups/ folder. Pass a JSON path, or create a backup first.");
  }
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => join(dir, f))
    .sort();
  if (files.length === 0) throw new Error("No .json backups found in backups/");
  return files[files.length - 1];
}

async function main() {
  const backupPath = findLatestBackup(process.argv[2]);
  console.log("Reading", backupPath);
  const payload = JSON.parse(readFileSync(backupPath, "utf8")) as {
    meta?: { tableCounts?: Record<string, number> };
    data: Record<string, Record<string, unknown>[]>;
  };

  const sa = parseSa();
  for (const app of getApps()) {
    await deleteApp(app).catch(() => undefined);
  }
  const bucket = process.env.FIREBASE_STORAGE_BUCKET || `${sa.project_id}.appspot.com`;
  initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
    projectId: sa.project_id,
    storageBucket: bucket,
  });

  console.log("Importing into Firebase project", sa.project_id);

  const data = payload.data;
  const map: Array<[string, string]> = [
    ["categories", "categories"],
    ["products", "products"],
    ["orders", "orders"],
    ["orderItems", "orderItems"],
    ["orderStatusHistory", "orderStatusHistory"],
    ["siteVisits", "siteVisits"],
    ["emailSettings", "emailSettings"],
    ["emailLogs", "emailLogs"],
    ["adminNotifications", "adminNotifications"],
    ["backupSettings", "backupSettings"],
    ["dbBackupLogs", "dbBackupLogs"],
    ["adminDeviceTokens", "adminDeviceTokens"],
    ["schedulerState", "schedulerState"],
  ];

  // Products — upload local images when possible
  const products = [...(data.products ?? [])];
  for (const p of products) {
    const id = String(p.id);
    const imageUrl = String(p.imageUrl ?? "");
    if (imageUrl.startsWith("/")) {
      try {
        p.imageUrl = await uploadLocalImage(id, imageUrl);
      } catch (e) {
        console.warn("  image skip", id, (e as Error).message);
      }
    }
  }
  data.products = products;

  for (const [from, to] of map) {
    await writeCollection(to, data[from] ?? []);
  }

  // Admin user from env (backup hashes are redacted)
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  if (email && password) {
    const hash = await bcrypt.hash(password, 10);
    const id =
      (data.adminUsers?.[0]?.id as string | undefined) ||
      getFirestore().collection("adminUsers").doc().id;
    await getFirestore()
      .collection("adminUsers")
      .doc(id)
      .set(
        {
          id,
          email,
          name: "Admin",
          passwordHash: hash,
          role: "ADMIN",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
        { merge: true },
      );
    console.log("  adminUsers: seeded", email);
  } else {
    console.warn(
      "  adminUsers: skipped (set ADMIN_EMAIL + ADMIN_PASSWORD to create login)",
    );
  }

  console.log("Done.", payload.meta?.tableCounts ?? {});
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
