import type {
  DividendAdvancedSnowballScenario,
  DividendBacktestYearRow,
} from "@/app/types/research";
import {
  applyBrandedPdfFooters,
  createPdfDocument,
  drawBrandedPdfHeader,
  ensurePdfSpace,
  formatPdfPct,
  formatPdfUsd,
  pdfAscii,
  PDF_COLORS,
  PDF_MARGIN,
  pdfDataTable,
  pdfKeyValueTable,
  pdfSectionTitle,
  type PdfContext,
} from "@/lib/pdfReport";

function formatPerShare(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1) return formatPdfUsd(value, 2);
  if (value >= 0.1) return formatPdfUsd(value, 3);
  return formatPdfUsd(value, 4);
}

function formatShares(value: number): string {
  return pdfAscii(
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }),
  );
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
  endYearAnnualIncome?: number | null;
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
  const { doc, ctx: baseCtx } = createPdfDocument();
  const ctx: PdfContext = baseCtx;
  const windowYears = input.endYear - input.startYear + 1;
  const drip = result.drip;

  ctx.y = drawBrandedPdfHeader(doc, {
    title: "Dividend Historical Backtest",
    subtitle: `${input.ticker} | ${input.startYear} to ${input.endYear} (${windowYears} years)`,
    meta: `Exported ${new Date().toLocaleString()} | Recorded dividends with ${
      drip?.usesHistoricalSharePrices
        ? "actual year-end share prices"
        : "modeled share prices where history is unavailable"
    }`,
  });

  pdfSectionTitle(ctx, "Run settings");
  const settingsRows: [string, string][] = [
    ["Symbol", input.ticker],
    ["Window", `${input.startYear} to ${input.endYear} (${windowYears} years)`],
  ];
  if (input.investmentUsd != null && input.investmentUsd > 0) {
    settingsRows.push(["Investment", formatPdfUsd(input.investmentUsd, 0)]);
  }
  if (input.sharePriceAtStart != null && input.sharePriceAtStart > 0) {
    settingsRows.push([
      `Share price (${input.startYear})`,
      `${formatPdfUsd(input.sharePriceAtStart, 2)}/share`,
    ]);
  }
  settingsRows.push(["Starting shares", formatShares(input.shares)]);
  settingsRows.push([
    "Annual contribution",
    input.annualContributionUsd > 0
      ? `${formatPdfUsd(input.annualContributionUsd, 0)}/yr after ${input.startYear}`
      : "None",
  ]);
  settingsRows.push([
    "Reinvest dividends (DRIP)",
    input.reinvestDividends ? "On" : "Off",
  ]);
  if (
    !drip?.usesHistoricalSharePrices &&
    input.priceCagrPct != null &&
    Number.isFinite(input.priceCagrPct)
  ) {
    settingsRows.push([
      "Modeled price growth (fallback)",
      `${formatPdfPct(input.priceCagrPct, 1)}/yr`,
    ]);
  }
  if (drip?.usesHistoricalSharePrices) {
    settingsRows.push([
      "Share prices",
      "Actual year-end adjusted closes",
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
  pdfKeyValueTable(ctx, settingsRows);

  pdfSectionTitle(ctx, "Summary results");
  const summaryRows: [string, string][] = [
    ["Total dividend income", formatPdfUsd(result.cashCollected, 0)],
  ];
  if (result.endYearAnnualIncome != null && result.endYearAnnualIncome > 0) {
    summaryRows.push([
      `Annual income · ${input.endYear}`,
      formatPdfUsd(result.endYearAnnualIncome, 0),
    ]);
  }
  if (drip) {
    summaryRows.push(
      ["Portfolio value (DRIP)", formatPdfUsd(drip.portfolioValueLatest, 0)],
      [
        "Shares after DRIP",
        `${formatShares(drip.finalShares)} (started ${formatShares(drip.initialShares)})`,
      ],
      ["Dividends reinvested", formatPdfUsd(drip.totalDividendsReinvested, 0)],
    );
    if (drip.totalAnnualContributionsUsd != null && drip.totalAnnualContributionsUsd > 0) {
      summaryRows.push([
        "New cash contributed",
        formatPdfUsd(drip.totalAnnualContributionsUsd, 0),
      ]);
    }
    if (drip.usesHistoricalSharePrices) {
      summaryRows.push([
        "Share prices used",
        "Actual year-end adjusted closes each year",
      ]);
    } else {
      summaryRows.push([
        "Modeled price growth used",
        `${formatPdfPct(drip.priceCagrPct, 1)}/yr`,
      ]);
    }
  }
  pdfKeyValueTable(ctx, summaryRows);

  if (result.yearlyRows.length > 0) {
    pdfSectionTitle(ctx, `Year by year (${result.yearlyRows.length} years)`);
    pdfDataTable(
      ctx,
      ["Year", "DPS", "Shares", "Annual income", "Yield"],
      result.yearlyRows.map((row) => [
        String(row.year),
        formatPerShare(row.dps),
        formatShares(row.shares),
        formatPdfUsd(row.dividendIncome, 0),
        formatPdfPct(row.dividendYieldPct, 1),
      ]),
    );
  }

  pdfSectionTitle(ctx, "Methodology");
  ensurePdfSpace(ctx, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.TEXT);
  const assumptions = [
    `Backtest replays actual dividend per share (DPS) from ${input.startYear} through ${input.endYear} using ${formatShares(input.shares)} shares at modeled ${input.startYear} prices${
      input.investmentUsd != null && input.investmentUsd > 0
        ? ` (${formatPdfUsd(input.investmentUsd, 0)} invested)`
        : ""
    }.`,
    input.annualContributionUsd > 0
      ? `Includes ${formatPdfUsd(input.annualContributionUsd, 0)} of new cash at the start of each year after ${input.startYear}.`
      : "No recurring cash contributions were modeled.",
    drip
      ? drip.usesHistoricalSharePrices
        ? "DRIP reinvests at each year's actual year-end adjusted close. Yield uses annual DPS divided by that year's close."
        : `DRIP assumes ${formatPdfPct(drip.priceCagrPct, 1)} annual price growth and reinvestment at year-end modeled prices. Yield uses annual DPS divided by modeled share price that year.`
      : input.reinvestDividends
        ? "DRIP was requested but could not be modeled without share price data."
        : "DRIP is off; dividend cash totals exclude reinvestment.",
    "Past dividends do not guarantee future payouts. This report is for research only, not investment advice.",
  ];
  for (const item of assumptions) {
    const lines = doc.splitTextToSize(pdfAscii(`* ${item}`), 210 - PDF_MARGIN * 2);
    for (const line of lines) {
      ensurePdfSpace(ctx, 5);
      doc.text(line, PDF_MARGIN, ctx.y);
      ctx.y += 4.5;
    }
    ctx.y += 1;
  }

  applyBrandedPdfFooters(doc, {
    reportLabel: "Dividend backtest",
    detail: input.ticker,
  });

  doc.save(dividendBacktestPdfFilename(input));
}
