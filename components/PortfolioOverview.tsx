"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
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
  positionCostBasis,
  positionOpenProfitLoss,
  positionOpenProfitLossPct,
  sumCostBasis,
  sumOpenProfitLoss,
  sumPortfolioWeight,
} from "@/lib/positionMetrics";
import { cn } from "@/lib/utils";

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

function buildSymbolSummaries(
  positionMap: PositionMap,
  liquidationValue?: number | null,
): SymbolSummary[] {
  return Object.entries(positionMap)
    .map(([symbol, positions]) => {
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
    })
    .sort((a, b) => b.totalValue - a.totalValue);
}

export function PortfolioOverview({
  loading,
  allPositions,
  positionMap,
  liquidationValue,
  symbolAlertMap = {},
  className,
}: Props) {
  const { authorized: schwabAuthorized, loading: schwabLoading } =
    useSchwabStatus();
  const {
    connect: connectSchwab,
    connecting: schwabConnecting,
    connectError: schwabConnectError,
    clearConnectError: clearSchwabConnectError,
  } = useSchwabConnect();

  const handleConnectSchwab = () => {
    clearSchwabConnectError();
    void connectSchwab();
  };

  const symbolSummaries = buildSymbolSummaries(positionMap, liquidationValue)
    .sort((a, b) => {
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
    });

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
      <h2 className="mb-3 text-sm font-semibold text-foreground">Holdings</h2>

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
                  className="border-t border-border transition-colors hover:bg-muted-bg/40"
                >
                  <td className="px-4 py-3 text-left">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/portfolio/positions/${symbol}`}
                        className="font-mono font-medium text-foreground hover:text-accent-strong"
                      >
                        {symbol}
                      </Link>
                      {symbolAlertMap[symbol] && (
                        <AlertBadge summary={symbolAlertMap[symbol]} compact />
                      )}
                      <Link
                        href={`/research/${symbol}/overview`}
                        className="text-[10px] font-medium text-muted hover:text-accent-strong"
                      >
                        Research
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
                    {costBasis != null ? `$${costBasis.toLocaleString()}` : "—"}
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

              return (
            <div
              key={symbol}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted-bg/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/portfolio/positions/${symbol}`}
                    className="font-mono font-medium text-foreground hover:text-accent-strong"
                  >
                    {symbol}
                  </Link>
                  {symbolAlertMap[symbol] && (
                    <AlertBadge summary={symbolAlertMap[symbol]} compact />
                  )}
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <p className="text-xs text-muted">
                    {positions.length}{" "}
                    {positions.length === 1 ? "position" : "positions"}
                    {weightPct != null && ` · ${weightPct.toFixed(1)}%`}
                  </p>
                  <Link
                    href={`/research/${symbol}/overview`}
                    className="text-[10px] font-medium text-muted hover:text-accent-strong"
                  >
                    Research
                  </Link>
                </div>
                {costBasis != null && (
                  <p className="mt-1 text-[11px] text-muted">
                    Cost {formatUsd(costBasis)}
                  </p>
                )}
              </div>
              <Link
                href={`/portfolio/positions/${symbol}`}
                className="text-right"
              >
                <p className="tabular-nums font-medium">
                  ${totalValue.toLocaleString()}
                </p>
                {openPL != null && (
                  <p
                    className={cn(
                      "text-xs tabular-nums",
                      openPL >= 0 ? "text-success" : "text-danger",
                    )}
                  >
                    Open {formatSignedUsd(openPL)}
                    {openPLPct != null && ` (${openPLPct.toFixed(1)}%)`}
                  </p>
                )}
                <p
                  className={cn(
                    "text-xs tabular-nums",
                    dayPL >= 0 ? "text-success" : "text-danger",
                  )}
                >
                  Today {formatSignedUsd(dayPL)}
                </p>
              </Link>
            </div>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
