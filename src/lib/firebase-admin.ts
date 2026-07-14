import "server-only";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { cert, deleteApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import { getMessaging } from "firebase-admin/messaging";
import {
  parseAndValidateServiceAccount,
  type ServiceAccountJson,
} from "@/lib/firebase-service-account";

const APP_NAME = "srk-cracker-admin";

function parseJsonString(raw: string | null | undefined): ServiceAccountJson | null {
  if (!raw?.trim()) return null;
  const result = parseAndValidateServiceAccount(raw.trim());
  return result.ok ? result.json : null;
}

function loadServiceAccountFromFile(): ServiceAccountJson | null {
  const file =
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE?.trim() ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!file) return null;
  const abs = resolve(process.cwd(), file);
  if (!existsSync(abs)) {
    console.error("[firebase-admin] FIREBASE_SERVICE_ACCOUNT_FILE not found:", abs);
    return null;
  }
  try {
    return parseJsonString(readFileSync(abs, "utf8"));
  } catch (error) {
    console.error("[firebase-admin] Failed reading service account file:", error);
    return null;
  }
}

/**
 * Resolve service account for Admin SDK.
 * Order: env JSON → credentials file → Firestore `firebaseSettings/default`.
 */
export async function resolveServiceAccount(): Promise<ServiceAccountJson | null> {
  const fromEnv = parseJsonString(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (fromEnv) return fromEnv;

  const fromFile = loadServiceAccountFromFile();
  if (fromFile) return fromFile;

  try {
    if (getApps().length > 0) {
      const snap = await getFirestore().collection("firebaseSettings").doc("default").get();
      const data = snap.data();
      return parseJsonString(data?.serviceAccountJson as string | undefined);
    }
  } catch (error) {
    console.error("[firebase-admin] Failed reading firebaseSettings:", error);
  }

  return null;
}

export async function getFirebaseStatus(): Promise<{
  configured: boolean;
  projectId: string | null;
  clientEmail: string | null;
  source: "database" | "env" | "file" | null;
}> {
  const fromEnv = parseJsonString(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (fromEnv) {
    return {
      configured: true,
      projectId: fromEnv.project_id ?? null,
      clientEmail: fromEnv.client_email ?? null,
      source: "env",
    };
  }

  const fromFile = loadServiceAccountFromFile();
  if (fromFile) {
    return {
      configured: true,
      projectId: fromFile.project_id ?? null,
      clientEmail: fromFile.client_email ?? null,
      source: "file",
    };
  }

  try {
    await ensureFirebaseApp();
    const snap = await getFirestore().collection("firebaseSettings").doc("default").get();
    const data = snap.data();
    const fromDb = parseJsonString(data?.serviceAccountJson as string | undefined);
    if (fromDb) {
      return {
        configured: true,
        projectId: fromDb.project_id ?? (data?.projectId as string) ?? null,
        clientEmail: fromDb.client_email ?? (data?.clientEmail as string) ?? null,
        source: "database",
      };
    }
  } catch {
    /* not configured */
  }

  return { configured: false, projectId: null, clientEmail: null, source: null };
}

export async function resetFirebaseApp(): Promise<void> {
  const apps = getApps();
  await Promise.all(apps.map((app) => deleteApp(app).catch(() => undefined)));
}

export async function ensureFirebaseApp(): Promise<{ app: App; projectId: string }> {
  const sa = await resolveServiceAccount();
  if (!sa?.project_id || !sa.client_email || !sa.private_key) {
    throw new Error(
      "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON in env (project srk-cracker).",
    );
  }

  const existing = getApps().find((a) => a.name === APP_NAME) ?? getApps()[0];
  if (existing) {
    const existingProject = existing.options.projectId;
    if (existingProject && existingProject !== sa.project_id) {
      await deleteApp(existing).catch(() => undefined);
    } else {
      return { app: existing, projectId: sa.project_id };
    }
  }

  const bucket =
    process.env.FIREBASE_STORAGE_BUCKET || `${sa.project_id}.appspot.com`;

  const app = initializeApp(
    {
      credential: cert({
        projectId: sa.project_id,
        clientEmail: sa.client_email,
        privateKey: sa.private_key.replace(/\\n/g, "\n"),
      }),
      projectId: sa.project_id,
      storageBucket: bucket,
    },
    APP_NAME,
  );

  return { app, projectId: sa.project_id };
}

export async function getFirebaseAppOrNull(): Promise<{ app: App; projectId: string } | null> {
  try {
    return await ensureFirebaseApp();
  } catch {
    return null;
  }
}

export async function db(): Promise<Firestore> {
  const { app } = await ensureFirebaseApp();
  return getFirestore(app);
}

export async function storage(): Promise<Storage> {
  const { app } = await ensureFirebaseApp();
  return getStorage(app);
}

export async function messaging() {
  const { app } = await ensureFirebaseApp();
  return getMessaging(app);
}

export async function getFirebaseProjectId(): Promise<string | null> {
  const status = await getFirebaseStatus();
  return status.projectId;
}

export type { ServiceAccountJson };
export { parseAndValidateServiceAccount, getMessaging };
