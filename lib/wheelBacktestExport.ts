import type {
  WheelBacktestResult,
  WheelBacktestTrade,
} from "@/app/types/wheelBacktest";
import { formatDateMMDDYYYY } from "@/lib/dateUtils";

export type WheelBacktestRunParams = {
  symbol: string;
  lookbackYears: number;
  targetDeltaMin: number;
  targetDeltaMax: number;
  dteDays: number;
  maintainOneLot: boolean;
};

const RULE = "═".repeat(72);
const RULE_LIGHT = "─".repeat(72);

function formatUsd(value: number, fraction = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(value);
}

function formatPct(value: number | null | undefined, digits = 2): string {
  if (value === null || value === undefined) return "n/a";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

function formatSignedUsd(value: number): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatUsd(Math.abs(value))}`;
}

function formatIsoDate(iso: string): string {
  return formatDateMMDDYYYY(iso);
}

function section(title: string): string[] {
  return ["", title, RULE_LIGHT];
}

function row(label: string, value: string): string {
  return `  ${label.padEnd(28)} ${value}`;
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

  const cycles = [...byCycle.entries()]
    .sort(([a], [b]) => a - b)
    .map(([id, cycleTrades]) => ({
      id,
      trades: [...cycleTrades].sort((a, b) => a.date.localeCompare(b.date)),
    }));

  return { cycles, other };
}

function formatTradeLine(trade: WheelBacktestTrade): string[] {
  const lines: string[] = [];
  const head = `  ${formatIsoDate(trade.date)}  ${trade.label ?? trade.action}`;
  lines.push(head);

  const details: string[] = [];
  if (trade.strike != null) details.push(`strike ${formatUsd(trade.strike, 2)}`);
  const stock = trade.stockPrice ?? trade.close;
  if (stock != null) details.push(`stock ${formatUsd(stock, 2)}`);
  if (trade.collateralReservedUsd != null && trade.collateralReservedUsd > 0) {
    details.push(`cash secured ${formatUsd(trade.collateralReservedUsd)}`);
  }
  if (trade.premiumUsd > 0) {
    details.push(
      `premium ${formatUsd(trade.premiumUsd)}` +
        (trade.premiumPerShare != null
          ? ` (${formatUsd(trade.premiumPerShare, 2)}/sh × 100)`
          : ""),
    );
  }
  if (trade.feesUsd > 0) details.push(`fees ${formatUsd(trade.feesUsd)}`);
  if (trade.dteDays != null) details.push(`${trade.dteDays} DTE`);
  if (trade.expirationDate) {
    details.push(`expires ${formatIsoDate(trade.expirationDate)}`);
  }
  if (trade.cashFlowUsd != null && trade.cashFlowUsd !== 0) {
    details.push(`cash flow ${formatSignedUsd(trade.cashFlowUsd)}`);
  } else if (trade.cashFlowUsd === 0) {
    details.push("cash flow $0");
  }
  if (trade.effectiveEntryPrice != null) {
    details.push(`effective buy ~${formatUsd(trade.effectiveEntryPrice, 2)}/sh`);
  }
  if (trade.effectiveExitPrice != null) {
    details.push(`sold/call @ ${formatUsd(trade.effectiveExitPrice, 2)}/sh`);
  }
  if (trade.note) details.push(trade.note);

  if (details.length > 0) {
    lines.push(`    ${details.join(" · ")}`);
  }

  return lines;
}

export function buildWheelBacktestReport(
  result: WheelBacktestResult,
  run: WheelBacktestRunParams,
): string {
  const exportedAt = new Date();
  const totalDeposited =
    result.startingCashUsd + (result.capitalTopUpsUsd ?? 0);
  const lines: string[] = [
    "WHEEL BACKTEST REPORT",
    RULE,
    "",
    row("Exported", exportedAt.toLocaleString()),
    row("Symbol", result.symbol),
    row("Horizon", `${result.lookbackYears} years`),
    row(
      "Delta band",
      `${run.targetDeltaMin.toFixed(2)} – ${run.targetDeltaMax.toFixed(2)}`,
    ),
    row("DTE (trading days)", String(run.dteDays)),
    row(
      "Add cash if CSP needs more",
      run.maintainOneLot ? "Yes" : "No",
    ),
    row(
      "History window",
      `${formatIsoDate(result.historyStartDate ?? result.startDate)} → ${formatIsoDate(result.endDate)} (${result.tradingDays} bars)`,
    ),
    row(
      "Trades window",
      `${formatIsoDate(result.startDate)} → ${formatIsoDate(result.endDate)}`,
    ),
  ];

  if (result.firstTradeDate) {
    lines.push(row("First trade", formatIsoDate(result.firstTradeDate)));
  }
  if (result.lastTradeDate) {
    lines.push(row("Last trade", formatIsoDate(result.lastTradeDate)));
  }

  lines.push(...section("CAPITAL (1 contract = 100 shares)"));
  lines.push(
    row("Stock at first CSP", `${formatUsd(result.spotPriceAtStart, 2)}/sh`),
    row(
      "Initial cash secured",
      `${formatUsd(result.initialCollateralUsd)} (strike ${formatUsd(result.initialPutStrikeUsd, 2)} × 100)`,
    ),
    row("Starting wallet", formatUsd(result.startingCashUsd)),
  );
  if ((result.capitalTopUpsUsd ?? 0) > 0) {
    lines.push(
      row("Extra cash added later", formatUsd(result.capitalTopUpsUsd)),
      row("All money you put in", formatUsd(totalDeposited)),
    );
  }
  lines.push(
    row("Ending equity", formatUsd(result.endingEquityUsd)),
    row(
      `Total P/L (${formatIsoDate(result.startDate)} – ${formatIsoDate(result.endDate)})`,
      `${formatSignedUsd(result.totalPlUsd)} (${formatPct(result.totalReturnPct)})`,
    ),
  );
  if (result.cagrPct != null) {
    const cagrNote =
      (result.capitalTopUpsUsd ?? 0) > 0 ? " on all money put in" : "";
    lines.push(row("CAGR", `${formatPct(result.cagrPct, 1)}${cagrNote}`));
  }

  lines.push(...section("UNDERLYING & BENCHMARK"));
  lines.push(
    row(
      "Stock price",
      `${formatUsd(result.spotPriceAtStart, 2)}/sh → ${formatUsd(result.spotPriceAtEnd, 2)}/sh`,
    ),
    row(
      "Buy & hold (same starting cash)",
      `${formatUsd(result.buyAndHoldEndingUsd)} ending (${formatPct(result.buyAndHoldReturnPct)})`,
    ),
  );
  if (result.buyAndHoldCagrPct != null) {
    lines.push(row("Buy & hold CAGR", formatPct(result.buyAndHoldCagrPct, 1)));
  }

  lines.push(...section("WHEEL ACTIVITY"));
  lines.push(
    row("CSP rounds", String(result.cspRounds ?? 0)),
    row(
      "Full wheels (assign → called away)",
      String(result.completedWheelCycles),
    ),
    row("Put assignments", String(result.putAssignments)),
    row("Puts expired OTM", String(result.putsExpiredOtm)),
    row("Calls assigned", String(result.callsAssigned)),
    row("Calls expired OTM", String(result.callsExpiredOtm)),
    row("Premium collected", formatUsd(result.totalPremiumCollectedUsd)),
    row("Fees", formatUsd(result.totalFeesUsd)),
    row("Dividends (while long stock)", formatUsd(result.totalDividendsUsd)),
  );
  if (result.skippedTradesInsufficientCash > 0) {
    lines.push(
      row(
        "Blocked periods (could not fund CSP)",
        String(result.skippedTradesInsufficientCash),
      ),
    );
  }

  if (result.annualSummary.length > 0) {
    lines.push(...section("YEAR BY YEAR"));
    lines.push(
      "  Year      Start equity    End equity      P/L $           P/L %       Premium",
    );
    for (const yearRow of result.annualSummary) {
      const pl = yearRow.plUsd ?? yearRow.endEquityUsd - yearRow.startEquityUsd;
      lines.push(
        `  ${String(yearRow.year).padEnd(6)}` +
          `${formatUsd(yearRow.startEquityUsd).padStart(14)}` +
          `${formatUsd(yearRow.endEquityUsd).padStart(14)}` +
          `${formatSignedUsd(pl).padStart(14)}` +
          `${formatPct(yearRow.returnPct, 2).padStart(12)}` +
          `${formatUsd(yearRow.premiumUsd).padStart(12)}`,
      );
    }
  }

  if (result.wheelCycles.length > 0) {
    lines.push(...section("STOCK ENTRY & EXIT (ASSIGNED CYCLES)"));
    for (const cycle of result.wheelCycles) {
      const entry = cycle.stockEntryDate
        ? formatIsoDate(cycle.stockEntryDate)
        : "—";
      const exit =
        cycle.completed && cycle.stockExitDate
          ? formatIsoDate(cycle.stockExitDate)
          : "Open / incomplete";
      const pl =
        cycle.stockRoundTripPlUsd != null
          ? formatSignedUsd(cycle.stockRoundTripPlUsd)
          : "—";
      lines.push(`  Cycle ${cycle.cycle}`);
      lines.push(
        `    Entry ${entry}` +
          (cycle.effectiveEntryPrice != null
            ? ` (eff. ${formatUsd(cycle.effectiveEntryPrice, 2)}/sh)`
            : "") +
          (cycle.stockEntryClose != null
            ? ` · market ${formatUsd(cycle.stockEntryClose, 2)}`
            : ""),
      );
      lines.push(
        `    Exit  ${exit}` +
          (cycle.effectiveExitPrice != null
            ? ` (call ${formatUsd(cycle.effectiveExitPrice, 2)})`
            : "") +
          (cycle.stockExitClose != null
            ? ` · market ${formatUsd(cycle.stockExitClose, 2)}`
            : ""),
      );
      lines.push(`    Stock P/L on 100 shares: ${pl}`);
      lines.push("");
    }
  }

  const { cycles, other } = groupTradesByCycle(result.trades);
  if (result.trades.length > 0) {
    lines.push(...section(`TRADE LOG (${result.trades.length} events)`));
    lines.push(
      "  Each ~month cycle: sell CSP → expire or assign → sell covered call (if assigned).",
    );

    if (other.length > 0) {
      lines.push("", "  Capital / other", "");
      for (const trade of other) {
        lines.push(...formatTradeLine(trade));
        lines.push("");
      }
    }

    for (const group of cycles) {
      const start = group.trades[0]?.date ?? "";
      const end = group.trades[group.trades.length - 1]?.date ?? start;
      lines.push(
        "",
        `  Cycle ${group.id} (${formatIsoDate(start)} → ${formatIsoDate(end)})`,
        "",
      );
      for (const trade of group.trades) {
        lines.push(...formatTradeLine(trade));
        lines.push("");
      }
    }
  }

  if (result.equityCurve.length > 0) {
    lines.push(...section(`DAILY EQUITY (${result.equityCurve.length} days)`));
    lines.push(
      "  Date          Equity        Cash          Sh    Phase",
    );
    for (const point of result.equityCurve) {
      lines.push(
        `  ${formatIsoDate(point.date).padEnd(14)}` +
          `${formatUsd(point.equityUsd).padStart(12)}` +
          `${formatUsd(point.cashUsd).padStart(12)}` +
          `${String(point.shares).padStart(5)}` +
          `  ${point.phase}`,
      );
    }
  }

  if (result.assumptions.length > 0) {
    lines.push(...section("MODEL ASSUMPTIONS"));
    for (const item of result.assumptions) {
      lines.push(`  • ${item}`);
    }
  }

  lines.push("", RULE, "End of report", "");
  return lines.join("\n");
}

export function wheelBacktestDownloadFilename(result: WheelBacktestResult): string {
  const safeSymbol = result.symbol.replace(/[^A-Za-z0-9.-]/g, "");
  return `wheel-backtest-${safeSymbol}-${result.lookbackYears}y-${result.endDate}.txt`;
}

export function downloadWheelBacktestResult(
  result: WheelBacktestResult,
  run: WheelBacktestRunParams,
): void {
  const text = buildWheelBacktestReport(result, run);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = wheelBacktestDownloadFilename(result);
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
