import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  EMAIL_PREVIEW_TRIGGERS,
  getEmailPreview,
  type EmailPreviewTrigger,
} from "@/lib/email-preview";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const trigger = request.nextUrl.searchParams.get("trigger") as EmailPreviewTrigger | null;
  if (!trigger || !EMAIL_PREVIEW_TRIGGERS.includes(trigger)) {
    return NextResponse.json(
      { error: "Valid trigger query required", triggers: EMAIL_PREVIEW_TRIGGERS },
      { status: 400 },
    );
  }

  const preview = getEmailPreview(trigger);
  return NextResponse.json(preview);
}
