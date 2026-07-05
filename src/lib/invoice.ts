import type { RowInput } from "jspdf-autotable";
import { BUSINESS, LICENSE_INFO } from "@/lib/constants";
import type { InvoiceData, TrackOrderResult } from "@/types";

type RGB = [number, number, number];
const RED_DARK: RGB = [157, 2, 8];
const RED: RGB = [214, 40, 40];
const GOLD_SOFT: RGB = [255, 244, 214];
const STRIPE: RGB = [255, 248, 242];
const INK: RGB = [43, 31, 31];
const MUTED: RGB = [110, 95, 95];

async function loadImageDataUrl(url: string): Promise<string | null> {
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

const rupees = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

const formatInvoiceDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Build and download a branded order invoice PDF. */
export async function downloadOrderInvoice(data: InvoiceData) {
  const [{ default: jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;
  const logo = await loadImageDataUrl("/logo.png");

  const drawHeader = () => {
    if (logo) doc.addImage(logo, "PNG", margin, 22, 56, 56);

    const textX = margin + (logo ? 68 : 0);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...RED_DARK);
    doc.setFontSize(22);
    doc.text(BUSINESS.name.toUpperCase(), textX, 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text("Government Licensed Fireworks Dealer  |  Premium Sivakasi Quality", textX, 55);
    doc.text(`${BUSINESS.addressLine}, ${BUSINESS.state}`, textX, 66);
    doc.text(
      `Ph: ${BUSINESS.phoneDisplay}   |   ${BUSINESS.url.replace("https://", "")}   |   GST: ${BUSINESS.gstin}`,
      textX,
      77,
    );
    doc.text(`Licence No: ${LICENSE_INFO.licenceNo}`, textX, 88);

    doc.setFillColor(...RED);
    doc.rect(margin, 98, pageWidth - 2 * margin, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("ORDER INVOICE", margin + 8, 112);
    doc.setFontSize(9);
    doc.text(data.orderNumber, pageWidth - margin - 8, 112, { align: "right" });
  };

  drawHeader();

  const infoTop = 132;
  const colRight = pageWidth / 2 + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...RED_DARK);
  doc.text("BILL TO", margin, infoTop);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  const billLines = [
    data.customer.name,
    `Mobile: ${data.customer.phone}`,
    data.customer.altPhone ? `Alt: ${data.customer.altPhone}` : null,
    data.customer.email ? `Email: ${data.customer.email}` : null,
    `${data.customer.address}`,
    `${data.customer.city}, ${data.customer.state} - ${data.customer.pincode}`,
  ].filter(Boolean) as string[];

  let billY = infoTop + 14;
  for (const line of billLines) {
    doc.text(line, margin, billY);
    billY += 12;
  }

  doc.setFont("helvetica", "bold");
  doc.setTextColor(...RED_DARK);
  doc.text("INVOICE DETAILS", colRight, infoTop);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...INK);
  const detailLines = [
    `Order ID: ${data.orderNumber}`,
    `Date: ${formatInvoiceDate(data.createdAt)}`,
    `Status: ${data.statusLabel}`,
    `Payment: ${data.paymentMethod ?? "UPI"}`,
    `UPI ID: ${data.upiId ?? BUSINESS.upiId}`,
  ];
  let detailY = infoTop + 14;
  for (const line of detailLines) {
    doc.text(line, colRight, detailY);
    detailY += 12;
  }

  const tableStart = Math.max(billY, detailY) + 10;
  const head = [["S.No", "Product", "Pack", "Qty", "Rate", "Amount"]];
  const body: RowInput[] = data.items.map((item, index) => [
    index + 1,
    item.name,
    item.pack,
    item.qty,
    rupees(item.price),
    rupees(item.amount),
  ]);

  autoTable(doc, {
    head,
    body,
    startY: tableStart,
    margin: { left: margin, right: margin },
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: 4,
      textColor: INK,
      lineColor: [235, 225, 215],
      lineWidth: 0.5,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: RED_DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      halign: "center",
    },
    alternateRowStyles: { fillColor: STRIPE },
    columnStyles: {
      0: { cellWidth: 34, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 72 },
      3: { cellWidth: 36, halign: "center" },
      4: { cellWidth: 58, halign: "right" },
      5: { cellWidth: 62, halign: "right", textColor: RED_DARK, fontStyle: "bold" },
    },
  });

  const tableEnd = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStart + 40;
  let summaryY = tableEnd + 16;

  doc.setFillColor(...GOLD_SOFT);
  doc.rect(pageWidth - margin - 180, summaryY - 10, 180, 52, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Subtotal: ${rupees(data.subtotal)}`, pageWidth - margin - 8, summaryY + 2, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...RED_DARK);
  doc.text(`Grand Total: ${rupees(data.total)}`, pageWidth - margin - 8, summaryY + 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("All prices in INR", pageWidth - margin - 8, summaryY + 32, { align: "right" });

  summaryY += 58;
  if (data.customer.notes?.trim()) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...RED_DARK);
    doc.text("Order Notes:", margin, summaryY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...INK);
    const noteLines = doc.splitTextToSize(data.customer.notes.trim(), pageWidth - 2 * margin);
    doc.text(noteLines, margin, summaryY + 14);
    summaryY += 14 + noteLines.length * 11;
  }

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(
    `Thank you for choosing ${BUSINESS.name}! Payment verification may take up to 2 hours. Track your order at ${BUSINESS.url.replace("https://", "")}`,
    margin,
    pageHeight - 26,
  );

  doc.save(`SRK-Invoice-${data.orderNumber}.pdf`);
}

/** Convert a track-order API result into invoice PDF data. */
export function trackResultToInvoice(result: TrackOrderResult): InvoiceData {
  return {
    orderNumber: result.orderNumber,
    createdAt: result.createdAt,
    status: result.status,
    statusLabel: result.statusLabel,
    customer: result.customer,
    items: result.items,
    subtotal: result.subtotal,
    total: result.total,
    paymentMethod: result.paymentMethod,
    upiId: result.upiId,
  };
}
