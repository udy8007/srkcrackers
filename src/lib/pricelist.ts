import type { RowInput } from "jspdf-autotable";
import { BUSINESS, LICENSE_INFO } from "@/lib/constants";
import {
  buildStoreQrImageUrl,
  drawPdfHeaderQr,
  loadImageDataUrl,
} from "@/lib/pdf-helpers";
import type { CategoryWithProductsDTO } from "@/types";

type RGB = [number, number, number];

const RED_DARK: RGB = [157, 2, 8];
const RED: RGB = [214, 40, 40];
const GOLD_SOFT: RGB = [255, 244, 214];
const STRIPE: RGB = [255, 248, 242];
const INK: RGB = [43, 31, 31];
const MUTED: RGB = [110, 95, 95];

const rupees = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

/** Build and download a branded price-list PDF from the live catalog. */
export async function downloadPriceList(categories: CategoryWithProductsDTO[]) {
  const [{ default: jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 32;
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const logo = await loadImageDataUrl("/logo.png");
  const qr = await loadImageDataUrl(buildStoreQrImageUrl(140));

  const drawHeader = () => {
    if (logo) doc.addImage(logo, "PNG", margin, 22, 56, 56);
    drawPdfHeaderQr(doc, qr, pageWidth, margin, "Scan to Order", BUSINESS.url.replace("https://", ""));

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

    // Title band
    doc.setFillColor(...RED);
    doc.rect(margin, 98, pageWidth - 2 * margin, 20, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text("PRICE LIST  —  FLAT 80% OFF", margin + 8, 112);
    doc.setFontSize(9);
    doc.text(`Date: ${today}`, pageWidth - margin - 8, 112, { align: "right" });
  };

  const head = [["S.No", "Product", "Pack", "MRP", "Offer Price", "Req. Qty"]];
  const body: RowInput[] = [];

  let serial = 0;
  for (const category of categories) {
    if (!category.products.length) continue;
    body.push([
      {
        content: category.label.toUpperCase(),
        colSpan: 6,
        styles: {
          fillColor: GOLD_SOFT,
          textColor: RED_DARK,
          fontStyle: "bold",
          fontSize: 9.5,
          halign: "left",
        },
      },
    ]);
    for (const product of category.products) {
      serial += 1;
      body.push([serial, product.name, product.pack, rupees(product.mrp), rupees(product.price), ""]);
    }
  }

  autoTable(doc, {
    head,
    body,
    margin: { top: 128, bottom: 46, left: margin, right: margin },
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
      2: { cellWidth: 90 },
      3: { cellWidth: 62, halign: "right" },
      4: { cellWidth: 66, halign: "right", textColor: RED_DARK, fontStyle: "bold" },
      5: { cellWidth: 54, halign: "center" },
    },
    didDrawPage: () => {
      drawHeader();
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      doc.text(
        `Thank you for choosing ${BUSINESS.name}!  ${BUSINESS.phoneDisplay}  |  ${BUSINESS.url.replace("https://", "")}`,
        margin,
        pageHeight - 26,
      );
    },
  });

  // Page numbers (added after layout so total count is known)
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 26, { align: "right" });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`SRK-Crackers-Price-List-${stamp}.pdf`);
}
