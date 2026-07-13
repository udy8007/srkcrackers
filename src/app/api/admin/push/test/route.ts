import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendAdminPush } from "@/lib/admin-push";
import { resolveSiteOrigin } from "@/lib/email-settings";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deviceCount = await prisma.adminDeviceToken.count();
  if (deviceCount === 0) {
    return NextResponse.json(
      {
        error:
          "No FCM device tokens registered. Open the admin APK, sign in, and wait for the token to register.",
        deviceCount: 0,
        sent: 0,
      },
      { status: 400 },
    );
  }

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim()) {
    return NextResponse.json(
      {
        error:
          "FIREBASE_SERVICE_ACCOUNT_JSON is not set on the server. Add the Firebase service account in Vercel env.",
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

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    deviceCount,
    message:
      result.sent > 0
        ? `Sent test push to ${result.sent} device(s).`
        : "No pushes delivered (tokens may be stale). Re-open the admin APK and try again.",
  });
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [deviceCount, configured] = await Promise.all([
    prisma.adminDeviceToken.count(),
    Promise.resolve(Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim())),
  ]);

  return NextResponse.json({ deviceCount, configured });
}
