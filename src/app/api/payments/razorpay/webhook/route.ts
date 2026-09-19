import { NextRequest, NextResponse } from "next/server";
import { applyCapturedPayment, markPaymentFailed } from "@/lib/payment-service";
import { paymentLog, verifyWebhookSignature } from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RazorpayWebhookEntity = {
  id?: string;
  order_id?: string;
  amount?: number;
  status?: string;
  method?: string;
  error_code?: string | null;
  error_description?: string | null;
};

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    paymentLog("webhook_bad_signature", {});
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let payload: { event?: string; payload?: { payment?: { entity?: RazorpayWebhookEntity }; order?: { entity?: RazorpayWebhookEntity } } };
  try {
    payload = JSON.parse(rawBody) as typeof payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const payment = payload.payload?.payment?.entity;
  paymentLog("webhook_received", { event, paymentId: payment?.id, orderId: payment?.order_id });

  try {
    if (event === "payment.captured" || event === "order.paid") {
      if (!payment?.id || !payment.order_id || !payment.amount) {
        return NextResponse.json({ ok: true, ignored: true });
      }
      const applied = await applyCapturedPayment(
        {
          id: payment.id,
          entity: "payment",
          amount: payment.amount,
          currency: "INR",
          status: payment.status ?? "captured",
          order_id: payment.order_id,
          method: payment.method,
          error_code: payment.error_code,
          error_description: payment.error_description,
        },
        "webhook",
      );
      if (!applied.ok) {
        paymentLog("webhook_apply_failed", { event, error: applied.error });
      }
      return NextResponse.json({ ok: true });
    }

    if (event === "payment.failed") {
      const order = payment?.order_id
        ? await prisma.order.findFirst({ where: { razorpayOrderId: payment.order_id } })
        : null;
      await markPaymentFailed({
        orderId: order?.id,
        razorpayOrderId: payment?.order_id,
        razorpayPaymentId: payment?.id,
        amountPaise: payment?.amount,
        method: payment?.method,
        errorCode: payment?.error_code,
        errorDescription: payment?.error_description,
        source: "webhook",
        payload: payment,
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, ignored: event });
  } catch (error) {
    paymentLog("webhook_error", { event, error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
