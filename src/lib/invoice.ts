import type { RowInput } from "jspdf-autotable";
import { BUSINESS, LICENSE_INFO } from "@/lib/constants";
import {
  buildUpiQrImageUrl,
  drawPdfHeaderQr,
  loadImageDataUrl,
  registerPdfUnicodeFont,
} from "@/lib/pdf-helpers";
import { formatInvoiceAddressLines } from "@/lib/utils";
import type { InvoiceData, TrackOrderResult } from "@/types";

type RGB = [number, number, number];
const RED_DARK: RGB = [157, 2, 8];
const RED: RGB = [214, 40, 40];
const GOLD_SOFT: RGB = [255, 244, 214];
const STRIPE: RGB = [255, 248, 242];
const INK: RGB = [43, 31, 31];
const MUTED: RGB = [110, 95, 95];

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
  const qr = await loadImageDataUrl(buildUpiQrImageUrl(data.total, 140));
  const bodyFont = await registerPdfUnicodeFont(doc);

  const drawHeader = () => {
    if (logo) doc.addImage(logo, "PNG", margin, 22, 56, 56);
    drawPdfHeaderQr(doc, qr, pageWidth, margin);

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
    ...formatInvoiceAddressLines(data.customer),
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
  const tableWidth = pageWidth - 2 * margin;
  const colW = {
    sno: tableWidth * 0.07,
    product: tableWidth * 0.34,
    pack: tableWidth * 0.15,
    qty: tableWidth * 0.08,
    rate: tableWidth * 0.16,
    amount: tableWidth * 0.2,
  };
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
    tableWidth,
    margin: { left: margin, right: margin },
    styles: {
      font: bodyFont,
      fontSize: 8.5,
      cellPadding: { top: 5, right: 6, bottom: 5, left: 6 },
      textColor: INK,
      lineColor: [235, 225, 215],
      lineWidth: 0.5,
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: RED_DARK,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 9,
      font: bodyFont,
      valign: "middle",
    },
    alternateRowStyles: { fillColor: STRIPE },
    columnStyles: {
      0: { cellWidth: colW.sno, halign: "center" },
      1: { cellWidth: colW.product, halign: "left" },
      2: { cellWidth: colW.pack, halign: "left" },
      3: { cellWidth: colW.qty, halign: "center" },
      4: { cellWidth: colW.rate, halign: "right" },
      5: { cellWidth: colW.amount, halign: "right", textColor: RED_DARK, fontStyle: "bold" },
    },
  });

  const tableEnd = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableStart + 40;
  let summaryY = tableEnd + 16;

  doc.setFillColor(...GOLD_SOFT);
  doc.rect(pageWidth - margin - 180, summaryY - 10, 180, 68, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Subtotal: ${rupees(data.subtotal)}`, pageWidth - margin - 8, summaryY + 2, { align: "right" });
  doc.text(
    data.shipping > 0 ? `Shipping: ${rupees(data.shipping)}` : "Shipping: FREE",
    pageWidth - margin - 8,
    summaryY + 16,
    { align: "right" },
  );
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...RED_DARK);
  doc.text(`Grand Total: ${rupees(data.total)}`, pageWidth - margin - 8, summaryY + 32, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text("All prices in INR", pageWidth - margin - 8, summaryY + 46, { align: "right" });

  summaryY += 74;
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
    shipping: result.shipping,
    total: result.total,
    paymentMethod: result.paymentMethod,
    upiId: result.upiId,
  };
}
