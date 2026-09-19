import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { actorFromSession, writeAuditLog } from "@/lib/audit-log";
import { getPaymentSettings, setRazorpayEnabled } from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getPaymentSettings());
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { razorpayEnabled?: boolean };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.razorpayEnabled !== "boolean") {
    return NextResponse.json({ error: "razorpayEnabled is required" }, { status: 400 });
  }

  const settings = await setRazorpayEnabled(body.razorpayEnabled);
  await writeAuditLog({
    actor: actorFromSession(session.user),
    action: "PAYMENT_SETTINGS_UPDATED",
    entityType: "settings",
    entityId: "payment",
    summary: `Razorpay checkout ${settings.razorpayEnabled ? "enabled" : "disabled"}`,
    metadata: settings,
  });
  return NextResponse.json(settings);
}
