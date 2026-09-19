export async function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.Razorpay) return true;
  return new Promise((resolve) => {
    const src = "https://checkout.razorpay.com/v1/checkout.js";
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.ready === "1") {
        resolve(Boolean(window.Razorpay));
        return;
      }
      existing.addEventListener("load", () => resolve(Boolean(window.Razorpay)), { once: true });
      existing.addEventListener("error", () => resolve(false), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.ready = "1";
      resolve(Boolean(window.Razorpay));
    };
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export type RazorpayVerifyResult = {
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  shipping: number;
  total: number;
};

type CheckoutSession = {
  keyId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderNumber: string;
  name: string;
  description: string;
  prefill: { name: string; email?: string; contact: string; method?: string };
  theme: { color: string };
  notes: Record<string, string>;
};

type RazorpayPaymentResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export async function startRazorpayCheckout(input: {
  draftOrderId?: string;
  orderNumber?: string;
  phone?: string;
  source: "checkout" | "repay";
}): Promise<
  | { ok: true; alreadyPaid: true; orderNumber: string; status: string }
  | { ok: true; alreadyPaid?: false; paid: RazorpayVerifyResult }
  | { ok: false; dismissed?: boolean; error: string }
> {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    return { ok: false, error: "Could not load Razorpay. Check your connection and try again." };
  }

  const createRes = await fetch("/api/payments/razorpay/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      draftOrderId: input.draftOrderId,
      orderNumber: input.orderNumber,
      phone: input.phone,
      source: input.source,
    }),
  });
  const createData = (await createRes.json().catch(() => ({}))) as CheckoutSession & {
    error?: string;
    alreadyPaid?: boolean;
    orderNumber?: string;
    status?: string;
  };
  if (!createRes.ok) {
    return { ok: false, error: createData.error ?? "Could not start payment" };
  }
  if (createData.alreadyPaid && createData.orderNumber) {
    return { ok: true, alreadyPaid: true, orderNumber: createData.orderNumber, status: createData.status ?? "CONFIRMED" };
  }

  const session = createData as CheckoutSession;

  return new Promise((resolve) => {
    const checkout = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: session.name,
      description: session.description,
      order_id: session.razorpayOrderId,
      prefill: session.prefill,
      notes: session.notes,
      theme: session.theme,
      config: {
        display: {
          sequence: ["upi", "card", "netbanking", "wallet"],
          preferences: { show_default_blocks: true },
        },
      },
      handler: (response: RazorpayPaymentResponse) => {
        void (async () => {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verifyData = (await verifyRes.json().catch(() => ({}))) as RazorpayVerifyResult & { error?: string };
          if (!verifyRes.ok) {
            resolve({ ok: false, error: verifyData.error ?? "Payment verification failed. You can retry from Track Order." });
            return;
          }
          resolve({ ok: true, paid: verifyData });
        })();
      },
      modal: {
        ondismiss: () => {
          if (input.draftOrderId) {
            void fetch("/api/payments/razorpay/create", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                dismissed: true,
                draftOrderId: input.draftOrderId,
                razorpayOrderId: session.razorpayOrderId,
                source: input.source,
              }),
            });
          }
          resolve({ ok: false, dismissed: true, error: "Payment was not completed. You can try again anytime." });
        },
      },
    });
    checkout.on("payment.failed", () => {
      // Webhook + verify path also records failure; keep UI message here.
    });
    checkout.open();
  });
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
