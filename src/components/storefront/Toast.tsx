"use client";

import { useToast } from "@/store/toast";

export function Toast() {
  const message = useToast((s) => s.message);
  const visible = useToast((s) => s.visible);

  return (
    <div
      className={`pointer-events-none fixed bottom-24 left-1/2 z-[90] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
