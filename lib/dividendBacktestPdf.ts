import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  DividendAdvancedSnowballScenario,
  DividendBacktestYearRow,
} from "@/app/types/research";

const MARGIN = 14;
const PAGE_BOTTOM = 285;
const ACCENT: [number, number, number] = [16, 185, 129];
const MUTED: [number, number, number] = [115, 115, 115];
const TEXT: [number, number, number] = [28, 28, 30];

/** jsPDF built-in fonts only render WinAnsi reliably; strip Unicode punctuation. */
function pdfAscii(text: string): string {
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

function formatUsd(value: number, fraction = 0): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const [intPart, decPart] = abs.toFixed(fraction).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (fraction > 0 && decPart !== undefined) {
    return pdfAscii(`${sign}$${grouped}.${decPart}`);
  }
  return pdfAscii(`${sign}$${grouped}`);
}

function formatPct(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }
  return pdfAscii(`${value.toFixed(digits)}%`);
}

function formatPerShare(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1) return formatUsd(value, 2);
  if (value >= 0.1) return formatUsd(value, 3);
  return formatUsd(value, 4);
}

function formatShares(value: number): string {
  return pdfAscii(
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
  );
}

type PdfContext = {
  doc: jsPDF;
  y: number;
};

function ensureSpace(ctx: PdfContext, needed: number): void {
  if (ctx.y + needed > PAGE_BOTTOM) {
    ctx.doc.addPage();
    ctx.y = MARGIN;
  }
}

function sectionTitle(ctx: PdfContext, title: string): void {
  ensureSpace(ctx, 12);
  ctx.doc.setFont("helvetica", "bold");
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(...ACCENT);
  ctx.doc.text(pdfAscii(title), MARGIN, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(...ACCENT);
  ctx.doc.setLineWidth(0.4);
  ctx.doc.line(MARGIN, ctx.y, 210 - MARGIN, ctx.y);
  ctx.y += 5;
}

function keyValueTable(ctx: PdfContext, rows: [string, string][]): void {
  autoTable(ctx.doc, {
    startY: ctx.y,
    body: rows.map(([label, value]) => [pdfAscii(label), pdfAscii(value)]),
    theme: "plain",
    styles: {
      fontSize: 9,
      textColor: TEXT,
      cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 0 },
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 58, textColor: MUTED },
      1: { cellWidth: "auto" },
    },
    margin: { left: MARGIN, right: MARGIN },
  });
  ctx.y = (ctx.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;
}

function dataTable(
  ctx: PdfContext,
  head: string[],
  body: (string | number)[][],
): void {
  autoTable(ctx.doc, {
    startY: ctx.y,
    head: [head.map((cell) => pdfAscii(String(cell)))],
    body: body.map((row) => row.map((cell) => pdfAscii(String(cell)))),
    theme: "striped",
    headStyles: {
      fillColor: ACCENT,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: TEXT,
    },
    alternateRowStyles: { fillColor: [245, 247, 246] },
    margin: { left: MARGIN, right: MARGIN },
    showHead: "everyPage",
  });
  ctx.y = (ctx.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;
}

export type DividendBacktestPdfInput = {
  ticker: string;
  startYear: number;
  endYear: number;
  investmentUsd: number | null;
  sharePriceAtStart: number | null;
  shares: number;
  annualContributionUsd: number;
  reinvestDividends: boolean;
  priceCagrPct: number | null;
  hasPendingChanges?: boolean;
  dataAsOf?: string | null;
};

export type DividendBacktestPdfResult = {
  cashCollected: number;
  cashCollectedAnnual: number;
  drip?: DividendAdvancedSnowballScenario | null;
  yearlyRows: DividendBacktestYearRow[];
};

export function dividendBacktestPdfFilename(input: DividendBacktestPdfInput): string {
  const safeSymbol = input.ticker.replace(/[^A-Za-z0-9.-]/g, "");
  return `dividend-backtest-${safeSymbol}-${input.startYear}-${input.endYear}.pdf`;
}

export function downloadDividendBacktestPdf(
  input: DividendBacktestPdfInput,
  result: DividendBacktestPdfResult,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ctx: PdfContext = { doc, y: MARGIN };
  const windowYears = input.endYear - input.startYear + 1;
  const drip = result.drip;

  doc.setFillColor(245, 250, 248);
  doc.rect(0, 0, 210, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT);
  doc.text(pdfAscii("Dividend Historical Backtest"), MARGIN, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    pdfAscii(
      `${input.ticker} | ${input.startYear} to ${input.endYear} (${windowYears} years)`,
    ),
    MARGIN,
    21,
  );
  doc.text(
    pdfAscii(
      `Exported ${new Date().toLocaleString()} | Recorded dividend amounts with modeled share prices`,
    ),
    MARGIN,
    27,
  );

  ctx.y = 40;

  sectionTitle(ctx, "Run settings");
  const settingsRows: [string, string][] = [
    ["Symbol", input.ticker],
    ["Window", `${input.startYear} to ${input.endYear} (${windowYears} years)`],
  ];
  if (input.investmentUsd != null && input.investmentUsd > 0) {
    settingsRows.push(["Investment", formatUsd(input.investmentUsd, 0)]);
  }
  if (input.sharePriceAtStart != null && input.sharePriceAtStart > 0) {
    settingsRows.push([
      `Share price (${input.startYear})`,
      `${formatUsd(input.sharePriceAtStart, 2)}/share`,
    ]);
  }
  settingsRows.push(["Starting shares", formatShares(input.shares)]);
  settingsRows.push([
    "Annual contribution",
    input.annualContributionUsd > 0
      ? `${formatUsd(input.annualContributionUsd, 0)}/yr after ${input.startYear}`
      : "None",
  ]);
  settingsRows.push([
    "Reinvest dividends (DRIP)",
    input.reinvestDividends ? "On" : "Off",
  ]);
  if (input.priceCagrPct != null && Number.isFinite(input.priceCagrPct)) {
    settingsRows.push([
      "Modeled price growth",
      `${formatPct(input.priceCagrPct, 1)}/yr`,
    ]);
  }
  if (input.dataAsOf) {
    settingsRows.push(["Dividend data as of", input.dataAsOf]);
  }
  if (input.hasPendingChanges) {
    settingsRows.push([
      "Note",
      "Results reflect your last run; form has unapplied changes",
    ]);
  }
  keyValueTable(ctx, settingsRows);

  sectionTitle(ctx, "Summary results");
  const summaryRows: [string, string][] = [
    [
      "Cash collected",
      formatUsd(result.cashCollected, 0),
    ],
    [
      "Annual totals",
      formatUsd(result.cashCollectedAnnual, 0),
    ],
  ];
  if (drip) {
    summaryRows.push(
      ["Portfolio value (DRIP)", formatUsd(drip.portfolioValueLatest, 0)],
      [
        "Shares after DRIP",
        `${formatShares(drip.finalShares)} (started ${formatShares(drip.initialShares)})`,
      ],
      ["Dividends reinvested", formatUsd(drip.totalDividendsReinvested, 0)],
    );
    if (drip.totalAnnualContributionsUsd != null && drip.totalAnnualContributionsUsd > 0) {
      summaryRows.push([
        "New cash contributed",
        formatUsd(drip.totalAnnualContributionsUsd, 0),
      ]);
    }
    summaryRows.push([
      "Modeled price growth used",
      `${formatPct(drip.priceCagrPct, 1)}/yr`,
    ]);
  }
  keyValueTable(ctx, summaryRows);

  if (result.yearlyRows.length > 0) {
    sectionTitle(ctx, `Year by year (${result.yearlyRows.length} years)`);
    dataTable(
      ctx,
      ["Year", "DPS", "Shares", "Dividend received", "Yield"],
      result.yearlyRows.map((row) => [
        String(row.year),
        formatPerShare(row.dps),
        formatShares(row.shares),
        formatUsd(row.dividendIncome, 0),
        formatPct(row.dividendYieldPct, 1),
      ]),
    );
  }

  sectionTitle(ctx, "Methodology");
  ensureSpace(ctx, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...TEXT);
  const assumptions = [
    `Backtest replays actual dividend per share (DPS) from ${input.startYear} through ${input.endYear} using ${formatShares(input.shares)} shares at modeled ${input.startYear} prices${
      input.investmentUsd != null && input.investmentUsd > 0
        ? ` (${formatUsd(input.investmentUsd, 0)} invested)`
        : ""
    }.`,
    input.annualContributionUsd > 0
      ? `Includes ${formatUsd(input.annualContributionUsd, 0)} of new cash at the start of each year after ${input.startYear}.`
      : "No recurring cash contributions were modeled.",
    drip
      ? `DRIP assumes ${formatPct(drip.priceCagrPct, 1)} annual price growth and reinvestment at year-end modeled prices. Yield uses annual DPS divided by modeled share price that year.`
      : input.reinvestDividends
        ? "DRIP was requested but could not be modeled without share price data."
        : "DRIP is off; dividend cash totals exclude reinvestment.",
    "Past dividends do not guarantee future payouts. This report is for research only, not investment advice.",
  ];
  for (const item of assumptions) {
    const lines = doc.splitTextToSize(pdfAscii(`* ${item}`), 210 - MARGIN * 2);
    for (const line of lines) {
      ensureSpace(ctx, 5);
      doc.text(line, MARGIN, ctx.y);
      ctx.y += 4.5;
    }
    ctx.y += 1;
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      pdfAscii(
        `Dividend backtest | ${input.ticker} | Page ${page} of ${pageCount}`,
      ),
      MARGIN,
      292,
    );
  }

  doc.save(dividendBacktestPdfFilename(input));
}
