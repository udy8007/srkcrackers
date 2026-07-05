import { BUSINESS } from "@/lib/constants";

/** Trigger a download of the SRK Crackers Android APK (served from /public). */
export function downloadApk() {
  const link = document.createElement("a");
  link.href = BUSINESS.apkUrl;
  link.download = "srk-crackers.apk";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/** Smooth-scroll to a section id. */
export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/** Build a wa.me URL with pre-filled text. */
export function whatsappUrl(text: string) {
  return `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(text)}`;
}

/** Build a UPI deep link for the given amount (in INR). */
export function buildUpiPayLink(amount: number, note = "SRK Crackers Order") {
  const params = new URLSearchParams({
    pa: BUSINESS.upiId,
    pn: "SRK Crackers",
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
  });
  return `upi://pay?${params.toString()}`;
}

/** Open Google Pay / UPI app on mobile (Android prefers GPay intent). */
export function openGooglePay(amount: number) {
  const upi = buildUpiPayLink(amount);
  const isAndroid = typeof navigator !== "undefined" && /android/i.test(navigator.userAgent);
  if (isAndroid) {
    const q = new URLSearchParams({
      pa: BUSINESS.upiId,
      pn: "SRK Crackers",
      am: amount.toFixed(2),
      cu: "INR",
      tn: "SRK Crackers Order",
    });
    window.location.href = `intent://pay?${q.toString()}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`;
    window.setTimeout(() => {
      window.location.href = upi;
    }, 700);
  } else {
    window.location.href = upi;
  }
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
