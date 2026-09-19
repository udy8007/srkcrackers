import { NextRequest, NextResponse } from "next/server";
import { isValidPhone } from "@/lib/utils";
import { createPaymentCheckoutSession, recordCheckoutDismissed } from "@/lib/payment-service";
import { paymentLog } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    draftOrderId?: string;
    orderNumber?: string;
    phone?: string;
    source?: "checkout" | "repay";
    dismissed?: boolean;
    razorpayOrderId?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.dismissed && body.draftOrderId && body.razorpayOrderId) {
    await recordCheckoutDismissed(body.draftOrderId, body.razorpayOrderId, body.source ?? "checkout");
    return NextResponse.json({ ok: true });
  }

  const source = body.source === "repay" ? "repay" : "checkout";
  if (source === "repay") {
    if (!body.orderNumber?.trim() || !isValidPhone(body.phone ?? "")) {
      return NextResponse.json({ error: "Enter Order ID and 10-digit mobile number" }, { status: 400 });
    }
  } else if (!body.draftOrderId?.trim()) {
    return NextResponse.json({ error: "Checkout session missing. Go back and continue to payment." }, { status: 400 });
  }

  try {
    const result = await createPaymentCheckoutSession({
      orderId: source === "checkout" ? body.draftOrderId : undefined,
      orderNumber: body.orderNumber,
      phone: body.phone,
      source,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (result.alreadyPaid) {
      return NextResponse.json({
        alreadyPaid: true,
        orderNumber: result.orderNumber,
        status: result.status,
      });
    }
    return NextResponse.json(result.session);
  } catch (error) {
    paymentLog("create_session_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Could not start online payment. Please try again." }, { status: 500 });
  }
}
