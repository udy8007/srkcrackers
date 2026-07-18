import { BUSINESS } from "@/lib/constants";

/** Build a UPI deep link (optional amount in INR). */
export function buildUpiPayLink(amount?: number, note = "SRK Crackers Order") {
  const params = new URLSearchParams({
    pa: BUSINESS.upiId,
    pn: "SRK Crackers",
    cu: "INR",
    tn: note,
  });
  if (amount != null && amount > 0) {
    params.set("am", amount.toFixed(2));
  }
  return `upi://pay?${params.toString()}`;
}

/** QR code image URL for embedding in PDFs / print views. */
export function buildQrCodeImageUrl(payload: string, size = 120): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(payload)}`;
}

export function buildStoreQrImageUrl(size = 120): string {
  return buildQrCodeImageUrl(BUSINESS.url, size);
}

export function buildUpiQrImageUrl(amount?: number, size = 120): string {
  return buildQrCodeImageUrl(buildUpiPayLink(amount), size);
}

export async function loadImageDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** English + Tamil product label for PDFs / order snapshots. */
export function bilingualProductName(name: string, nameTa?: string | null): string {
  const ta = nameTa?.trim();
  return ta ? `${name}\n${ta}` : name;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/**
 * Register Catamaran (Latin + Tamil) so jsPDF can render bilingual product names.
 * Falls back to Helvetica if the font file cannot be loaded.
 */
export async function registerPdfUnicodeFont(
  doc: import("jspdf").jsPDF,
): Promise<"Catamaran" | "helvetica"> {
  try {
    const res = await fetch("/fonts/Catamaran.ttf");
    if (!res.ok) return "helvetica";
    const base64 = arrayBufferToBase64(await res.arrayBuffer());
    doc.addFileToVFS("Catamaran.ttf", base64);
    doc.addFont("Catamaran.ttf", "Catamaran", "normal");
    doc.addFont("Catamaran.ttf", "Catamaran", "bold");
    doc.addFont("Catamaran.ttf", "Catamaran", "italic");
    return "Catamaran";
  } catch {
    return "helvetica";
  }
}

/** Draw a QR block on the top-right of a jsPDF page header. */
export function drawPdfHeaderQr(
  doc: import("jspdf").jsPDF,
  qrDataUrl: string | null,
  pageWidth: number,
  margin: number,
  label = "Scan to Pay",
  sublabel?: string,
) {
  if (!qrDataUrl) return;
  const size = 68;
  const x = pageWidth - margin - size;
  const y = 22;
  doc.addImage(qrDataUrl, "PNG", x, y, size, size);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(110, 95, 95);
  doc.text(label, x + size / 2, y + size + 10, { align: "center" });
  const caption = sublabel ?? BUSINESS.upiId;
  doc.text(caption, x + size / 2, y + size + 20, { align: "center" });
}
