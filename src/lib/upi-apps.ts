import { BUSINESS } from "@/lib/constants";

export type UpiAppId = "gpay" | "phonepe" | "paytm";

export interface UpiPaymentApp {
  id: UpiAppId;
  label: string;
  shortLabel: string;
}

export const UPI_PAYMENT_APPS: UpiPaymentApp[] = [
  {
    id: "gpay",
    label: "Google Pay",
    shortLabel: "GPay",
  },
  {
    id: "phonepe",
    label: "PhonePe",
    shortLabel: "PhonePe",
  },
  {
    id: "paytm",
    label: "Paytm",
    shortLabel: "Paytm",
  },
];

/** Standard UPI deep link with amount pre-filled. */
export function buildUpiPayLink(amount: number, note = "SRK Crackers Order"): string {
  const params = new URLSearchParams({
    pa: BUSINESS.upiId,
    pn: "SRK Crackers",
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

function buildUpiQuery(amount: number, note = "SRK Crackers Order"): string {
  return new URLSearchParams({
    pa: BUSINESS.upiId,
    pn: "SRK Crackers",
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  }).toString();
}

function isAndroid(): boolean {
  return typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
}

function isIOS(): boolean {
  return typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Resolve app-specific URL; falls back to generic UPI link. */
export function buildUpiAppLink(appId: UpiAppId, amount: number, note = "SRK Crackers Order"): string {
  const q = buildUpiQuery(amount, note);
  const upi = `upi://pay?${q}`;

  switch (appId) {
    case "gpay":
      if (isAndroid()) {
        return `intent://pay?${q}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
      }
      if (isIOS()) {
        return `tez://upi/pay?${q}`;
      }
      return upi;
    case "phonepe":
      if (isAndroid()) {
        return `intent://pay?${q}#Intent;scheme=upi;package=com.phonepe.app;end`;
      }
      return `phonepe://pay?${q}`;
    case "paytm":
      if (isAndroid()) {
        return `intent://pay?${q}#Intent;scheme=upi;package=net.one97.paytm;end`;
      }
      return `paytmmp://pay?${q}`;
    default:
      return upi;
  }
}

/**
 * Open a UPI payment app with order amount pre-filled.
 * On Android, tries generic UPI chooser only if the app intent did not open.
 */
export function openUpiApp(appId: UpiAppId, amount: number, note = "SRK Crackers Order"): void {
  if (typeof window === "undefined") return;

  const primary = buildUpiAppLink(appId, amount, note);
  const fallback = buildUpiPayLink(amount, note);

  window.location.href = primary;

  if (isAndroid()) {
    const fallbackTimer = window.setTimeout(() => {
      if (document.visibilityState !== "hidden") {
        window.location.href = fallback;
      }
    }, 900);
    const cancelFallback = () => {
      if (document.visibilityState === "hidden") {
        window.clearTimeout(fallbackTimer);
        document.removeEventListener("visibilitychange", cancelFallback);
      }
    };
    document.addEventListener("visibilitychange", cancelFallback);
  }
}

export function upiAppPaymentMethodLabel(appId: UpiAppId): string {
  return UPI_PAYMENT_APPS.find((app) => app.id === appId)?.label ?? "UPI";
}
