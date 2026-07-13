import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getFirebaseProjectId,
  registerAdminDeviceToken,
  sendAdminPush,
} from "@/lib/admin-push";
import { resolveSiteOrigin } from "@/lib/email-settings";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Prefer the live APK token so we don't test against a stale DB row
  const liveToken = typeof body.token === "string" ? body.token.trim() : "";
  if (liveToken) {
    await registerAdminDeviceToken({
      token: liveToken,
      platform: "android",
      adminUserId: session.user.id,
    });
  }

  const deviceCount = await prisma.adminDeviceToken.count();
  if (deviceCount === 0) {
    return NextResponse.json(
      {
        error:
          "No FCM device tokens registered. Open the admin APK, sign in, and tap Register this device.",
        deviceCount: 0,
        sent: 0,
      },
      { status: 400 },
    );
  }

  const projectId = getFirebaseProjectId();
  if (!projectId) {
    return NextResponse.json(
      {
        error:
          "FIREBASE_SERVICE_ACCOUNT_JSON is not set or invalid. Add the Firebase service account JSON on Vercel (project must be srk-cracker).",
        deviceCount,
        sent: 0,
      },
      { status: 400 },
    );
  }

  const origin = resolveSiteOrigin();
  const result = await sendAdminPush({
    title: "Test Push — SRK Admin",
    body: "Push notifications are working. Tap to open Settings.",
    targetUrl: `${origin}/admin/settings`,
    data: { type: "TEST_PUSH" },
  });

  const afterCount = await prisma.adminDeviceToken.count();
  const firstFailure = result.failures[0];

  if (result.sent === 0) {
    const hint =
      firstFailure?.message?.toLowerCase().includes("sender") ||
      firstFailure?.message?.toLowerCase().includes("mismatch") ||
      firstFailure?.code?.includes("mismatched-credential")
        ? " Service account project must match the APK Firebase project (srk-cracker)."
        : "";

    return NextResponse.json(
      {
        ok: false,
        sent: 0,
        failed: result.failed,
        removed: result.removed,
        deviceCount: afterCount,
        projectId: result.projectId,
        error:
          (firstFailure
            ? `FCM error: ${firstFailure.code} — ${firstFailure.message}`
            : "No pushes delivered.") + hint,
        failures: result.failures,
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    removed: result.removed,
    deviceCount: afterCount,
    projectId: result.projectId,
    message: `Sent test push to ${result.sent} device(s).`,
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deviceCount, projectId] = await Promise.all([
    prisma.adminDeviceToken.count(),
    Promise.resolve(getFirebaseProjectId()),
  ]);

  return NextResponse.json({
    deviceCount,
    configured: Boolean(projectId),
    projectId,
  });
}
