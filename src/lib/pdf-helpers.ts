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
