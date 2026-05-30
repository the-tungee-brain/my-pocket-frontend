import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  BRAND_NAME,
  BRAND_SITE_HOST,
  BRAND_TAGLINE,
} from "@/lib/brand";

export const PDF_MARGIN = 14;
export const PDF_PAGE_BOTTOM = 285;
export const PDF_HEADER_HEIGHT = 40;

export const PDF_COLORS = {
  ACCENT: [16, 185, 129] as [number, number, number],
  MUTED: [115, 115, 115] as [number, number, number],
  TEXT: [28, 28, 30] as [number, number, number],
  HEADER_BG: [245, 250, 248] as [number, number, number],
  TABLE_ALT: [245, 247, 246] as [number, number, number],
};

/** jsPDF built-in fonts only render WinAnsi reliably; strip Unicode punctuation. */
export function pdfAscii(text: string): string {
  return text
    .replace(/\u2212/g, "-")
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "-")
    .replace(/\u2022/g, "*")
    .replace(/\u00B7/g, " ")
    .replace(/\u2192/g, " to ")
    .replace(/\u00D7/g, "x")
    .replace(/\u00A0/g, " ");
}

export function formatPdfUsd(value: number, fraction = 0): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const [intPart, decPart] = abs.toFixed(fraction).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (fraction > 0 && decPart !== undefined) {
    return pdfAscii(`${sign}$${grouped}.${decPart}`);
  }
  return pdfAscii(`${sign}$${grouped}`);
}

export function formatPdfPct(
  value: number | null | undefined,
  digits = 2,
  signed = false,
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }
  const sign = signed && value > 0 ? "+" : "";
  return pdfAscii(`${sign}${value.toFixed(digits)}%`);
}

export type PdfContext = {
  doc: jsPDF;
  y: number;
};

export function createPdfDocument(): { doc: jsPDF; ctx: PdfContext } {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  return { doc, ctx: { doc, y: PDF_MARGIN } };
}

export function ensurePdfSpace(ctx: PdfContext, needed: number): void {
  if (ctx.y + needed > PDF_PAGE_BOTTOM) {
    ctx.doc.addPage();
    ctx.y = PDF_MARGIN;
  }
}

export function drawBrandedPdfHeader(
  doc: jsPDF,
  options: {
    title: string;
    subtitle: string;
    meta?: string;
  },
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(...PDF_COLORS.HEADER_BG);
  doc.rect(0, 0, pageWidth, PDF_HEADER_HEIGHT, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.ACCENT);
  doc.text(pdfAscii(BRAND_NAME), PDF_MARGIN, 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text(pdfAscii(BRAND_TAGLINE), PDF_MARGIN, 14.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.TEXT);
  doc.text(pdfAscii(options.title), PDF_MARGIN, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text(pdfAscii(options.subtitle), PDF_MARGIN, 28.5);

  const meta =
    options.meta ??
    pdfAscii(`Exported ${new Date().toLocaleString()} | ${BRAND_SITE_HOST}`);
  doc.setFontSize(8);
  doc.text(pdfAscii(meta), PDF_MARGIN, 35.5);

  return PDF_HEADER_HEIGHT + 6;
}

export function applyBrandedPdfFooters(
  doc: jsPDF,
  options: {
    reportLabel: string;
    detail?: string;
  },
): void {
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.MUTED);

    const brandLine = pdfAscii(`${BRAND_NAME} · ${BRAND_SITE_HOST}`);
    doc.text(brandLine, PDF_MARGIN, 292);

    const pageLine = pdfAscii(
      `${options.reportLabel}${options.detail ? ` · ${options.detail}` : ""} · Page ${page} of ${pageCount}`,
    );
    const pageLineWidth = doc.getTextWidth(pageLine);
    doc.text(pageLine, pageWidth - PDF_MARGIN - pageLineWidth, 292);
  }
}

export function pdfSectionTitle(ctx: PdfContext, title: string): void {
  ensurePdfSpace(ctx, 12);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(...PDF_COLORS.ACCENT);
  ctx.doc.text(pdfAscii(title), PDF_MARGIN, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(...PDF_COLORS.ACCENT);
  ctx.doc.setLineWidth(0.4);
  ctx.doc.line(PDF_MARGIN, ctx.y, 210 - PDF_MARGIN, ctx.y);
  ctx.y += 5;
}

export function pdfKeyValueTable(
  ctx: PdfContext,
  rows: [string, string][],
): void {
  autoTable(ctx.doc, {
    startY: ctx.y,
    body: rows.map(([label, value]) => [pdfAscii(label), pdfAscii(value)]),
    theme: "plain",
    styles: {
      fontSize: 9,
      textColor: PDF_COLORS.TEXT,
      cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 0 },
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 58, textColor: PDF_COLORS.MUTED },
      1: { cellWidth: "auto" },
    },
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
  });
  ctx.y = (ctx.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;
}

export function pdfDataTable(
  ctx: PdfContext,
  head: string[],
  body: (string | number)[][],
  opts?: { fontSize?: number },
): void {
  autoTable(ctx.doc, {
    startY: ctx.y,
    head: [head.map((cell) => pdfAscii(String(cell)))],
    body: body.map((row) => row.map((cell) => pdfAscii(String(cell)))),
    theme: "striped",
    headStyles: {
      fillColor: PDF_COLORS.ACCENT,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: opts?.fontSize ?? 8,
    },
    bodyStyles: {
      fontSize: opts?.fontSize ?? 8,
      textColor: PDF_COLORS.TEXT,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.TABLE_ALT },
    margin: { left: PDF_MARGIN, right: PDF_MARGIN },
    showHead: "everyPage",
  });
  ctx.y = (ctx.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;
}
