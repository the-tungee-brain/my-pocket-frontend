"use client";

import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Position } from "@/app/types/schwab";
import type { PositionMap } from "@/components/AccountPositionList";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import type { SymbolAlertSummary } from "@/lib/intelligence";
import { SEVERITY_ORDER } from "@/lib/intelligence";
import {
  isCashSecuredPut,
  isHighlightedOptionStrategy,
  optionStrategyLabel,
} from "@/lib/optionStrategyLabel";
import {
  openProfitLossPct,
  positionOpenProfitLoss,
  positionOpenProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
  sumPortfolioWeight,
} from "@/lib/positionMetrics";
import { symbolHubPath } from "@/lib/symbolRoutes";
import { cn } from "@/lib/utils";

export type SymbolSummary = {
  symbol: string;
  positions: Position[];
  totalValue: number;
  dayPL: number;
  openPL: number | null;
  costBasis: number | null;
  weightPct: number | null;
};

export type SortKey = "weight" | "value" | "openPL" | "dayPL" | "alerts";

export const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "weight", label: "Weight" },
  { id: "value", label: "Value" },
  { id: "openPL", label: "Open P/L" },
  { id: "dayPL", label: "Today" },
  { id: "alerts", label: "Alerts" },
];

const METRIC_TH_CLASS =
  "w-[18%] min-w-[5.5rem] whitespace-nowrap px-4 py-2.5 text-right";
const METRIC_TD_CLASS =
  "w-[18%] min-w-[5.5rem] whitespace-nowrap px-4 py-3 text-right tabular-nums";
const HOLDINGS_METRIC_TH_CLASS =
  "w-[18%] min-w-[5.5rem] whitespace-nowrap py-2.5 text-right";
const HOLDINGS_METRIC_TD_CLASS =
  "w-[18%] min-w-[5.5rem] whitespace-nowrap py-3 text-right tabular-nums";

function concentrationLabel(weightPct: number | null) {
  if (weightPct == null) return null;
  if (weightPct >= 30) return "High concentration";
  if (weightPct >= 20) return "Elevated concentration";
  return null;
}

function PositionTypeChip({
  position,
  siblingPositions,
}: {
  position: Position;
  siblingPositions: Position[];
}) {
  const chipLabel = optionStrategyLabel(position, siblingPositions);
  if (!chipLabel) return null;

  const highlighted = isHighlightedOptionStrategy(position, siblingPositions);
  const isCsp = isCashSecuredPut(position);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium",
        highlighted
          ? "bg-accent/15 text-accent-strong"
          : "bg-muted-bg text-muted",
      )}
    >
      {isCsp && <LockKeyhole className="h-3 w-3 shrink-0" aria-hidden />}
      {chipLabel}
    </span>
  );
}

function positionKey(p: Position) {
  return `${p.instrument.symbol}-${p.instrument.cusip}-${p.longQuantity}-${p.shortQuantity}`;
}

function positionLabel(p: Position) {
  return p.instrument.description ?? p.instrument.assetType ?? "Position";
}

export function buildSymbolSummaries(
  positionMap: PositionMap,
  liquidationValue?: number | null,
): SymbolSummary[] {
  return Object.entries(positionMap).map(([sym, rows]) => {
    const totalValue = rows.reduce((sum, p) => sum + p.marketValue, 0);
    const openPL = sumOpenProfitLoss(rows);
    const costBasis = sumCostBasis(rows);

    return {
      symbol: sym,
      positions: rows,
      totalValue,
      dayPL: rows.reduce((sum, p) => sum + p.currentDayProfitLoss, 0),
      openPL,
      costBasis,
      weightPct: sumPortfolioWeight(rows, liquidationValue),
    };
  });
}

function compareByAlerts(
  a: SymbolSummary,
  b: SymbolSummary,
  symbolAlertMap: Record<string, SymbolAlertSummary>,
) {
  const alertA = symbolAlertMap[a.symbol];
  const alertB = symbolAlertMap[b.symbol];
  if (alertA && !alertB) return -1;
  if (!alertA && alertB) return 1;
  if (alertA && alertB) {
    const severityDiff =
      SEVERITY_ORDER[alertA.topSeverity] - SEVERITY_ORDER[alertB.topSeverity];
    if (severityDiff !== 0) return severityDiff;
    return alertB.count - alertA.count;
  }
  return b.totalValue - a.totalValue;
}

export function sortSummaries(
  summaries: SymbolSummary[],
  sortKey: SortKey,
  symbolAlertMap: Record<string, SymbolAlertSummary>,
) {
  return [...summaries].sort((a, b) => {
    switch (sortKey) {
      case "weight":
        return (b.weightPct ?? 0) - (a.weightPct ?? 0);
      case "value":
        return b.totalValue - a.totalValue;
      case "openPL":
        return (
          (b.openPL ?? Number.NEGATIVE_INFINITY) -
          (a.openPL ?? Number.NEGATIVE_INFINITY)
        );
      case "dayPL":
        return b.dayPL - a.dayPL;
      case "alerts":
        return compareByAlerts(a, b, symbolAlertMap);
      default:
        return 0;
    }
  });
}

export function PortfolioHoldingsTable({
  summaries,
  symbolAlertMap,
}: {
  summaries: SymbolSummary[];
  symbolAlertMap: Record<string, SymbolAlertSummary>;
}) {
  const router = useRouter();

  return (
    <>
      <div className="hidden overflow-x-auto scrollbar-dark md:block">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[16%]" />
            <col className="w-[10%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[16%]" />
          </colgroup>
          <thead className="border-b border-border/60 text-[11px] font-medium uppercase tracking-wide text-muted">
            <tr>
              <th className="py-2.5 text-left">Symbol</th>
              <th className="py-2.5 text-left">Allocation</th>
              <th className="whitespace-nowrap py-2.5 text-right">Weight</th>
              <th className={HOLDINGS_METRIC_TH_CLASS}>Value</th>
              <th className={HOLDINGS_METRIC_TH_CLASS}>Today P/L</th>
              <th className={HOLDINGS_METRIC_TH_CLASS}>Open P/L</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map(
              ({ symbol, totalValue, dayPL, openPL, costBasis, weightPct }) => {
                const openPLPctVal = openProfitLossPct(openPL, costBasis);
                const concentration = concentrationLabel(weightPct);

                return (
                  // biome-ignore lint/a11y/useSemanticElements: preserving table row layout while making the full holding row navigable.
                  <tr
                    key={symbol}
                    role="link"
                    tabIndex={0}
                    onClick={() =>
                      router.push(symbolHubPath(symbol, "overview"))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(symbolHubPath(symbol, "overview"));
                      }
                    }}
                    className="cursor-pointer border-t border-border/60 transition-colors hover:bg-muted-bg/30"
                  >
                    <td className="py-3 text-left">
                      <div className="min-w-0">
                        <span className="font-mono font-medium text-foreground">
                          {symbol}
                        </span>
                        {(concentration || symbolAlertMap[symbol]) && (
                          <p
                            className={cn(
                              "mt-0.5 text-[11px]",
                              concentration ? "text-warning" : "text-muted",
                            )}
                          >
                            {concentration ??
                              `${symbolAlertMap[symbol].count} portfolio alert${
                                symbolAlertMap[symbol].count === 1 ? "" : "s"
                              }`}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="h-2 bg-border/50" aria-hidden="true">
                        <div
                          className="h-full bg-foreground"
                          style={{
                            width:
                              weightPct != null
                                ? `${Math.max(
                                    0,
                                    Math.min(100, weightPct),
                                  )}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 text-right tabular-nums text-muted">
                      {weightPct != null ? `${weightPct.toFixed(1)}%` : "—"}
                    </td>
                    <td className={HOLDINGS_METRIC_TD_CLASS}>
                      {formatUsd(totalValue)}
                    </td>
                    <td
                      className={cn(
                        HOLDINGS_METRIC_TD_CLASS,
                        dayPL >= 0 ? "text-success" : "text-danger",
                      )}
                    >
                      {formatSignedUsd(dayPL)}
                    </td>
                    <td
                      className={cn(
                        HOLDINGS_METRIC_TD_CLASS,
                        openPL == null
                          ? "text-muted"
                          : openPL >= 0
                            ? "text-success"
                            : "text-danger",
                      )}
                    >
                      {openPL != null ? (
                        <>
                          {formatSignedUsd(openPL)}
                          {openPLPctVal != null && (
                            <span className="block text-[11px] opacity-80">
                              ({openPLPctVal >= 0 ? "+" : ""}
                              {openPLPctVal.toFixed(1)}%)
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                );
              },
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-border/60 md:hidden">
        {summaries.map(({ symbol, totalValue, dayPL, openPL, weightPct }) => {
          const concentration = concentrationLabel(weightPct);

          return (
            <Link
              key={symbol}
              href={symbolHubPath(symbol, "overview")}
              className="flex items-center justify-between gap-3 py-3 transition hover:bg-muted-bg/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-medium text-foreground">
                    {symbol}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {weightPct != null ? `${weightPct.toFixed(1)}% · ` : ""}
                  {formatUsd(totalValue)}
                </p>
                <div
                  className="mt-2 h-1.5 w-36 max-w-full bg-border/50"
                  aria-hidden="true"
                >
                  <div
                    className="h-full bg-foreground"
                    style={{
                      width:
                        weightPct != null
                          ? `${Math.max(0, Math.min(100, weightPct))}%`
                          : "0%",
                    }}
                  />
                </div>
                {(concentration || symbolAlertMap[symbol]) && (
                  <p
                    className={cn(
                      "mt-0.5 text-[11px]",
                      concentration ? "text-warning" : "text-muted",
                    )}
                  >
                    {concentration ??
                      `${symbolAlertMap[symbol].count} portfolio alert${
                        symbolAlertMap[symbol].count === 1 ? "" : "s"
                      }`}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-xs tabular-nums font-medium",
                    dayPL >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  {formatSignedUsd(dayPL)}
                </p>
                {openPL != null && (
                  <p
                    className={cn(
                      "text-[11px] tabular-nums",
                      openPL >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    {formatSignedUsd(openPL)}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}

export function SymbolLegsTable({ positions }: { positions: Position[] }) {
  const sorted = [...positions].sort(
    (a, b) =>
      b.longQuantity - b.shortQuantity - (a.longQuantity - a.shortQuantity),
  );

  if (sorted.length === 1) {
    const p = sorted[0];
    const qty = p.longQuantity - p.shortQuantity;
    const openPL = positionOpenProfitLoss(p);
    const openPLPctVal = positionOpenProfitLossPct(p);

    return (
      <div className="px-4 py-3 text-sm">
        <p className="font-medium text-foreground">{positionLabel(p)}</p>
        <div className="mt-1">
          <PositionTypeChip position={p} siblingPositions={sorted} />
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
          <div className="min-w-0">
            <p className="text-muted">Qty</p>
            <p className="mt-0.5 tabular-nums font-medium">
              {qty.toLocaleString()}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted">Value</p>
            <p className="mt-0.5 tabular-nums font-medium">
              {formatUsd(p.marketValue)}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted">Open P/L</p>
            <p
              className={cn(
                "mt-0.5 tabular-nums font-medium",
                openPL == null
                  ? "text-muted"
                  : openPL >= 0
                    ? "text-success"
                    : "text-danger",
              )}
            >
              {openPL != null ? formatSignedUsd(openPL) : "—"}
              {openPLPctVal != null && ` (${openPLPctVal.toFixed(1)}%)`}
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted">Today</p>
            <p
              className={cn(
                "mt-0.5 tabular-nums font-medium",
                p.currentDayProfitLoss >= 0 ? "text-success" : "text-danger",
              )}
            >
              {formatSignedUsd(p.currentDayProfitLoss)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <div className="overflow-x-auto scrollbar-dark">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="sticky top-0 z-10 border-b border-border bg-surface-elevated/95 text-[11px] font-medium uppercase tracking-wide text-muted backdrop-blur-sm">
              <tr>
                <th className="px-4 py-2.5 text-left">Leg</th>
                <th className="whitespace-nowrap px-4 py-2.5 text-right">
                  Qty
                </th>
                <th className={METRIC_TH_CLASS}>Value</th>
                <th className={METRIC_TH_CLASS}>Open P/L</th>
                <th className={METRIC_TH_CLASS}>Today</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => {
                const qty = p.longQuantity - p.shortQuantity;
                const openPL = positionOpenProfitLoss(p);

                return (
                  <tr
                    key={positionKey(p)}
                    className="border-t border-border transition-colors hover:bg-muted-bg/30"
                  >
                    <td className="px-4 py-3 text-left">
                      <p className="text-sm text-foreground">
                        {positionLabel(p)}
                      </p>
                      <PositionTypeChip
                        position={p}
                        siblingPositions={sorted}
                      />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums">
                      {qty.toLocaleString()}
                    </td>
                    <td className={METRIC_TD_CLASS}>
                      {formatUsd(p.marketValue)}
                    </td>
                    <td
                      className={cn(
                        METRIC_TD_CLASS,
                        openPL == null
                          ? "text-muted"
                          : openPL >= 0
                            ? "text-success"
                            : "text-danger",
                      )}
                    >
                      {openPL != null ? formatSignedUsd(openPL) : "—"}
                    </td>
                    <td
                      className={cn(
                        METRIC_TD_CLASS,
                        p.currentDayProfitLoss >= 0
                          ? "text-success"
                          : "text-danger",
                      )}
                    >
                      {formatSignedUsd(p.currentDayProfitLoss)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="divide-y divide-border md:hidden">
        {sorted.map((p) => {
          const qty = p.longQuantity - p.shortQuantity;
          const openPL = positionOpenProfitLoss(p);

          return (
            <div key={positionKey(p)} className="px-4 py-3">
              <p className="text-sm font-medium text-foreground">
                {positionLabel(p)}
              </p>
              <div className="mt-1">
                <PositionTypeChip position={p} siblingPositions={sorted} />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                <div className="min-w-0">
                  <p className="text-muted">Qty</p>
                  <p className="tabular-nums font-medium">
                    {qty.toLocaleString()}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted">Value</p>
                  <p className="tabular-nums font-medium">
                    {formatUsd(p.marketValue)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted">Open P/L</p>
                  <p
                    className={cn(
                      "tabular-nums font-medium",
                      openPL == null
                        ? "text-muted"
                        : openPL >= 0
                          ? "text-success"
                          : "text-danger",
                    )}
                  >
                    {openPL != null ? formatSignedUsd(openPL) : "—"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-muted">Today</p>
                  <p
                    className={cn(
                      "tabular-nums font-medium",
                      p.currentDayProfitLoss >= 0
                        ? "text-success"
                        : "text-danger",
                    )}
                  >
                    {formatSignedUsd(p.currentDayProfitLoss)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
