import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  registerAdminDeviceToken,
  unregisterAdminDeviceToken,
} from "@/lib/admin-push";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string; platform?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const platform =
    typeof body.platform === "string" && body.platform.trim()
      ? body.platform.trim()
      : "android";

  const device = await registerAdminDeviceToken({
    token,
    platform,
    adminUserId: session.user.id,
  });

  return NextResponse.json({ ok: true, id: device.id });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const result = await unregisterAdminDeviceToken(token);
  return NextResponse.json({ ok: true, deleted: result.count });
}
