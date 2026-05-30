import type {
  WheelBacktestEquityPoint,
  WheelBacktestResult,
  WheelBacktestTrade,
} from "@/app/types/wheelBacktest";
import type { WheelBacktestRunParams } from "@/lib/wheelBacktestExport";
import { formatDateMMDDYYYY } from "@/lib/dateUtils";
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
import { wheelBacktestDteLabel } from "@/lib/wheelBacktestDte";

function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatPdfUsd(Math.abs(value))}`;
}

function fmtDate(iso: string): string {
  return formatDateMMDDYYYY(iso);
}

function monthlyEquitySnapshots(
  curve: WheelBacktestEquityPoint[],
): WheelBacktestEquityPoint[] {
  const byMonth = new Map<string, WheelBacktestEquityPoint>();
  for (const point of curve) {
    byMonth.set(point.date.slice(0, 7), point);
  }
  return [...byMonth.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function groupTradesByCycle(trades: WheelBacktestTrade[]): {
  cycles: { id: number; trades: WheelBacktestTrade[] }[];
  other: WheelBacktestTrade[];
} {
  const byCycle = new Map<number, WheelBacktestTrade[]>();
  const other: WheelBacktestTrade[] = [];

  for (const trade of trades) {
    const cycle = trade.wheelCycle;
    if (cycle == null) {
      other.push(trade);
      continue;
    }
    const list = byCycle.get(cycle) ?? [];
    list.push(trade);
    byCycle.set(cycle, list);
  }

  return {
    cycles: [...byCycle.entries()]
      .sort(([a], [b]) => a - b)
      .map(([id, cycleTrades]) => ({
        id,
        trades: [...cycleTrades].sort((a, b) => a.date.localeCompare(b.date)),
      })),
    other,
  };
}

export function wheelBacktestPdfFilename(result: WheelBacktestResult): string {
  const safeSymbol = result.symbol.replace(/[^A-Za-z0-9.-]/g, "");
  return `wheel-backtest-${safeSymbol}-${result.lookbackYears}y-${result.endDate}.pdf`;
}

export function downloadWheelBacktestPdf(
  result: WheelBacktestResult,
  run: WheelBacktestRunParams,
): void {
  const { doc, ctx: baseCtx } = createPdfDocument();
  const ctx: PdfContext = baseCtx;
  const totalDeposited =
    result.startingCashUsd + (result.capitalTopUpsUsd ?? 0);

  ctx.y = drawBrandedPdfHeader(doc, {
    title: "Wheel Backtest Report",
    subtitle: `${result.symbol} | ${result.lookbackYears}-year horizon | ${fmtDate(result.startDate)} - ${fmtDate(result.endDate)}`,
    meta: `Exported ${new Date().toLocaleString()} | Model premiums (not live option quotes)`,
  });

  pdfSectionTitle(ctx, "Run settings");
  pdfKeyValueTable(ctx, [
    ["Symbol", result.symbol],
    ["Horizon", `${result.lookbackYears} years`],
    ["Delta band", `${run.targetDeltaMin.toFixed(2)} - ${run.targetDeltaMax.toFixed(2)}`],
    ["DTE", wheelBacktestDteLabel(run.dteDays)],
    ["Add cash if CSP needs more", run.maintainOneLot ? "Yes" : "No"],
    [
      "Covered calls after assign",
      run.callStrikeMode === "at_or_above_assignment"
        ? "Strike at or above assignment put"
        : "Target delta only",
    ],
    [
      "History",
      `${fmtDate(result.historyStartDate ?? result.startDate)} to ${fmtDate(result.endDate)} (${result.tradingDays} bars)`,
    ],
    ...(result.firstTradeDate
      ? [["First trade", fmtDate(result.firstTradeDate)] as [string, string]]
      : []),
    ...(result.lastTradeDate
      ? [["Last trade", fmtDate(result.lastTradeDate)] as [string, string]]
      : []),
  ]);

  pdfSectionTitle(ctx, "Capital & performance");
  const capitalRows: [string, string][] = [
    ["Stock at first CSP", `${formatPdfUsd(result.spotPriceAtStart, 2)}/share`],
    [
      "Initial cash secured",
      `${formatPdfUsd(result.initialCollateralUsd)} (strike ${formatPdfUsd(result.initialPutStrikeUsd, 2)} x 100)`,
    ],
    ["Starting wallet", formatPdfUsd(result.startingCashUsd)],
  ];
  if ((result.capitalTopUpsUsd ?? 0) > 0) {
    capitalRows.push(
      ["Extra cash added later", formatPdfUsd(result.capitalTopUpsUsd!)],
      ["All money you put in", formatPdfUsd(totalDeposited)],
    );
  }
  capitalRows.push(
    ["Ending equity", formatPdfUsd(result.endingEquityUsd)],
    [
      "Total P/L",
      `${formatSignedUsd(result.totalPlUsd)} (${formatPdfPct(result.totalReturnPct, 2, true)})`,
    ],
  );
  if (result.cagrPct != null) {
    capitalRows.push([
      "CAGR",
      `${formatPdfPct(result.cagrPct, 1, true)}${(result.capitalTopUpsUsd ?? 0) > 0 ? " on all money put in" : ""}`,
    ]);
  }
  capitalRows.push(
    [
      "Stock price",
      `${formatPdfUsd(result.spotPriceAtStart, 2)} to ${formatPdfUsd(result.spotPriceAtEnd, 2)}`,
    ],
    [
      "Buy & hold (same start)",
      `${formatPdfUsd(result.buyAndHoldEndingUsd)} (${formatPdfPct(result.buyAndHoldReturnPct, 2, true)})`,
    ],
    ["Premium collected", formatPdfUsd(result.totalPremiumCollectedUsd)],
    ["Fees", formatPdfUsd(result.totalFeesUsd)],
    ["CSP rounds", String(result.cspRounds ?? 0)],
    [
      "Full wheels",
      `${result.completedWheelCycles} (put assign -> call assign)`,
    ],
    [
      "Assignments",
      `${result.putAssignments} puts / ${result.callsAssigned} calls`,
    ],
  );
  pdfKeyValueTable(ctx, capitalRows);

  if (result.annualSummary.length > 0) {
    pdfSectionTitle(ctx, "Year by year");
    pdfDataTable(
      ctx,
      ["Year", "Start", "End", "P/L $", "P/L %", "Premium"],
      result.annualSummary.map((row) => {
        const pl = row.plUsd ?? row.endEquityUsd - row.startEquityUsd;
        return [
          String(row.year),
          formatPdfUsd(row.startEquityUsd),
          formatPdfUsd(row.endEquityUsd),
          formatSignedUsd(pl),
          formatPdfPct(row.returnPct, 2, true),
          formatPdfUsd(row.premiumUsd),
        ];
      }),
    );
  }

  if (result.wheelCycles.length > 0) {
    pdfSectionTitle(ctx, "Stock entry & exit (assigned cycles)");
    pdfDataTable(
      ctx,
      ["#", "Entry", "Exit", "Entry $", "Exit $", "Stock P/L"],
      result.wheelCycles.map((cycle) => [
        String(cycle.cycle),
        cycle.stockEntryDate ? fmtDate(cycle.stockEntryDate) : "-",
        cycle.completed && cycle.stockExitDate
          ? fmtDate(cycle.stockExitDate)
          : "Incomplete",
        cycle.stockEntryClose != null
          ? formatPdfUsd(cycle.stockEntryClose, 2)
          : "-",
        cycle.stockExitClose != null
          ? formatPdfUsd(cycle.stockExitClose, 2)
          : "-",
        cycle.stockRoundTripPlUsd != null
          ? formatSignedUsd(cycle.stockRoundTripPlUsd)
          : "-",
      ]),
    );
  }

  if (result.trades.length > 0) {
    pdfSectionTitle(ctx, `Trade log (${result.trades.length} events)`);
    const { cycles, other } = groupTradesByCycle(result.trades);
    const tradeRows: string[][] = [];

    for (const trade of other) {
      tradeRows.push(formatTradeRow(trade));
    }
    for (const group of cycles) {
      tradeRows.push(["-- Cycle " + group.id + " --", "", "", "", "", ""]);
      for (const trade of group.trades) {
        tradeRows.push(formatTradeRow(trade));
      }
    }

    pdfDataTable(
      ctx,
      ["Date", "Step", "Strike", "Stock", "Premium", "Cash flow"],
      tradeRows,
      { fontSize: 7 },
    );
  }

  const monthly = monthlyEquitySnapshots(result.equityCurve);
  if (monthly.length > 0) {
    pdfSectionTitle(ctx, `Monthly equity (${monthly.length} month-ends)`);
    pdfDataTable(
      ctx,
      ["Date", "Equity", "Cash", "Shares", "Phase"],
      monthly.map((point) => [
        fmtDate(point.date),
        formatPdfUsd(point.equityUsd),
        formatPdfUsd(point.cashUsd),
        String(point.shares),
        point.phase,
      ]),
      { fontSize: 7 },
    );
  }

  pdfSectionTitle(ctx, "Charts");
  ensurePdfSpace(ctx, 12);
  doc.setFontSize(9);
  doc.setTextColor(...PDF_COLORS.MUTED);
  doc.text(
    pdfAscii(
      "Interactive charts in the app: equity vs buy & hold, drawdown, stock price with put/call strikes, and phase timeline.",
    ),
    PDF_MARGIN,
    ctx.y,
    { maxWidth: doc.internal.pageSize.getWidth() - PDF_MARGIN * 2 },
  );
  ctx.y += 10;

  if (result.assumptions.length > 0) {
    pdfSectionTitle(ctx, "Model assumptions");
    ensurePdfSpace(ctx, 8 + result.assumptions.length * 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.TEXT);
    for (const item of result.assumptions) {
      const lines = doc.splitTextToSize(pdfAscii(`* ${item}`), 210 - PDF_MARGIN * 2);
      for (const line of lines) {
        ensurePdfSpace(ctx, 5);
        doc.text(line, PDF_MARGIN, ctx.y);
        ctx.y += 4.5;
      }
      ctx.y += 1;
    }
  }

  applyBrandedPdfFooters(doc, {
    reportLabel: "Wheel backtest",
    detail: result.symbol,
  });

  doc.save(wheelBacktestPdfFilename(result));
}

function formatTradeRow(trade: WheelBacktestTrade): string[] {
  const stock = trade.stockPrice ?? trade.close;
  return [
    fmtDate(trade.date),
    pdfAscii((trade.label ?? trade.action).slice(0, 42)),
    trade.strike != null ? formatPdfUsd(trade.strike, 2) : "-",
    formatPdfUsd(stock, 2),
    trade.premiumUsd > 0 ? formatPdfUsd(trade.premiumUsd) : "-",
    trade.cashFlowUsd != null ? formatSignedUsd(trade.cashFlowUsd) : "-",
  ];
}
