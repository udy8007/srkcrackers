import { BUSINESS } from "@/lib/constants";

export function WhatsAppFloat() {
  const text = encodeURIComponent("Hi SRK Crackers, I want to place an order.");
  return (
    <a
      href={`https://wa.me/${BUSINESS.whatsapp}?text=${text}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      className="fixed bottom-20 left-4 z-[55] flex h-14 w-14 items-center justify-center rounded-full bg-whatsapp text-2xl text-white shadow-lg transition hover:scale-105 sm:bottom-24"
    >
      💬
    </a>
  );
}
