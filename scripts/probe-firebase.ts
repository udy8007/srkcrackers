/**
 * One-shot: verify Firestore + Storage on srk-cracker.
 *   npx tsx scripts/probe-firebase.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { initializeApp, cert, getApps, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
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

async function main() {
  const file =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE?.trim() ||
    ".firebase-service-account.json";
  const sa = JSON.parse(readFileSync(resolve(process.cwd(), file), "utf8")) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET || `${sa.project_id}.appspot.com`;
  console.log("project", sa.project_id, "bucket", bucketName);

  for (const app of getApps()) {
    await deleteApp(app).catch(() => undefined);
  }
  initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
    projectId: sa.project_id,
    storageBucket: bucketName,
  });

  const bucket = getStorage().bucket();
  const [exists] = await bucket.exists();
  console.log("bucket.exists", exists);

  const testPath = "products/_migrate-probe/ping.txt";
  await bucket.file(testPath).save(Buffer.from(`ok ${new Date().toISOString()}`), {
    contentType: "text/plain",
    resumable: false,
  });
  try {
    await bucket.file(testPath).makePublic();
  } catch (e) {
    console.log("makePublic warn:", (e as Error).message);
  }
  console.log("write ok", testPath);

  const cats = await getFirestore().collection("categories").limit(3).get();
  console.log(
    "categories",
    cats.size,
    cats.docs.map((d) => d.data().key),
  );
  const prods = await getFirestore().collection("products").limit(3).get();
  console.log(
    "sample imageUrl",
    prods.docs.map((d) => d.data().imageUrl),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
