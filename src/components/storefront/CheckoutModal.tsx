"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useCatalog, useCartTotals } from "./catalog-context";
import { OrderTotalsBreakdown } from "./OrderTotalsBreakdown";
import { useCart } from "@/store/cart";
import { useUI } from "@/store/ui";
import { useToast } from "@/store/toast";
import { formatPrice, formatFullDeliveryAddress, getMinOrderToastMessage, isValidPhone, isValidPincode, meetsMinOrder } from "@/lib/utils";
import {
  buildUpiPayLink,
  scrollToId,
  whatsappUrl,
} from "@/lib/client-actions";
import { BUSINESS, INDIAN_STATES, ORDER_STATUS_LABEL } from "@/lib/constants";
import { isCustomerComplete, loadSavedCustomer, saveCustomerDetails } from "@/lib/checkout-storage";
import { downloadOrderInvoice } from "@/lib/invoice";
import { storeTrackPhone } from "./TrackOrderDeepLink";
import type { OrderStatus } from "@/lib/db/types";
import type { CustomerInput, InvoiceData } from "@/types";

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

const STEP_LABELS = ["Details", "Pay", "Reference", "Done"];

export function CheckoutModal() {
  const { getProduct } = useCatalog();
  const items = useCart((s) => s.items);
  const clearCart = useCart((s) => s.clear);
  const checkoutOpen = useUI((s) => s.checkoutOpen);
  const closeCheckout = useUI((s) => s.closeCheckout);
  const setTrackPrefill = useUI((s) => s.setTrackPrefill);
  const showToast = useToast((s) => s.show);
  const { subtotal, shipping, total, count } = useCartTotals(items);

  const [step, setStep] = useState(1);
  const [customer, setCustomer] = useState<CustomerInput>(EMPTY_CUSTOMER);
  const [upiReference, setUpiReference] = useState("");
  const [whatsappShared, setWhatsappShared] = useState(false);
  const awaitingWhatsAppReturn = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderCreatedAt, setOrderCreatedAt] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [savedTotals, setSavedTotals] = useState<{ subtotal: number; shipping: number; total: number } | null>(null);
  const [savedInvoiceItems, setSavedInvoiceItems] = useState<
    InvoiceData["items"]
  >([]);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [upiCopied, setUpiCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI QR");
  const [draftOrderId, setDraftOrderId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [paymentDetailsCopied, setPaymentDetailsCopied] = useState(false);
  const leftForPaymentRef = useRef(false);
  const hiddenAtRef = useRef(0);
  const checkoutInitializedRef = useRef(false);

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

  const cartLines = useMemo(
    () => orderItems.map((line) => ({ productId: line.product!.id, qty: line.qty })),
    [orderItems],
  );

  const saveCheckoutDraft = useCallback(
    async (opts?: { paymentMethod?: string; checkoutStep?: "PAYMENT" | "REFERENCE" }) => {
      if (orderItems.length === 0) return;
      try {
        const response = await fetch("/api/orders/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer,
            items: cartLines,
            draftOrderId: draftOrderId ?? undefined,
            paymentMethod: opts?.paymentMethod ?? paymentMethod,
            checkoutStep: opts?.checkoutStep,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          setDraftOrderId(data.draftOrderId);
        }
      } catch {
        // Do not block checkout if draft save fails.
      }
    },
    [cartLines, customer, draftOrderId, orderItems.length, paymentMethod],
  );

  useEffect(() => {
    if (!checkoutOpen) {
      checkoutInitializedRef.current = false;
      return;
    }
    if (checkoutInitializedRef.current) return;
    checkoutInitializedRef.current = true;

    const saved = loadSavedCustomer();
    const canSkipToPayment =
      saved &&
      count > 0 &&
      orderItems.length > 0 &&
      meetsMinOrder(subtotal) &&
      isCustomerComplete(saved);

    setCustomer(saved ?? EMPTY_CUSTOMER);
    setStep(canSkipToPayment ? 2 : 1);
    setUpiReference("");
    setWhatsappShared(false);
    awaitingWhatsAppReturn.current = false;
    setOrderNumber(null);
    setOrderCreatedAt(null);
    setOrderStatus(null);
    setSavedTotals(null);
    setSavedInvoiceItems([]);
    setSubmitting(false);
    setUpiCopied(false);
    setPaymentDetailsCopied(false);
    setPaymentMethod("UPI QR");
    setDraftOrderId(null);
    leftForPaymentRef.current = false;
    document.body.style.overflow = "hidden";

    if (canSkipToPayment && saved) {
      window.setTimeout(() => {
        void fetch("/api/orders/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: saved,
            items: Object.entries(items)
              .map(([productId, qty]) => ({ productId, qty }))
              .filter((line) => line.qty > 0),
            checkoutStep: "PAYMENT",
          }),
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.draftOrderId) setDraftOrderId(data.draftOrderId);
          })
          .catch(() => {});
      }, 0);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [checkoutOpen, count, items, orderItems.length, subtotal]);

  useEffect(() => {
    setIsMobile(/android|iphone|ipad|ipod/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!checkoutOpen || step !== 3) return;
    void saveCheckoutDraft({ checkoutStep: "REFERENCE" });
  }, [checkoutOpen, step, saveCheckoutDraft]);

  const paymentCopyText = useMemo(
    () => `Pay ${formatPrice(total)} to ${BUSINESS.upiId} (SRK Crackers Order)`,
    [total],
  );

  const copyPaymentDetails = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(paymentCopyText);
      setPaymentDetailsCopied(true);
      setUpiCopied(true);
      showToast("Payment details copied — open GPay / PhonePe / Paytm");
      window.setTimeout(() => {
        setPaymentDetailsCopied(false);
        setUpiCopied(false);
      }, 2500);
    } catch {
      showToast("Could not copy payment details");
    }
  }, [paymentCopyText, showToast]);

  useEffect(() => {
    if (!checkoutOpen || step !== 2 || !isMobile) return;
    void copyPaymentDetails();
  }, [checkoutOpen, step, isMobile, copyPaymentDetails]);

  useEffect(() => {
    if (!checkoutOpen || step !== 2) return;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        leftForPaymentRef.current = true;
        return;
      }
      if (!leftForPaymentRef.current) return;
      if (Date.now() - hiddenAtRef.current < 1500) {
        leftForPaymentRef.current = false;
        return;
      }
      leftForPaymentRef.current = false;
      setStep(3);
      showToast("Welcome back — enter your UPI reference number.");
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [checkoutOpen, step, showToast]);

  useEffect(() => {
    if (!checkoutOpen || step !== 3) return;
    const onReturn = () => {
      if (document.visibilityState !== "visible") return;
      if (!awaitingWhatsAppReturn.current) return;
      awaitingWhatsAppReturn.current = false;
      setWhatsappShared(true);
      showToast("Shared on WhatsApp ✓ — you can confirm your order now.");
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [checkoutOpen, step, showToast]);

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
    if (count === 0 || orderItems.length === 0) return fail("Your cart is empty");
    if (!meetsMinOrder(subtotal)) {
      return fail(getMinOrderToastMessage(subtotal));
    }
    return true;
  };

  function fail(message: string) {
    showToast(message);
    return false;
  }

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(BUSINESS.upiId);
      setUpiCopied(true);
      showToast("UPI ID copied!");
      window.setTimeout(() => setUpiCopied(false), 2000);
    } catch {
      showToast("Could not copy UPI ID");
    }
  };

  const continueToPayment = async () => {
    if (!validateDetails()) return;
    saveCustomerDetails(customer);
    setStep(2);
    await saveCheckoutDraft({ checkoutStep: "PAYMENT" });
  };

  const handlePaidViaQr = async () => {
    setPaymentMethod("UPI QR");
    setStep(3);
    await saveCheckoutDraft({ paymentMethod: "UPI QR", checkoutStep: "REFERENCE" });
  };

  const buildWhatsAppText = (id?: string) => {
    const lines = orderItems.length > 0
      ? orderItems.map((line) => `• ${line.product!.name} × ${line.qty} = ₹${line.amount}`)
      : savedInvoiceItems.map((line) => `• ${line.name} × ${line.qty} = ₹${line.amount}`);
    const totals = savedTotals ?? { subtotal, shipping, total };
    const text = [
      "🎆 *SRK CRACKERS - New Order*",
      "",
      id ? `*Order ID:* ${id}` : "",
      `*Name:* ${customer.name}`,
      `*Phone:* ${customer.phone}`,
      customer.altPhone ? `*Alt Phone:* ${customer.altPhone}` : "",
      customer.email ? `*Email:* ${customer.email}` : "",
      `*Address:* ${formatFullDeliveryAddress(customer)}`,
      customer.notes ? `*Notes:* ${customer.notes}` : "",
      "",
      "*Items:*",
      ...lines,
      "",
      `*Subtotal: ₹${totals.subtotal}*`,
      customer.city.trim()
        ? `*Shipping (${customer.city.trim()}): ₹${totals.shipping}*`
        : `*Shipping: ₹${totals.shipping}*`,
      `*Grand Total: ₹${totals.total}*`,
      `*Payment:* ${paymentMethod} (${BUSINESS.upiId})`,
      upiReference.trim() ? `*UPI Ref:* ${upiReference.trim()}` : "",
      "",
      "Please confirm availability and delivery.",
      "📍 Morai, Avadi, Chennai",
      `📞 ${BUSINESS.phoneDisplay}`,
    ];
    return text.filter(Boolean).join("\n");
  };

  const buildInvoiceData = (id: string, createdAt: string, status: OrderStatus): InvoiceData => {
    const totals = savedTotals ?? { subtotal, shipping, total };
    return {
    orderNumber: id,
    createdAt,
    status,
    statusLabel: ORDER_STATUS_LABEL[status] ?? status,
    customer: {
      name: customer.name,
      phone: customer.phone,
      altPhone: customer.altPhone || null,
      email: customer.email || null,
      address: customer.address,
      city: customer.city,
      state: customer.state,
      pincode: customer.pincode,
      notes: customer.notes || null,
    },
    items:
      savedInvoiceItems.length > 0
        ? savedInvoiceItems
        : orderItems.map((line) => ({
            name: line.product!.name,
            pack: line.product!.pack,
            price: line.product!.price,
            qty: line.qty,
            amount: line.amount,
          })),
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    total: totals.total,
    paymentMethod,
    upiId: BUSINESS.upiId,
  };
  };

  const triggerInvoiceDownload = async (id: string, createdAt: string, status: OrderStatus) => {
    setInvoiceDownloading(true);
    try {
      await downloadOrderInvoice(buildInvoiceData(id, createdAt, status));
    } catch {
      showToast("Could not download invoice. Try again from Track Order.");
    } finally {
      setInvoiceDownloading(false);
    }
  };

  const shareOnWhatsApp = () => {
    awaitingWhatsAppReturn.current = true;
    const url = whatsappUrl(buildWhatsAppText());
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const confirmOrder = async () => {
    if (orderItems.length === 0) return showToast("Your cart is empty");
    if (!meetsMinOrder(subtotal)) {
      return showToast(getMinOrderToastMessage(subtotal));
    }
    const ref = upiReference.trim();
    if (ref && (ref.length < 6 || ref.length > 40)) {
      return showToast("Enter a valid UPI reference number (6–40 characters)");
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer,
          items: orderItems.map((line) => ({ productId: line.product!.id, qty: line.qty })),
          upiReferenceNumber: ref || undefined,
          paymentMethod,
          draftOrderId: draftOrderId ?? undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error ?? "Failed to place order");
        return;
      }
      const invoiceItems = orderItems.map((line) => ({
        name: line.product!.name,
        pack: line.product!.pack,
        price: line.product!.price,
        qty: line.qty,
        amount: line.amount,
      }));
      setSavedTotals({ subtotal: data.subtotal, shipping: data.shipping, total: data.total });
      setSavedInvoiceItems(invoiceItems);
      setOrderNumber(data.orderNumber);
      setOrderCreatedAt(data.createdAt);
      setOrderStatus(data.status);
      storeTrackPhone(data.orderNumber, customer.phone);
      setStep(4);
      clearCart();
      void triggerInvoiceDownload(data.orderNumber, data.createdAt, data.status);
      showToast(
        upiReference.trim()
          ? "Order placed successfully!"
          : whatsappShared
            ? "Order placed — we got your WhatsApp share. We'll verify payment soon."
            : "Order placed — share UPI reference anytime or wait for our call.",
      );
    } catch {
      showToast("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const goToTrack = () => {
    if (orderNumber) {
      storeTrackPhone(orderNumber, customer.phone);
      setTrackPrefill({ orderNumber, phone: customer.phone });
    }
    closeCheckout();
    setTimeout(() => scrollToId("track"), 100);
  };

  const upiLink = buildUpiPayLink(total);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={closeCheckout}
    >
      <div
        className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white sm:rounded-2xl"
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
          <h3 className="font-display text-lg font-bold">
            {step === 4 ? "Order Confirmed" : "Complete Your Order"}
          </h3>
          {step !== 4 && (
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
          )}
        </div>

        <div className="scrollbar-thin relative flex-1 overflow-y-auto p-5">
          {step !== 4 && (
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
            <div className="mt-2 border-t border-line pt-2">
              <OrderTotalsBreakdown
                subtotal={subtotal}
                shipping={shipping}
                total={total}
                deliveryCity={customer.city}
                compact
              />
            </div>
          </div>
          )}

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
                onClick={() => void continueToPayment()}
                className="btn-primary w-full"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-ink-muted">Scan QR code to pay</p>
                <div className="mt-1 text-2xl font-bold text-primary">{formatPrice(total)}</div>
                <p className="mt-1 text-xs text-ink-muted">
                  {shipping > 0 ? (
                    <>
                      Includes {formatPrice(shipping)} shipping
                      {customer.city.trim() ? ` to ${customer.city.trim()}` : ""}
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-green">FREE shipping</span>
                      {customer.city.trim() ? ` to ${customer.city.trim()}` : ""}
                    </>
                  )}
                  {" · "}Pay exact amount shown
                </p>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-ink-muted">
                  <span>
                    UPI: <strong className="text-ink">{BUSINESS.upiId}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiId}
                    title="Copy UPI ID"
                    aria-label="Copy UPI ID"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-white text-ink transition hover:border-primary hover:bg-brandbg"
                  >
                    {upiCopied ? (
                      <span className="text-[0.65rem] font-bold text-green">✓</span>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-line bg-brandbg p-5 text-center">
                <div className="font-semibold text-ink">Scan & Pay with any UPI app</div>
                <Image
                  src={qrSrc}
                  alt="UPI QR Code"
                  width={isMobile ? 260 : 220}
                  height={isMobile ? 260 : 220}
                  unoptimized
                  className="mx-auto my-3 rounded-lg bg-white p-2"
                />
                <p className="text-xs text-ink-muted">
                  Google Pay / PhonePe / Paytm · Pay the <b>exact amount</b> shown above
                </p>
                {isMobile ? (
                  <div className="mt-3 rounded-lg border border-green/30 bg-green/5 px-3 py-2.5 text-left text-[0.7rem] leading-relaxed text-ink">
                    {paymentDetailsCopied ? (
                      <span className="font-semibold text-green">✓ Amount & UPI ID copied</span>
                    ) : (
                      <span>Copying payment details…</span>
                    )}
                    <p className="mt-1 text-ink-muted">
                      Open GPay, PhonePe, or Paytm → scan QR from screenshot, or paste UPI ID with{" "}
                      {formatPrice(total)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-[0.7rem] text-ink-muted">
                    Scan with your phone camera or any UPI app
                  </p>
                )}
                <button type="button" onClick={() => void handlePaidViaQr()} className="btn-primary mt-4 w-full">
                  I Have Paid →
                </button>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1">
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-ink-muted">
                Enter your <b>UPI Reference / UTR number</b> from the payment app{" "}
                <span className="text-ink-muted">(optional)</span>, or <b>share on WhatsApp</b>, then
                confirm your order. We verify payment within 2 hours.
              </p>
              <div>
                <label htmlFor="upi-ref" className="mb-1.5 block text-sm font-semibold text-ink">
                  UPI Reference Number
                </label>
                <input
                  id="upi-ref"
                  type="text"
                  inputMode="text"
                  autoComplete="off"
                  placeholder="e.g. 123456789012"
                  value={upiReference}
                  onChange={(e) => setUpiReference(e.target.value.replace(/\s/g, ""))}
                  className="w-full rounded-xl border border-line bg-white px-4 py-3 font-mono text-sm tracking-wide text-ink outline-none focus:border-primary"
                  maxLength={40}
                />
                <p className="mt-1.5 text-xs text-ink-muted">
                  Find this in GPay / PhonePe / Paytm under payment history (UTR / Ref No).
                </p>
              </div>
              {whatsappShared && (
                <div className="rounded-lg border border-green/30 bg-green/5 px-3 py-2.5 text-center text-sm font-semibold text-green">
                  ✓ Shared on WhatsApp — thank you! Confirm your order below.
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1">
                  ← Back
                </button>
                <button
                  type="button"
                  onClick={shareOnWhatsApp}
                  className="btn-yellow flex-1 text-center"
                >
                  Share on WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => void confirmOrder()}
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-40"
                >
                  {submitting ? "Placing..." : "Confirm Order ✓"}
                </button>
              </div>
              <p className="text-center text-[0.7rem] text-ink-muted">
                You can confirm without a reference — our team will call to verify payment.
              </p>
            </div>
          )}

          {/* Step 4 */}
          {step === 4 && orderNumber && (
            <div className="py-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow/20 text-4xl">
                ⭐
              </div>
              <h4 className="mt-5 font-display text-2xl font-bold text-primary">Your Order is Confirmed!</h4>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-muted">
                Thank you for ordering from SRK Crackers. Our team will verify your payment and call you
                within <b>2 hours</b> to confirm availability and delivery date.
              </p>
              <div className="mx-auto my-5 inline-block rounded-xl border-2 border-dashed border-primary bg-yellow/15 px-6 py-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide text-ink-muted">Order ID</p>
                <p className="font-mono text-xl font-bold text-primary">{orderNumber}</p>
              </div>
              <p className="mx-auto max-w-xs text-xs text-ink-muted">
                Save this Order ID to track status. Invoice has been downloaded to your device.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button type="button" onClick={goToTrack} className="btn-primary">
                  Track My Order
                </button>
                <button type="button" onClick={closeCheckout} className="btn-outline">
                  Continue Shopping
                </button>
              </div>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    orderCreatedAt &&
                    orderStatus &&
                    triggerInvoiceDownload(orderNumber, orderCreatedAt, orderStatus)
                  }
                  disabled={!orderCreatedAt || !orderStatus || invoiceDownloading}
                  className="text-xs font-semibold text-primary underline disabled:opacity-40"
                >
                  {invoiceDownloading ? "Preparing invoice…" : "Download invoice again"}
                </button>
                <span className="text-ink-muted">·</span>
                <a
                  href={whatsappUrl(buildWhatsAppText(orderNumber))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-primary underline"
                >
                  Send on WhatsApp
                </a>
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
