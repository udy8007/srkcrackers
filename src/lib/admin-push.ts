import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
};

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

function parseServiceAccount(): ServiceAccountJson | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ServiceAccountJson;
  } catch (error) {
    console.error("[admin-push] Invalid FIREBASE_SERVICE_ACCOUNT_JSON:", error);
    return null;
  }
}

function getFirebaseApp(): { app: App; projectId: string } | null {
  const sa = parseServiceAccount();
  if (!sa?.project_id || !sa.client_email || !sa.private_key) {
    return null;
  }

  const existing = getApps()[0];
  if (existing) {
    return { app: existing, projectId: sa.project_id };
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
  const firebase = getFirebaseApp();
  if (!firebase) {
    console.warn(
      "[admin-push] Skipped: set FIREBASE_SERVICE_ACCOUNT_JSON to enable FCM (Firebase service account).",
    );
    return {
      sent: 0,
      failed: 0,
      removed: 0,
      projectId: null,
      failures: [
        {
          code: "missing-credentials",
          message: "FIREBASE_SERVICE_ACCOUNT_JSON is missing or invalid JSON",
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

  // FCM data values must be strings
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

export function getFirebaseProjectId(): string | null {
  return parseServiceAccount()?.project_id ?? null;
}
