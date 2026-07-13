import "server-only";
import { cert, deleteApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";
import {
  parseAndValidateServiceAccount,
  type ServiceAccountJson,
} from "@/lib/firebase-service-account";

export const FIREBASE_SETTINGS_ID = "default";
export type { ServiceAccountJson };
export { parseAndValidateServiceAccount };

export type AdminPushFailure = {
  code: string;
  message: string;
};

export type AdminPushResult = {
  sent: number;
  failed: number;
  removed: number;
  projectId: string | null;
  failures: AdminPushFailure[];
};

function parseJsonString(raw: string | null | undefined): ServiceAccountJson | null {
  if (!raw?.trim()) return null;
  const result = parseAndValidateServiceAccount(raw.trim());
  return result.ok ? result.json : null;
}

/** Prefer DB upload, then Vercel env. */
export async function resolveServiceAccount(): Promise<ServiceAccountJson | null> {
  try {
    const row = await prisma.firebaseSettings.findUnique({
      where: { id: FIREBASE_SETTINGS_ID },
      select: { serviceAccountJson: true },
    });
    const fromDb = parseJsonString(row?.serviceAccountJson);
    if (fromDb) return fromDb;
  } catch (error) {
    console.error("[admin-push] Failed reading FirebaseSettings:", error);
  }

  return parseJsonString(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
}

export async function getFirebaseStatus(): Promise<{
  configured: boolean;
  projectId: string | null;
  clientEmail: string | null;
  source: "database" | "env" | null;
}> {
  try {
    const row = await prisma.firebaseSettings.findUnique({
      where: { id: FIREBASE_SETTINGS_ID },
      select: { serviceAccountJson: true, projectId: true, clientEmail: true },
    });
    const fromDb = parseJsonString(row?.serviceAccountJson);
    if (fromDb) {
      return {
        configured: true,
        projectId: fromDb.project_id ?? row?.projectId ?? null,
        clientEmail: fromDb.client_email ?? row?.clientEmail ?? null,
        source: "database",
      };
    }
  } catch {
    /* table may not exist yet before migrate */
  }

  const fromEnv = parseJsonString(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (fromEnv) {
    return {
      configured: true,
      projectId: fromEnv.project_id ?? null,
      clientEmail: fromEnv.client_email ?? null,
      source: "env",
    };
  }

  return { configured: false, projectId: null, clientEmail: null, source: null };
}

/** Drop cached Admin SDK app so new credentials take effect. */
export async function resetFirebaseApp(): Promise<void> {
  const apps = getApps();
  await Promise.all(apps.map((app) => deleteApp(app).catch(() => undefined)));
}

async function getFirebaseApp(): Promise<{ app: App; projectId: string } | null> {
  const sa = await resolveServiceAccount();
  if (!sa?.project_id || !sa.client_email || !sa.private_key) {
    return null;
  }

  const existing = getApps()[0];
  if (existing) {
    const existingProject = existing.options.projectId;
    if (existingProject && existingProject !== sa.project_id) {
      await deleteApp(existing).catch(() => undefined);
    } else if (existing) {
      return { app: existing, projectId: sa.project_id };
    }
  }

  const app = initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
    projectId: sa.project_id,
  });

  return { app, projectId: sa.project_id };
}

function errorInfo(error: unknown): AdminPushFailure {
  if (error && typeof error === "object") {
    const code =
      "code" in error && error.code != null ? String(error.code) : "unknown";
    const message =
      "message" in error && error.message != null
        ? String(error.message)
        : String(error);
    return { code, message };
  }
  return { code: "unknown", message: String(error) };
}

function isStaleTokenError(code: string, message: string): boolean {
  const hay = `${code} ${message}`.toLowerCase();
  return (
    hay.includes("registration-token-not-registered") ||
    hay.includes("invalid-registration-token") ||
    hay.includes("requested entity was not found")
  );
}

export type AdminPushPayload = {
  title: string;
  body: string;
  targetUrl: string;
  data?: Record<string, string>;
};

/** Send FCM to every registered admin device. Never throws. */
export async function sendAdminPush(payload: AdminPushPayload): Promise<AdminPushResult> {
  const firebase = await getFirebaseApp();
  if (!firebase) {
    console.warn(
      "[admin-push] Skipped: upload Firebase service account in Admin → Settings (or set FIREBASE_SERVICE_ACCOUNT_JSON).",
    );
    return {
      sent: 0,
      failed: 0,
      removed: 0,
      projectId: null,
      failures: [
        {
          code: "missing-credentials",
          message:
            "Firebase service account is not configured. Upload it in Admin → Settings → Push notifications.",
        },
      ],
    };
  }

  const devices = await prisma.adminDeviceToken.findMany({
    select: { id: true, token: true },
  });
  if (devices.length === 0) {
    return {
      sent: 0,
      failed: 0,
      removed: 0,
      projectId: firebase.projectId,
      failures: [],
    };
  }

  const data: Record<string, string> = {
    target_url: payload.targetUrl,
    click_action: payload.targetUrl,
    ...(payload.data ?? {}),
  };

  const messaging = getMessaging(firebase.app);
  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];
  const failures: AdminPushFailure[] = [];

  await Promise.all(
    devices.map(async (device) => {
      try {
        await messaging.send({
          token: device.token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data,
          android: {
            priority: "high",
            notification: {
              title: payload.title,
              body: payload.body,
              sound: "default",
            },
          },
        });
        sent += 1;
      } catch (error: unknown) {
        failed += 1;
        const info = errorInfo(error);
        failures.push(info);
        console.error("[admin-push] Send failed:", info.code, info.message);

        if (isStaleTokenError(info.code, info.message)) {
          staleIds.push(device.id);
        }
      }
    }),
  );

  let removed = 0;
  if (staleIds.length > 0) {
    const result = await prisma.adminDeviceToken.deleteMany({
      where: { id: { in: staleIds } },
    });
    removed = result.count;
    console.warn(`[admin-push] Removed ${removed} stale FCM token(s)`);
  }

  return {
    sent,
    failed,
    removed,
    projectId: firebase.projectId,
    failures: failures.slice(0, 5),
  };
}

export async function registerAdminDeviceToken(input: {
  token: string;
  platform?: string;
  adminUserId?: string | null;
}) {
  const token = input.token.trim();
  if (!token) throw new Error("token required");

  return prisma.adminDeviceToken.upsert({
    where: { token },
    create: {
      token,
      platform: input.platform?.trim() || "android",
      adminUserId: input.adminUserId ?? null,
    },
    update: {
      platform: input.platform?.trim() || "android",
      adminUserId: input.adminUserId ?? null,
      updatedAt: new Date(),
    },
  });
}

export async function unregisterAdminDeviceToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return { count: 0 };
  return prisma.adminDeviceToken.deleteMany({ where: { token: trimmed } });
}

export async function getFirebaseProjectId(): Promise<string | null> {
  const status = await getFirebaseStatus();
  return status.projectId;
}
