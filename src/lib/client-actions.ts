import { BUSINESS } from "@/lib/constants";

export { buildUpiPayLink, openUpiApp, UPI_PAYMENT_APPS, upiAppPaymentMethodLabel } from "@/lib/upi-apps";
export type { UpiAppId, UpiPaymentApp } from "@/lib/upi-apps";

/** Smooth-scroll to a section id. */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Build a wa.me URL with pre-filled text. */
export function whatsappUrl(text: string) {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Compress an image file to a JPEG data URL (client only). */
export function compressImage(file: File, maxWidth = 800, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = (event) => {
      const image = new Image();
      image.onerror = () => reject(new Error("Could not load image"));
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, maxWidth / image.width);
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not supported"));
          return;
        }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
