"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BriefcaseBusiness, ChevronDown, Filter } from "lucide-react";
import type { PositionMap } from "@/components/AccountPositionList";
import { Position } from "@/app/types/schwab";
import { useSchwabStatus } from "@/app/hooks/useSchwabStatus";
import { useSchwabConnect } from "@/app/hooks/useSchwabConnect";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { AlertBadge } from "@/components/AlertBadge";
import { formatSignedUsd, formatUsd } from "@/lib/formatCurrency";
import type { SymbolAlertSummary } from "@/lib/intelligence";
import { SEVERITY_ORDER } from "@/lib/intelligence";
import {
  openProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
  sumPortfolioWeight,
} from "@/lib/positionMetrics";
import { cn } from "@/lib/utils";
import { symbolHubPath } from "@/lib/symbolRoutes";

type Props = {
  loading: boolean;
  allPositions: Position[];
  positionMap: PositionMap;
  liquidationValue?: number | null;
  symbolAlertMap?: Record<string, SymbolAlertSummary>;
  className?: string;
};

type SymbolSummary = {
  symbol: string;
  positions: Position[];
  totalValue: number;
  dayPL: number;
  openPL: number | null;
  costBasis: number | null;
  weightPct: number | null;
};

type SortKey = "weight" | "value" | "openPL" | "dayPL" | "alerts";

const SORT_OPTIONS: { id: SortKey; label: string }[] = [
  { id: "weight", label: "Weight" },
  { id: "value", label: "Value" },
  { id: "openPL", label: "Open P/L" },
  { id: "dayPL", label: "Today" },
  { id: "alerts", label: "Alerts" },
];

function buildSymbolSummaries(
  positionMap: PositionMap,
  liquidationValue?: number | null,
): SymbolSummary[] {
  return Object.entries(positionMap).map(([symbol, positions]) => {
    const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
    const openPL = sumOpenProfitLoss(positions);
    const costBasis = sumCostBasis(positions);

    return {
      symbol,
      positions,
      totalValue,
      dayPL: positions.reduce((sum, p) => sum + p.currentDayProfitLoss, 0),
      openPL,
      costBasis,
      weightPct: sumPortfolioWeight(positions, liquidationValue),
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

function sortSummaries(
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
        return (b.openPL ?? Number.NEGATIVE_INFINITY) -
          (a.openPL ?? Number.NEGATIVE_INFINITY);
      case "dayPL":
        return b.dayPL - a.dayPL;
      case "alerts":
        return compareByAlerts(a, b, symbolAlertMap);
      default:
        return 0;
    }
  });
}

export function PortfolioOverview({
  loading,
  allPositions,
  positionMap,
  liquidationValue,
  symbolAlertMap = {},
  className,
}: Props) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("weight");
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);

  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();
  const {
    connect: connectSchwab,
    connecting: schwabConnecting,
    connectError: schwabConnectError,
    clearConnectError: clearSchwabConnectError,
  } = useSchwabConnect();

  const alertSymbolCount = useMemo(
    () =>
      Object.keys(symbolAlertMap).filter((symbol) => positionMap[symbol])
        .length,
    [positionMap, symbolAlertMap],
  );

  const symbolSummaries = useMemo(() => {
    const base = buildSymbolSummaries(positionMap, liquidationValue);
    const filtered = alertsOnly
      ? base.filter((row) => symbolAlertMap[row.symbol])
      : base;
    return sortSummaries(filtered, sortKey, symbolAlertMap);
  }, [
    alertsOnly,
    liquidationValue,
    positionMap,
    sortKey,
    symbolAlertMap,
  ]);

  const handleConnectSchwab = () => {
    clearSchwabConnectError();
    void connectSchwab();
  };

  if (loading) {
    return (
      <section className={cn("mx-auto w-full max-w-3xl", className)}>
        <div className="mb-3 h-5 w-24 animate-pulse rounded bg-muted-bg" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted-bg" />
      </section>
    );
  }

  if (!allPositions.length) {
    return (
      <section className={cn("mx-auto w-full max-w-3xl", className)}>
        <EmptyState
          icon={BriefcaseBusiness}
          title="No holdings yet"
          description={
            schwabAuthorized === false
              ? "Connect Schwab to import positions and unlock portfolio insights."
              : "Your Schwab account is connected, but no positions were returned. Holdings will appear here once available."
          }
          action={
            schwabAuthorized === false && !schwabLoading ? (
              <div className="space-y-2">
                {schwabConnectError && (
                  <p className="text-xs text-danger">{schwabConnectError}</p>
                )}
                <Button
                  size="sm"
                  disabled={schwabConnecting}
                  onClick={handleConnectSchwab}
                >
                  {schwabConnecting ? "Connecting…" : "Connect Schwab"}
                </Button>
              </div>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <section className={cn("mx-auto w-full max-w-3xl", className)}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-foreground">Holdings</h2>
        <div className="flex flex-wrap items-center gap-2">
          {alertSymbolCount > 0 && (
            <button
              type="button"
              onClick={() => setAlertsOnly((on) => !on)}
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition",
                alertsOnly
                  ? "border-accent/40 bg-accent-muted text-accent-strong"
                  : "border-border bg-background text-muted hover:text-foreground",
              )}
            >
              <Filter className="h-3 w-3" aria-hidden />
              Alerts ({alertSymbolCount})
            </button>
          )}
          <div className="flex flex-wrap gap-1 rounded-lg bg-muted-bg/50 p-0.5">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSortKey(option.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-[11px] font-medium transition",
                  sortKey === option.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {alertsOnly && symbolSummaries.length === 0 && (
        <p className="mb-3 text-xs text-muted">No holdings match the alert filter.</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-secondary shadow-sm">
        <div className="hidden sm:block">
          <table className="w-full table-fixed text-sm">
            <thead className="border-b border-border bg-surface-elevated/60 text-[11px] font-medium uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-2.5 text-left">Symbol</th>
                <th className="px-4 py-2.5 text-right">Weight</th>
                <th className="px-4 py-2.5 text-right">Value</th>
                <th className="px-4 py-2.5 text-right">Cost</th>
                <th className="px-4 py-2.5 text-right">Open P/L</th>
                <th className="px-4 py-2.5 text-right">Today P/L</th>
              </tr>
            </thead>
            <tbody>
              {symbolSummaries.map(
                ({
                  symbol,
                  positions,
                  totalValue,
                  dayPL,
                  openPL,
                  costBasis,
                  weightPct,
                }) => {
                  const openPLPct = openProfitLossPct(openPL, costBasis);

                  return (
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
                      className="cursor-pointer border-t border-border transition-colors hover:bg-muted-bg/40"
                    >
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-medium text-foreground">
                            {symbol}
                          </span>
                          {symbolAlertMap[symbol] && (
                            <AlertBadge
                              summary={symbolAlertMap[symbol]}
                              compact
                            />
                          )}
                          <Link
                            href={symbolHubPath(symbol, "position")}
                            onClick={(event) => event.stopPropagation()}
                            className="text-[10px] font-medium text-muted hover:text-accent-strong"
                          >
                            Position
                          </Link>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted">
                          {positions.length}{" "}
                          {positions.length === 1 ? "position" : "positions"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {weightPct != null ? `${weightPct.toFixed(1)}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        ${totalValue.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted">
                        {costBasis != null
                          ? `$${costBasis.toLocaleString()}`
                          : "—"}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums",
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
                            {openPLPct != null && (
                              <span className="block text-[11px] opacity-80">
                                ({openPLPct >= 0 ? "+" : ""}
                                {openPLPct.toFixed(1)}%)
                              </span>
                            )}
                          </>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right tabular-nums",
                          dayPL >= 0 ? "text-success" : "text-danger",
                        )}
                      >
                        {formatSignedUsd(dayPL)}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-border sm:hidden">
          {symbolSummaries.map(
            ({
              symbol,
              positions,
              totalValue,
              dayPL,
              openPL,
              costBasis,
              weightPct,
            }) => {
              const openPLPct = openProfitLossPct(openPL, costBasis);
              const expanded = expandedMobile === symbol;

              return (
                <div key={symbol} className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedMobile((current) =>
                        current === symbol ? null : symbol,
                      )
                    }
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-medium text-foreground">
                          {symbol}
                        </span>
                        {symbolAlertMap[symbol] && (
                          <AlertBadge
                            summary={symbolAlertMap[symbol]}
                            compact
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {weightPct != null ? `${weightPct.toFixed(1)}% · ` : ""}
                        ${totalValue.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p
                        className={cn(
                          "text-xs tabular-nums font-medium",
                          dayPL >= 0 ? "text-success" : "text-danger",
                        )}
                      >
                        {formatSignedUsd(dayPL)}
                      </p>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted transition-transform",
                          expanded && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </div>
                  </button>

                  {expanded && (
                    <div className="mt-3 space-y-2 border-t border-border/70 pt-3 text-xs">
                      <div className="flex justify-between gap-3">
                        <span className="text-muted">Positions</span>
                        <span>{positions.length}</span>
                      </div>
                      {costBasis != null && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted">Cost</span>
                          <span className="tabular-nums">{formatUsd(costBasis)}</span>
                        </div>
                      )}
                      {openPL != null && (
                        <div className="flex justify-between gap-3">
                          <span className="text-muted">Open P/L</span>
                          <span
                            className={cn(
                              "tabular-nums",
                              openPL >= 0 ? "text-success" : "text-danger",
                            )}
                          >
                            {formatSignedUsd(openPL)}
                            {openPLPct != null && ` (${openPLPct.toFixed(1)}%)`}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={symbolHubPath(symbol, "overview")}
                          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground"
                        >
                          Research
                        </Link>
                        <Link
                          href={symbolHubPath(symbol, "position")}
                          className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-foreground"
                        >
                          Position
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
