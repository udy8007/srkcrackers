"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useCatalog, useCartTotals } from "./catalog-context";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { formatPrice, isValidPhone, isValidPincode } from "@/lib/utils";
import { compressImage, scrollToId, whatsappUrl } from "@/lib/client-actions";
import { BUSINESS, INDIAN_STATES } from "@/lib/constants";
import type { CustomerInput } from "@/types";

const EMPTY_CUSTOMER: CustomerInput = {
  name: "",
  phone: "",
  altPhone: "",
  email: "",
  address: "",
  city: "",
  state: "Tamil Nadu",
  pincode: "",
  notes: "",
};

const STEP_LABELS = ["Details", "Pay", "Screenshot", "Done"];

export function CheckoutModal() {
  const { getProduct } = useCatalog();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const checkoutOpen = useUI((s) => s.checkoutOpen);
  const closeCheckout = useUI((s) => s.closeCheckout);
  const setTrackPrefill = useUI((s) => s.setTrackPrefill);
  const showToast = useToast((s) => s.show);
  const { total } = useCartTotals(items);

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<CustomerInput>(EMPTY_CUSTOMER);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  const orderItems = useMemo(
    () =>
      Object.entries(items)
        .map(([id, qty]) => {
          const product = getProduct(id);
          if (!product) return null;
          return { product, qty, amount: product.price * qty };
        })
        .filter((line): line is { product: ReturnType<typeof getProduct> & object; qty: number; amount: number } => Boolean(line)),
    [items, getProduct],
  );

  useEffect(() => {
    if (checkoutOpen) {
      setStep(1);
      setScreenshot(null);
      setOrderNumber(null);
      setSubmitting(false);
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [checkoutOpen]);

  if (!checkoutOpen) return null;

  const update = (field: keyof CustomerInput, value: string) =>
    setCustomer((prev) => ({ ...prev, [field]: value }));

  const validateDetails = (): boolean => {
    if (!customer.name.trim()) return fail("Please enter your name");
    if (!isValidPhone(customer.phone)) return fail("Enter valid 10-digit mobile number");
    if (!customer.address.trim()) return fail("Please enter delivery address");
    if (!customer.city.trim()) return fail("Please enter city");
    if (!customer.state) return fail("Please select state");
    if (!isValidPincode(customer.pincode)) return fail("Enter valid 6-digit pincode");
    return true;
  };

  function fail(message: string) {
    showToast(message);
    return false;
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return showToast("Please upload an image file");
    if (file.size > 5 * 1024 * 1024) return showToast("Image must be under 5 MB");
    try {
      const dataUrl = await compressImage(file);
      setScreenshot(dataUrl);
      showToast("Payment screenshot uploaded!");
    } catch {
      showToast("Could not process the image");
    }
  };

  const buildWhatsAppText = (id?: string) => {
    const lines = [
      "🎆 *SRK CRACKERS - New Order*",
      "",
      id ? `*Order ID:* ${id}` : "",
      `*Name:* ${customer.name}`,
      `*Phone:* ${customer.phone}`,
      customer.altPhone ? `*Alt Phone:* ${customer.altPhone}` : "",
      customer.email ? `*Email:* ${customer.email}` : "",
      `*Address:* ${customer.address}, ${customer.city}, ${customer.state} - ${customer.pincode}`,
      customer.notes ? `*Notes:* ${customer.notes}` : "",
      "",
      "*Items:*",
      ...orderItems.map((line) => `• ${line.product!.name} × ${line.qty} = ₹${line.amount}`),
      "",
      `*Grand Total: ₹${total}*`,
      `*Payment:* GPay / UPI (${BUSINESS.upiId})`,
      "",
      "Please confirm availability and delivery.",
      "📍 Morai, Avadi, Chennai",
      `📞 ${BUSINESS.phoneDisplay}`,
    ];
    return lines.filter(Boolean).join("\n");
  };

  const confirmOrder = async () => {
    if (!screenshot) return showToast("Please upload payment screenshot first");
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: Object.entries(items).map(([productId, qty]) => ({ productId, qty })),
          paymentScreenshot: screenshot,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to place order");
        return;
      }
      setOrderNumber(data.orderNumber);
      clearCart();
      setStep(4);
      showToast("Order placed successfully!");
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToTrack = () => {
    if (orderNumber) setTrackPrefill({ orderNumber, phone: customer.phone });
    closeCheckout();
    setTimeout(() => scrollToId("track"), 100);
  };

  const upiLink = `upi://pay?pa=${BUSINESS.upiId}&pn=SRK%20Crackers&am=${total}&cu=INR`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={closeCheckout}
    >
      <div
        className="flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header + steps */}
        <div className="relative bg-gradient-to-r from-primary to-primary-dark px-5 py-4 text-white">
          <button
            type="button"
            onClick={closeCheckout}
            aria-label="Close"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20"
          >
            ✕
          </button>
          <h3 className="font-display text-lg font-bold">Complete Your Order</h3>
          <div className="mt-3 flex items-center gap-1.5">
            {STEP_LABELS.map((label, index) => {
              const n = index + 1;
              const active = n === step;
              const done = n < step;
              return (
                <div key={label} className="flex flex-1 items-center gap-1.5 text-[0.7rem]">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active
                        ? "bg-yellow text-primary-dark"
                        : done
                          ? "bg-white/90 text-primary"
                          : "bg-white/20 text-white"
                    }`}
                  >
                    {done ? "✓" : n}
                  </span>
                  <span className="hidden sm:inline">{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto p-5">
          <div className="mb-4 rounded-lg bg-brandbg p-3 text-xs text-ink">
            <strong>Order Summary</strong>
            <div className="mt-1 space-y-0.5">
              {orderItems.map((line) => (
                <div key={line.product!.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {line.product!.name} × {line.qty}
                  </span>
                  <span>{formatPrice(line.amount)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-2 font-bold text-primary">
              <span>Grand Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-3">
              <Field label="Full Name" required>
                <input
                  className="input"
                  value={customer.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Your full name"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mobile" required>
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={10}
                    value={customer.phone}
                    onChange={(e) => update("phone", e.target.value.replace(/\D/g, ""))}
                    placeholder="10-digit number"
                  />
                </Field>
                <Field label="Alternate Phone">
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={10}
                    value={customer.altPhone}
                    onChange={(e) => update("altPhone", e.target.value.replace(/\D/g, ""))}
                    placeholder="Optional"
                  />
                </Field>
              </div>
              <Field label="Email">
                <input
                  className="input"
                  type="email"
                  value={customer.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="Optional — for order updates"
                />
              </Field>
              <Field label="Delivery Address" required>
                <textarea
                  className="input min-h-20"
                  value={customer.address}
                  onChange={(e) => update("address", e.target.value)}
                  placeholder="Door no, street, landmark"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City / Town" required>
                  <input
                    className="input"
                    value={customer.city}
                    onChange={(e) => update("city", e.target.value)}
                    placeholder="City"
                  />
                </Field>
                <Field label="State" required>
                  <select
                    className="input"
                    value={customer.state}
                    onChange={(e) => update("state", e.target.value)}
                  >
                    {INDIAN_STATES.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Pincode" required>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={6}
                  value={customer.pincode}
                  onChange={(e) => update("pincode", e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit pincode"
                />
              </Field>
              <Field label="Order Notes">
                <textarea
                  className="input min-h-16"
                  value={customer.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Delivery instructions (optional)"
                />
              </Field>
              <button
                type="button"
                onClick={() => validateDetails() && setStep(2)}
                className="btn-primary w-full"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-xl border border-line bg-brandbg p-5 text-center">
                <div className="font-semibold text-ink">📱 Google Pay</div>
                <Image
                  src={qrSrc}
                  alt="GPay QR Code"
                  width={220}
                  height={220}
                  unoptimized
                  className="mx-auto my-3 rounded-lg bg-white p-2"
                />
                <div className="text-sm text-ink">
                  UPI: <strong>{BUSINESS.upiId}</strong>
                </div>
                <div className="mt-1 text-2xl font-bold text-primary">{formatPrice(total)}</div>
                <p className="mt-2 text-xs text-ink-muted">
                  Scan with Google Pay / PhonePe / Paytm · Pay the <b>exact amount</b> shown above ·
                  Then upload payment screenshot in next step
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                  ← Back
                </button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1">
                  I Have Paid →
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Upload your <b>GPay / UPI payment screenshot</b>. We verify within 2 hours and confirm
                your order.
              </p>
              <label className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 border-dashed border-line bg-brandbg p-6 text-center transition hover:border-primary">
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                <span className="text-3xl">📷</span>
                <strong className="text-sm text-ink">Tap to upload payment screenshot</strong>
                <span className="text-xs text-ink-muted">JPG, PNG · Max 5 MB</span>
              </label>
              {screenshot && (
                <div className="text-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshot}
                    alt="Payment screenshot preview"
                    className="mx-auto max-h-52 rounded-lg border border-line"
                  />
                  <p className="mt-2 text-xs font-semibold text-green">✓ Screenshot uploaded</p>
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1">
                  ← Back
                </button>
                <a
                  href={whatsappUrl(buildWhatsAppText())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn-yellow flex-1 text-center ${screenshot ? "" : "pointer-events-none opacity-40"}`}
                >
                  Share on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={confirmOrder}
                  disabled={!screenshot || submitting}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  {submitting ? "Placing..." : "Confirm Order ✓"}
                </button>
              </div>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && orderNumber && (
            <div className="py-4 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green text-3xl text-white">
                ✓
              </div>
              <h4 className="mt-4 font-display text-xl font-bold text-primary">Order Submitted!</h4>
              <p className="mt-1 text-sm text-ink-muted">
                Your order has been received. Save your Order ID to track status.
              </p>
              <div className="mx-auto my-4 inline-block rounded-lg border-2 border-dashed border-primary bg-yellow/10 px-5 py-2 font-mono text-lg font-bold text-primary">
                {orderNumber}
              </div>
              <p className="text-sm text-ink-muted">
                We will verify your payment and call you within <b>2 hours</b> to confirm delivery.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <a
                  href={whatsappUrl(buildWhatsAppText(orderNumber))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Send Order on WhatsApp
                </a>
                <button type="button" onClick={goToTrack} className="btn-yellow">
                  Track Order
                </button>
                <button type="button" onClick={closeCheckout} className="btn-outline">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-ink">
        {label} {required && <span className="text-red">*</span>}
      </span>
      {children}
    </label>
  );
}
