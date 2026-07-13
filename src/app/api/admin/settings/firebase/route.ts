import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  FIREBASE_SETTINGS_ID,
  getFirebaseStatus,
  parseAndValidateServiceAccount,
  resetFirebaseApp,
} from "@/lib/admin-push";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = await getFirebaseStatus();
  return NextResponse.json({
    configured: status.configured,
    projectId: status.projectId,
    clientEmail: status.clientEmail
      ? status.clientEmail.replace(/^(.{3}).+(@.+)$/, "$1***$2")
      : null,
    source: status.source,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw = "";
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file");
    if (file && typeof file === "object" && "text" in file) {
      raw = await (file as File).text();
    } else {
      const text = form.get("serviceAccountJson");
      raw = typeof text === "string" ? text : "";
    }
  } else {
    try {
      const body = await request.json();
      raw = typeof body.serviceAccountJson === "string" ? body.serviceAccountJson : "";
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
  }

  const validated = parseAndValidateServiceAccount(raw);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  await prisma.firebaseSettings.upsert({
    where: { id: FIREBASE_SETTINGS_ID },
    create: {
      id: FIREBASE_SETTINGS_ID,
      serviceAccountJson: validated.serialized,
      projectId: validated.json.project_id ?? "",
      clientEmail: validated.json.client_email ?? "",
    },
    update: {
      serviceAccountJson: validated.serialized,
      projectId: validated.json.project_id ?? "",
      clientEmail: validated.json.client_email ?? "",
    },
  });

  await resetFirebaseApp();

  return NextResponse.json({
    ok: true,
    projectId: validated.json.project_id,
    clientEmail: validated.json.client_email,
    message: "Firebase service account saved. You can send a test push now.",
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.firebaseSettings.upsert({
    where: { id: FIREBASE_SETTINGS_ID },
    create: { id: FIREBASE_SETTINGS_ID, serviceAccountJson: "", projectId: "", clientEmail: "" },
    update: { serviceAccountJson: "", projectId: "", clientEmail: "" },
  });
  await resetFirebaseApp();

  return NextResponse.json({ ok: true, message: "Firebase credentials cleared from database." });
}
