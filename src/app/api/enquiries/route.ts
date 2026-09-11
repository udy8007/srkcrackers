import { NextRequest, NextResponse } from "next/server";
import { validateEnquiryInput } from "@/lib/enquiry-build";
import { dispatchNotification, notifyEnquiryPlaced } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { generateEnquiryNumber } from "@/lib/utils";
import type { CreateEnquiryInput } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: CreateEnquiryInput;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const validated = validateEnquiryInput(body);
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const enquiryNumber = generateEnquiryNumber();
  const enquiry = await prisma.enquiry.create({
    data: {
      enquiryNumber,
      ...validated.data,
      status: "PENDING",
    },
  });

  dispatchNotification(() => notifyEnquiryPlaced(enquiry.id));

  return NextResponse.json({
    enquiryNumber: enquiry.enquiryNumber,
    status: enquiry.status,
  });
}
