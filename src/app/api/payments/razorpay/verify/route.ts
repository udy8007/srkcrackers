import { NextRequest, NextResponse } from "next/server";
import { verifyAndCaptureCheckout } from "@/lib/payment-service";
import { paymentLog, verifyCheckoutSignature } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const razorpayOrderId = body.razorpay_order_id?.trim() ?? "";
  const razorpayPaymentId = body.razorpay_payment_id?.trim() ?? "";
  const razorpaySignature = body.razorpay_signature?.trim() ?? "";

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return NextResponse.json({ error: "Incomplete payment response" }, { status: 400 });
  }

  if (!verifyCheckoutSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    paymentLog("verify_bad_signature", { razorpayOrderId, razorpayPaymentId });
    return NextResponse.json({ error: "Payment signature mismatch" }, { status: 400 });
  }

  try {
    const result = await verifyAndCaptureCheckout({
      razorpayOrderId,
      razorpayPaymentId,
      source: "verify",
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({
      orderNumber: result.orderNumber,
      status: result.status,
      createdAt: result.createdAt,
      subtotal: result.subtotal,
      shipping: result.shipping,
      total: result.total,
      alreadyPaid: result.alreadyPaid,
    });
  } catch (error) {
    paymentLog("verify_error", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Could not confirm payment. If money was deducted, track your order or contact us." }, { status: 500 });
  }
}
