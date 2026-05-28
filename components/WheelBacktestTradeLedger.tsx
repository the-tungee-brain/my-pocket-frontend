"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WheelBacktestTrade } from "@/app/types/wheelBacktest";
import { cn } from "@/lib/utils";

function formatUsd(value: number, fraction = 0) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(value);
}

function formatSignedUsd(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${formatUsd(Math.abs(value))}`;
}

function cashFlowTone(value: number | null | undefined) {
  if (value == null || value === 0) return "text-muted";
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  return "text-red-600 dark:text-red-400";
}

type CycleGroup = {
  key: string;
  title: string;
  trades: WheelBacktestTrade[];
};

function buildCycleGroups(trades: WheelBacktestTrade[]): {
  cycles: CycleGroup[];
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

  const cycles: CycleGroup[] = [...byCycle.entries()]
    .sort(([a], [b]) => a - b)
    .map(([cycleId, cycleTrades]) => {
      const sorted = [...cycleTrades].sort((a, b) => a.date.localeCompare(b.date));
      const start = sorted[0]?.date ?? "";
      const end = sorted[sorted.length - 1]?.date ?? start;
      const month = sorted[0]?.cycleMonth ?? start.slice(0, 7);
      const dte = sorted.find((t) => t.dteDays)?.dteDays;
      const hasStock =
        sorted.some((t) => t.action === "put_assigned") &&
        sorted.some((t) => t.action === "call_assigned" || t.action === "call_expired");
      const kind = hasStock ? "full wheel" : "CSP only (expired OTM)";
      return {
        key: String(cycleId),
        title: `Cycle ${cycleId} · ${month} · ~${dte ?? 30} DTE · ${start} → ${end} · ${kind}`,
        trades: sorted,
      };
    });

  return { cycles, other };
}

type Props = {
  trades: WheelBacktestTrade[];
  defaultExpanded?: boolean;
};

export function WheelBacktestTradeLedger({
  trades,
  defaultExpanded = true,
}: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showAll, setShowAll] = useState(false);

  const grouped = useMemo(() => buildCycleGroups(trades), [trades]);
  const visibleCycles = showAll ? grouped.cycles : grouped.cycles.slice(0, 6);
  const hiddenCount = grouped.cycles.length - visibleCycles.length;

  if (trades.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border/60">
      <button
        type="button"
        onClick={() => setExpanded((open) => !open)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
          Trade log — one ~month cycle per group ({grouped.cycles.length} cycles)
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted transition-transform",
            expanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border/60 px-3 pb-3 pt-2">
          <p className="text-[10px] leading-relaxed text-muted">
            Each group is one option round (~30 trading days): sell put → expire or
            assign → sell call (if assigned) → expire or called away. Cash secured
            on the put row is strike × 100 (collateral held until expiry/assignment).
          </p>

          {grouped.other.length > 0 && (
            <TradeTable title="Capital / other" trades={grouped.other} />
          )}

          {visibleCycles.map((group) => (
            <TradeTable key={group.key} title={group.title} trades={group.trades} />
          ))}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs font-medium text-accent-strong hover:underline"
            >
              Show {hiddenCount} more cycles
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TradeTable({ title, trades }: { title: string; trades: WheelBacktestTrade[] }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-foreground">{title}</p>
      <div className="overflow-x-auto rounded-md border border-border/50">
        <table className="w-full min-w-[700px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/30 text-muted">
              <th className="px-2 py-1.5 font-medium">Date</th>
              <th className="px-2 py-1.5 font-medium">Step</th>
              <th className="px-2 py-1.5 font-medium text-right">Strike</th>
              <th className="px-2 py-1.5 font-medium text-right">Stock</th>
              <th className="px-2 py-1.5 font-medium text-right">Cash secured</th>
              <th className="px-2 py-1.5 font-medium text-right">Premium</th>
              <th className="px-2 py-1.5 font-medium text-right">DTE</th>
              <th className="px-2 py-1.5 font-medium">Expires</th>
              <th className="px-2 py-1.5 font-medium text-right">Cash flow</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade, index) => (
              <tr
                key={`${trade.date}-${trade.action}-${index}`}
                className="border-b border-border/40 text-foreground"
              >
                <td className="whitespace-nowrap px-2 py-1.5 text-muted">
                  {trade.date}
                </td>
                <td className="max-w-[12rem] px-2 py-1.5">
                  <span className="font-medium">{trade.label ?? trade.action}</span>
                  {trade.premiumPerShare != null && trade.premiumUsd > 0 && (
                    <span className="mt-0.5 block text-[10px] text-muted">
                      ${trade.premiumPerShare.toFixed(2)}/sh × 100
                    </span>
                  )}
                  {trade.effectiveEntryPrice != null && (
                    <span className="mt-0.5 block text-[10px] text-muted">
                      Buy effective ~${trade.effectiveEntryPrice.toFixed(2)}/sh
                    </span>
                  )}
                  {trade.effectiveExitPrice != null && (
                    <span className="mt-0.5 block text-[10px] text-muted">
                      Sell/call @ ${trade.effectiveExitPrice.toFixed(2)}/sh
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {trade.strike != null ? `$${trade.strike.toFixed(2)}` : "—"}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted">
                  {trade.stockPrice != null
                    ? `$${trade.stockPrice.toFixed(2)}`
                    : `$${trade.close.toFixed(2)}`}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-amber-700 dark:text-amber-400">
                  {trade.collateralReservedUsd != null && trade.collateralReservedUsd > 0
                    ? formatUsd(trade.collateralReservedUsd)
                    : "—"}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {trade.premiumUsd > 0 ? formatUsd(trade.premiumUsd) : "—"}
                  {trade.feesUsd > 0 && (
                    <span className="block text-[10px] text-muted">
                      fee {formatUsd(trade.feesUsd)}
                    </span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-muted">
                  {trade.dteDays ?? "—"}
                </td>
                <td className="whitespace-nowrap px-2 py-1.5 text-muted">
                  {trade.expirationDate ?? "—"}
                </td>
                <td
                  className={cn(
                    "px-2 py-1.5 text-right font-medium tabular-nums",
                    cashFlowTone(trade.cashFlowUsd),
                  )}
                >
                  {trade.cashFlowUsd != null
                    ? formatSignedUsd(trade.cashFlowUsd)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
