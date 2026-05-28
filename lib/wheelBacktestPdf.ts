import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type {
  WheelBacktestEquityPoint,
  WheelBacktestResult,
  WheelBacktestTrade,
} from "@/app/types/wheelBacktest";
import type { WheelBacktestRunParams } from "@/lib/wheelBacktestExport";
import { formatDateMMDDYYYY } from "@/lib/dateUtils";

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

function formatPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "n/a";
  const sign = value > 0 ? "+" : "";
  return pdfAscii(`${sign}${value.toFixed(digits)}%`);
}

function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatUsd(Math.abs(value))}`;
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

function keyValueTable(
  ctx: PdfContext,
  rows: [string, string][],
): void {
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
  opts?: { fontSize?: number },
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
      fontSize: opts?.fontSize ?? 8,
    },
    bodyStyles: {
      fontSize: opts?.fontSize ?? 8,
      textColor: TEXT,
    },
    alternateRowStyles: { fillColor: [245, 247, 246] },
    margin: { left: MARGIN, right: MARGIN },
    showHead: "everyPage",
  });
  ctx.y = (ctx.doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY + 6;
}

export function wheelBacktestPdfFilename(result: WheelBacktestResult): string {
  const safeSymbol = result.symbol.replace(/[^A-Za-z0-9.-]/g, "");
  return `wheel-backtest-${safeSymbol}-${result.lookbackYears}y-${result.endDate}.pdf`;
}

export function downloadWheelBacktestPdf(
  result: WheelBacktestResult,
  run: WheelBacktestRunParams,
): void {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const ctx: PdfContext = { doc, y: MARGIN };
  const totalDeposited =
    result.startingCashUsd + (result.capitalTopUpsUsd ?? 0);

  doc.setFillColor(245, 250, 248);
  doc.rect(0, 0, 210, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...TEXT);
  doc.text(pdfAscii("Wheel Backtest Report"), MARGIN, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    pdfAscii(
      `${result.symbol} | ${result.lookbackYears}-year horizon | ${fmtDate(result.startDate)} - ${fmtDate(result.endDate)}`,
    ),
    MARGIN,
    21,
  );
  doc.text(
    pdfAscii(
      `Exported ${new Date().toLocaleString()} | Model premiums (not live option quotes)`,
    ),
    MARGIN,
    27,
  );

  ctx.y = 40;

  sectionTitle(ctx, "Run settings");
  keyValueTable(ctx, [
    ["Symbol", result.symbol],
    ["Horizon", `${result.lookbackYears} years`],
    ["Delta band", `${run.targetDeltaMin.toFixed(2)} - ${run.targetDeltaMax.toFixed(2)}`],
    ["DTE (trading days)", String(run.dteDays)],
    ["Add cash if CSP needs more", run.maintainOneLot ? "Yes" : "No"],
    [
      "History",
      `${fmtDate(result.historyStartDate ?? result.startDate)} → ${fmtDate(result.endDate)} (${result.tradingDays} bars)`,
    ],
    ...(result.firstTradeDate
      ? [["First trade", fmtDate(result.firstTradeDate)] as [string, string]]
      : []),
    ...(result.lastTradeDate
      ? [["Last trade", fmtDate(result.lastTradeDate)] as [string, string]]
      : []),
  ]);

  sectionTitle(ctx, "Capital & performance");
  const capitalRows: [string, string][] = [
    ["Stock at first CSP", `${formatUsd(result.spotPriceAtStart, 2)}/share`],
    [
      "Initial cash secured",
      `${formatUsd(result.initialCollateralUsd)} (strike ${formatUsd(result.initialPutStrikeUsd, 2)} x 100)`,
    ],
    ["Starting wallet", formatUsd(result.startingCashUsd)],
  ];
  if ((result.capitalTopUpsUsd ?? 0) > 0) {
    capitalRows.push(
      ["Extra cash added later", formatUsd(result.capitalTopUpsUsd)],
      ["All money you put in", formatUsd(totalDeposited)],
    );
  }
  capitalRows.push(
    ["Ending equity", formatUsd(result.endingEquityUsd)],
    [
      "Total P/L",
      `${formatSignedUsd(result.totalPlUsd)} (${formatPct(result.totalReturnPct)})`,
    ],
  );
  if (result.cagrPct != null) {
    capitalRows.push([
      "CAGR",
      `${formatPct(result.cagrPct, 1)}${(result.capitalTopUpsUsd ?? 0) > 0 ? " on all money put in" : ""}`,
    ]);
  }
  capitalRows.push(
    [
      "Stock price",
      `${formatUsd(result.spotPriceAtStart, 2)} to ${formatUsd(result.spotPriceAtEnd, 2)}`,
    ],
    [
      "Buy & hold (same start)",
      `${formatUsd(result.buyAndHoldEndingUsd)} (${formatPct(result.buyAndHoldReturnPct)})`,
    ],
    ["Premium collected", formatUsd(result.totalPremiumCollectedUsd)],
    ["Fees", formatUsd(result.totalFeesUsd)],
    ["CSP rounds", String(result.cspRounds ?? 0)],
    [
      "Full wheels",
      `${result.completedWheelCycles} (put assign → call assign)`,
    ],
    [
      "Assignments",
      `${result.putAssignments} puts / ${result.callsAssigned} calls`,
    ],
  );
  keyValueTable(ctx, capitalRows);

  if (result.annualSummary.length > 0) {
    sectionTitle(ctx, "Year by year");
    dataTable(
      ctx,
      ["Year", "Start", "End", "P/L $", "P/L %", "Premium"],
      result.annualSummary.map((row) => {
        const pl = row.plUsd ?? row.endEquityUsd - row.startEquityUsd;
        return [
          String(row.year),
          formatUsd(row.startEquityUsd),
          formatUsd(row.endEquityUsd),
          formatSignedUsd(pl),
          formatPct(row.returnPct, 2),
          formatUsd(row.premiumUsd),
        ];
      }),
    );
  }

  if (result.wheelCycles.length > 0) {
    sectionTitle(ctx, "Stock entry & exit (assigned cycles)");
    dataTable(
      ctx,
      ["#", "Entry", "Exit", "Entry $", "Exit $", "Stock P/L"],
      result.wheelCycles.map((cycle) => [
        String(cycle.cycle),
        cycle.stockEntryDate ? fmtDate(cycle.stockEntryDate) : "-",
        cycle.completed && cycle.stockExitDate
          ? fmtDate(cycle.stockExitDate)
          : "Incomplete",
        cycle.stockEntryClose != null
          ? formatUsd(cycle.stockEntryClose, 2)
          : "-",
        cycle.stockExitClose != null
          ? formatUsd(cycle.stockExitClose, 2)
          : "-",
        cycle.stockRoundTripPlUsd != null
          ? formatSignedUsd(cycle.stockRoundTripPlUsd)
          : "-",
      ]),
    );
  }

  if (result.trades.length > 0) {
    sectionTitle(ctx, `Trade log (${result.trades.length} events)`);
    const { cycles, other } = groupTradesByCycle(result.trades);
    const tradeRows: string[][] = [];

    for (const trade of other) {
      tradeRows.push(formatTradeRow(trade));
    }
    for (const group of cycles) {
      tradeRows.push([
        `-- Cycle ${group.id} --`,
        "",
        "",
        "",
        "",
        "",
      ]);
      for (const trade of group.trades) {
        tradeRows.push(formatTradeRow(trade));
      }
    }

    dataTable(
      ctx,
      ["Date", "Step", "Strike", "Stock", "Premium", "Cash flow"],
      tradeRows,
      { fontSize: 7 },
    );
  }

  const monthly = monthlyEquitySnapshots(result.equityCurve);
  if (monthly.length > 0) {
    sectionTitle(ctx, `Monthly equity (${monthly.length} month-ends)`);
    dataTable(
      ctx,
      ["Date", "Equity", "Cash", "Shares", "Phase"],
      monthly.map((point) => [
        fmtDate(point.date),
        formatUsd(point.equityUsd),
        formatUsd(point.cashUsd),
        String(point.shares),
        point.phase,
      ]),
      { fontSize: 7 },
    );
  }

  sectionTitle(ctx, "Charts");
  ensureSpace(ctx, 12);
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(...MUTED);
  ctx.doc.text(
    pdfAscii(
      "Interactive charts in the app: equity vs buy & hold, drawdown, stock price with put/call strikes, and phase timeline.",
    ),
    MARGIN,
    ctx.y,
    { maxWidth: ctx.doc.internal.pageSize.getWidth() - MARGIN * 2 },
  );
  ctx.y += 10;

  if (result.assumptions.length > 0) {
    sectionTitle(ctx, "Model assumptions");
    ensureSpace(ctx, 8 + result.assumptions.length * 5);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...TEXT);
    for (const item of result.assumptions) {
      const lines = doc.splitTextToSize(pdfAscii(`* ${item}`), 210 - MARGIN * 2);
      for (const line of lines) {
        ensureSpace(ctx, 5);
        doc.text(line, MARGIN, ctx.y);
        ctx.y += 4.5;
      }
      ctx.y += 1;
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(
      pdfAscii(
        `Wheel backtest | ${result.symbol} | Page ${page} of ${pageCount}`,
      ),
      MARGIN,
      292,
    );
  }

  doc.save(wheelBacktestPdfFilename(result));
}

function formatTradeRow(trade: WheelBacktestTrade): string[] {
  const stock = trade.stockPrice ?? trade.close;
  return [
    fmtDate(trade.date),
    pdfAscii((trade.label ?? trade.action).slice(0, 42)),
    trade.strike != null ? formatUsd(trade.strike, 2) : "-",
    formatUsd(stock, 2),
    trade.premiumUsd > 0 ? formatUsd(trade.premiumUsd) : "-",
    trade.cashFlowUsd != null ? formatSignedUsd(trade.cashFlowUsd) : "-",
  ];
}
