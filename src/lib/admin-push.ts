import "server-only";
import {
  ensureFirebaseApp,
  getFirebaseAppOrNull,
  getFirebaseProjectId,
  getFirebaseStatus,
  messaging,
  parseAndValidateServiceAccount,
  resetFirebaseApp,
  resolveServiceAccount,
  type ServiceAccountJson,
} from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";

export const FIREBASE_SETTINGS_ID = "default";
export type { ServiceAccountJson };
export {
  parseAndValidateServiceAccount,
  getFirebaseStatus,
  resetFirebaseApp,
  resolveServiceAccount,
  getFirebaseProjectId,
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
  const firebase = await getFirebaseAppOrNull();
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

  const fcm = await messaging();
  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];
  const failures: AdminPushFailure[] = [];

  await Promise.all(
    devices.map(async (device) => {
      try {
        await fcm.send({
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
  await ensureFirebaseApp();
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
