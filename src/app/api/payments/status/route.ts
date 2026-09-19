import { NextResponse } from "next/server";
import { isRazorpayCheckoutEnabled } from "@/lib/payment-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const razorpayEnabled = await isRazorpayCheckoutEnabled();
  return NextResponse.json({ razorpayEnabled });
}
