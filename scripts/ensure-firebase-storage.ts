/**
 * Create / link the default Firebase Storage bucket if missing.
 *   npx tsx scripts/ensure-firebase-storage.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { GoogleAuth } from "google-auth-library";
import { initializeApp, cert, getApps, deleteApp } from "firebase-admin/app";
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
  const saPath = resolve(process.cwd(), file);
  const sa = JSON.parse(readFileSync(saPath, "utf8")) as {
    project_id: string;
    client_email: string;
    private_key: string;
  };
  const preferred =
    process.env.FIREBASE_STORAGE_BUCKET?.trim() ||
    `${sa.project_id}.firebasestorage.app`;

  console.log("project", sa.project_id);
  console.log("preferred bucket", preferred);

  // 1) Firebase defaultBucket.create REST (needs Blaze + firebasestorage permission)
  const auth = new GoogleAuth({
    credentials: {
      client_email: sa.client_email,
      private_key: sa.private_key.replace(/\\n/g, "\n"),
    },
    scopes: [
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/firebase",
    ],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const accessToken = token.token;
  if (!accessToken) throw new Error("Could not get access token from service account");

  const createUrl = `https://firebasestorage.googleapis.com/v1alpha/projects/${sa.project_id}/defaultBucket`;
  console.log("POST", createUrl);
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: `projects/${sa.project_id}/defaultBucket`,
      location: "US-CENTRAL1",
    }),
  });
  const createBody = await createRes.text();
  console.log("defaultBucket.create status", createRes.status, createBody.slice(0, 500));

  // 2) Fallback: raw GCS bucket create
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
    storageBucket: preferred,
  });

  const bucket = getStorage().bucket(preferred);
  let [exists] = await bucket.exists();
  if (!exists) {
    console.log("Creating GCS bucket via Admin SDK:", preferred);
    try {
      await bucket.create({
        location: "US-CENTRAL1",
        storageClass: "STANDARD",
        iamConfiguration: {
          uniformBucketLevelAccess: { enabled: true },
        },
      });
      console.log("GCS create OK");
    } catch (e) {
      console.error("GCS create failed:", (e as Error).message);
    }
    [exists] = await bucket.exists();
  }

  if (!exists) {
    // try legacy appspot name
    const legacy = `${sa.project_id}.appspot.com`;
    console.log("Trying legacy bucket", legacy);
    const legacyBucket = getStorage().bucket(legacy);
    const [legacyExists] = await legacyBucket.exists();
    console.log("legacy.exists", legacyExists);
    if (!legacyExists) {
      try {
        await legacyBucket.create({
          location: "US-CENTRAL1",
          storageClass: "STANDARD",
        });
        console.log("legacy create OK — set FIREBASE_STORAGE_BUCKET=" + legacy);
      } catch (e) {
        console.error("legacy create failed:", (e as Error).message);
      }
    } else {
      console.log("Use FIREBASE_STORAGE_BUCKET=" + legacy);
    }
  }

  const finalBucket = getStorage().bucket();
  const [finalExists] = await finalBucket.exists();
  console.log("final bucket", finalBucket.name, "exists=", finalExists);
  if (!finalExists) {
    process.exitCode = 1;
    console.error(
      "\nStorage still missing. Open Firebase Console → Storage → Get started\n" +
        `(project must be on Blaze for new default buckets):\n` +
        `https://console.firebase.google.com/project/${sa.project_id}/storage`,
    );
    return;
  }

  const testPath = "products/_migrate-probe/ping.txt";
  await finalBucket.file(testPath).save(Buffer.from(`ok ${new Date().toISOString()}`), {
    contentType: "text/plain",
    resumable: false,
  });
  console.log("probe write OK", `gs://${finalBucket.name}/${testPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
