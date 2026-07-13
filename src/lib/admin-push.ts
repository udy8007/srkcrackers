import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { prisma } from "@/lib/prisma";

type ServiceAccountJson = {
  project_id?: string;
  client_email?: string;
  private_key?: string;
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

function getFirebaseApp(): App | null {
  const existing = getApps()[0];
  if (existing) return existing;

  const sa = parseServiceAccount();
  if (!sa?.project_id || !sa.client_email || !sa.private_key) {
    return null;
  }

  return initializeApp({
    credential: cert({
      projectId: sa.project_id,
      clientEmail: sa.client_email,
      privateKey: sa.private_key.replace(/\\n/g, "\n"),
    }),
  });
}

export type AdminPushPayload = {
  title: string;
  body: string;
  targetUrl: string;
  data?: Record<string, string>;
};

/** Send FCM to every registered admin device. Never throws. */
export async function sendAdminPush(payload: AdminPushPayload): Promise<{ sent: number }> {
  const app = getFirebaseApp();
  if (!app) {
    console.warn(
      "[admin-push] Skipped: set FIREBASE_SERVICE_ACCOUNT_JSON to enable FCM (Firebase service account).",
    );
    return { sent: 0 };
  }

  const devices = await prisma.adminDeviceToken.findMany({
    select: { id: true, token: true },
  });
  if (devices.length === 0) return { sent: 0 };

  const data: Record<string, string> = {
    target_url: payload.targetUrl,
    ...(payload.data ?? {}),
  };

  const messaging = getMessaging(app);
  let sent = 0;
  const staleIds: string[] = [];

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
              channelId: "admin_orders",
            },
          },
        });
        sent += 1;
      } catch (error: unknown) {
        const code =
          error && typeof error === "object" && "code" in error
            ? String((error as { code: unknown }).code)
            : "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token") ||
          code.includes("invalid-argument")
        ) {
          staleIds.push(device.id);
        } else {
          console.error("[admin-push] Send failed:", error);
        }
      }
    }),
  );

  if (staleIds.length > 0) {
    await prisma.adminDeviceToken.deleteMany({ where: { id: { in: staleIds } } });
    console.warn(`[admin-push] Removed ${staleIds.length} stale FCM token(s)`);
  }

  return { sent };
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
